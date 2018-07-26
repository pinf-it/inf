
'use strict';

exports.inf = async function (inf) {

    let formatter = null;

    return {

        invoke: function (pointer, instruction) {

            if (pointer === "formatter") {

                formatter = instruction;

            } else
            if (pointer === "echo") {

                let message = formatter(instruction);

                process.stdout.write(message + "\n");
            }
        }
    };
}
