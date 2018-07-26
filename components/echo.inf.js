
'use strict';

exports.inf = async function (inf) {

    return {

        invoke: function (instruction) {

            process.stdout.write(instruction + "\n");

        }
    };
}
