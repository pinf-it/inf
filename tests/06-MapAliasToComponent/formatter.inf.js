
'use strict';

exports.inf = async function (inf) {

    let mode = null;

    return {

        invoke: function (pointer, value) {

            if (pointer === "mode") {

                mode = value;

            } else
            if (pointer === "format") {

                if (mode === "UPPERCASE") {

                    return value.toUpperCase();
                }
            }
        }
    };
}
