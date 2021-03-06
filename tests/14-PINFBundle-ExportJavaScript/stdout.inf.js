
'use strict';

exports.inf = async function (inf) {

    let formatter = null;

    return {

        invoke: async function (pointer, value) {

            if (pointer === "formatter") {

                formatter = value;

                return true;
            } else
            if (pointer === "echo") {

                let message = await formatter.value(value);
                
                process.stdout.write(message.toString() + "\n");

                return true;
            }
        },

        toJavaScript: function () {

            return `
                let formatter = require("${formatter.jsId}");

                exports.echo = function (value) {

                    let message = formatter.format(value);

                    console.log(message);
                }
            `
        }
    };
}
