
'use strict';

exports.inf = async function (inf) {

    return {

        interface: function (alias, node) {

            return async function (value) {

                if (
                    value.interface[0] === "pattern.stream" &&
                    value.interface[1].alias === "pattern.stream" &&
                    value.interface[1].impl.id === "tests/*/stream"
                ) {

                    value.value = value.value.toUpperCase();

                    return value;
                }
            }
        }
    };
}
