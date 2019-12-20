
'use strict';

exports.forNamespace = async function (namespace) {

    return {
        forInstance: async function (impl, context) {

            const implInst = await impl({
                // programContext
            });

            return {

                invoke: function (pointer, value) {

                    value.value = value.value + ' (via adapter)';

                    return implInst({
                        pointer: pointer,
                        value: value
                    });
                }
            };
        }
    }
}

/*
exports.inf = async function (inf) {

    return {

        invoke: function (pointer, value) {

            if (pointer === "echo") {

                process.stdout.write(value + "\n");

                return true;
            }
        }
    };
}

exports['my-adapter'] = function (programContext) {

    return function (instanceContext) {

        if (instanceContext.pointer === "echo") {

            process.stdout.write(instanceContext.value + "\n");

            return true;
        }
    };
}
*/
