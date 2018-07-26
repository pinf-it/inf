
'use strict';

exports.inf = async function (inf) {

    let mode = null;

    return {

        invoke: function (pointer, instruction) {

            if (pointer === "mode") {

                mode = instruction;

            } else
            if (pointer === "format") {

                if (mode === "UPPERCASE") {

                    return instruction.toUpperCase();
                }
            }
        }
    };
}
