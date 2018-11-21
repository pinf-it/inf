
'use strict';

exports.inf = async function (inf) {

    return {

        id: "tests/*/stream",

        interface: function (alias, node) {

            return async function (value) {

                value.value = {
                    messages: [
                        value.value
                    ]
                };

                return value;
            }
        }
    };
}
