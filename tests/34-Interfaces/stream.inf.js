
'use strict';

exports.inf = async function (inf) {

    return {

        id: "tests/*/stream",

        interface: function (alias, node) {

            return async function (value) {

                let message = value.value;
                if (
                    typeof message === "object" &&
                    message.get instanceof inf.LIB.INF.Node
                ) {
                    message = (await message.get.value()).value;
                }

                value.value = {
                    messages: [
                        message
                    ]
                };

                return value;
            }
        }
    };
}
