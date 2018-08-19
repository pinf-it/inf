
'use strict';

exports.inf = async function (inf) {

    return {

        invoke: async function (pointer, value) {

            value = value.value;

            if (pointer === "format") {

                return value.toUpperCase();
            }
        },

        toJavaScript: (javascript () >>>

            exports.format = function (value) {

                return value.toUpperCase();
            }
        <<<)
    };
}
