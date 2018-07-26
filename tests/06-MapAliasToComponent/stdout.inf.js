
'use strict';

exports.inf = async function (inf) {

    return {

        invoke: function (pointer, instruction) {

            if (pointer === "echo") {

                process.stdout.write(instruction + "\n");
            }
        }
    };
}
