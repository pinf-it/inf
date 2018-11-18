
'use strict';

exports.inf = async function (inf) {

    return {

        id: "tests/*/stream",

        protocol: function (alias, node) {

            return async function (value) {

                if (
                    value.protocol[0] === "pattern.stream" &&
                    value.protocol[1].alias === "pattern.stream" &&
                    value.protocol[1].impl.id === "tests/*/stream"
                ) {
                    value.value = {
                        messages: [
                            value.value
                        ]
                    };
    
                    return value;
                }
            }
        }
    };
}
