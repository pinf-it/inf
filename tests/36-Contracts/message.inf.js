
'use strict';

exports.inf = async function (inf) {

    return {

        id: "tests/*/message",

        contract: function (alias, node) {

            return async function (value) {

                value.value = await value.value;

                if (
                    typeof value.value === "object" &&
                    Object.keys(value.value).length === 1 &&
                    Array.isArray(value.value.messages)
                ) {
                    if (value.value.messages.filter(function (message) {
                        return !(typeof message === "string");
                    }).length) {
                        console.error("ERROR value", value.value);
                        throw new Error("Message object contains a non-string message!");
                    }
                } else
                if (typeof value.value !== "string") {
                    console.error("ERROR value", value.value);
                    throw new Error("Message is not a string nor a message object with string messages!");
                }

                return value;
            }
        },

        interfaceWrapper: function (interfaceComponent) {

            return function (alias, node) {

                return async function (value) {

                    if (typeof interfaceComponent.impl[value.contract[0]] !== "function") {
                        throw new Error(`Interface at '${interfaceComponent.alias}' does not export '${value.contract[0]}' as required by contract '${value.contract[1].impl.id}'!`);
                    }

                    // Only give the value to the interface implementation
                    value.value = interfaceComponent.invokeContractAliasMethod(value.contract[0], [value.value]);

                    return value;
                }
            };
        },

        invokeWrapper: function (component) {

            return function (alias) {

                return async function (pointer, value) {
                    
                    if (typeof component.impl[value.contract[0]] !== "function") {
                        return;
                    }

                    // Only give the value to the interface implementation
                    if (typeof value.value === "function") {
                        const orig = value.value;
                        value.value = async function (instruction) {
                            return (await orig(instruction)).value;
                        }
                    }

                    return component.invokeContractAliasMethod(value.contract[0], [pointer, value.value]);
                };
            };
        },

        getTestMessage: function () {
            return 'Hello World!';
        }
    };
}
