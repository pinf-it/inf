
'use strict';

exports.inf = async function (inf) {

    let formatter = null;

    return {

        invoke: function (pointer, value) {

            if (pointer === "formatter") {

                formatter = value;

            } else
            if (pointer === "echo") {

                let message = formatter(value);

                process.stdout.write(message + "\n");
            }
        }
    };
}
