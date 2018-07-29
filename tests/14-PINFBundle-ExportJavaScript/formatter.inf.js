
'use strict';

exports.inf = async function (inf) {

    let mode = null;

    return {

        invoke: async function (pointer, value) {

            value = value.value;

            if (pointer === "mode") {

                mode = value;

            } else
            if (pointer === "format") {

                if (mode === "UPPERCASE") {

                    return value.toUpperCase();
                }
            }
        },

        toJavaScript: function () {

            return `
                exports.format = function () {

                }            
            `
        }
    };
}
