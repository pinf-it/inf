
'use strict';

exports.inf = async function (inf) {

    let options = {};

    return {

        invoke: function (pointer, value) {

            value = value.value;

            if (pointer === "prefix") {

                options.prefix = value;

                return true;
            } else
            if (pointer === "options") {

                Object.keys(value).map(function (name) {
                    options[name] = value[name];
                });

                return true;
            } else
            if (pointer === "echo") {

                process.stdout.write(options.prefix + value + options.suffix + "\n");

                return true;
            }
        }
    };
}
