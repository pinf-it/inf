
'use strict';

exports.inf = async function (inf) {

    return {

        invoke: async function (pointer, value) {

            if (pointer === "echo") {
                
                process.stdout.write(value.toString() + "\n");
            }
        }
    };
}
