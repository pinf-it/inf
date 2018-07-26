
'use strict';

exports.inf = async function (inf) {

    let options = {};

    return {

        invoke: function (pointer, instruction) {

            if (pointer === "prefix") {

                options.prefix = instruction;

            } else
            if (pointer === "options") {

                Object.keys(instruction).map(function (name) {
                    options[name] = instruction[name];
                });

            } else
            if (pointer === "echo") {

                process.stdout.write(options.prefix + instruction + options.suffix + "\n");
            }
        }
    };
}
