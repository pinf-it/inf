
'use strict';

exports.inf = async function (inf) {

    let mode = null;

    return {

        invoke: async function (pointer, value) {

            value = value.value;

            if (pointer === "mode") {

                mode = value;

                return true;
            } else
            if (pointer === "format") {

                if (mode === "UPPERCASE") {

                    return value.toUpperCase();
                }
            }
        },

        toJavaScript: function () {
            return `
                let mode = ${JSON.stringify(mode)};

                exports.format = function (value) {

                    if (mode === "UPPERCASE") {

                        return value.toUpperCase();
                    }
                }
            `
        }
    };
}
