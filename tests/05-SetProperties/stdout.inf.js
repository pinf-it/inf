
'use strict';

exports.inf = async function (inf) {

    let options = {};

    return {

        invoke: function (pointer, value) {

            if (pointer === "prefix") {

                options.prefix = value;

            } else
            if (pointer === "options") {

                Object.keys(value).map(function (name) {
                    options[name] = value[name];
                });

            } else
            if (pointer === "echo") {

                process.stdout.write(options.prefix + value + options.suffix + "\n");
            }
        }
    };
}
