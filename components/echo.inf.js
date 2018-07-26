
'use strict';

exports.inf = async function (inf) {

    return {

        invoke: function (pointer, instruction) {

            process.stdout.write(instruction + "\n");
        }
    };
}
