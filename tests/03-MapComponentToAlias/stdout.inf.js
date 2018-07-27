
'use strict';

exports.inf = async function (inf) {

    return {

        invoke: function (pointer, value) {

            if (pointer === "echo") {

                process.stdout.write(value + "\n");
            }
        }
    };
}
