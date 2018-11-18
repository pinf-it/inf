
'use strict';

exports.inf = async function (inf) {

    return {

        protocol: function (alias, node) {

            return async function (value) {

                const line = value.value.match(/^([^:]+):(.+)$/);

                if (line[1] === "uppercase") {
                    line[2] = line[2].toUpperCase();
                }

                value.value = {
                    messages: [
                        line[2]
                    ]
                };

                return value;
            }
        }
    };
}
