
'use strict';

exports.inf = async function (inf) {

    return {

        id: "tests/*/message",

        contract: function (alias, node) {

console.log("NODE", node);


            return async function (value) {

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
        }
    };
}
