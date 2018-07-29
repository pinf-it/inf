
'use strict';

exports.inf = async function (inf) {

    let formatter = null;

    return {

        invoke: async function (pointer, value) {

            if (pointer === "formatter") {

                formatter = value;

            } else
            if (pointer === "echo") {

                let message = await formatter.value(value);
                
                process.stdout.write(message.toString() + "\n");
            }
        },

        toJavaScript: function () {

            return `
                let formatter = require("${formatter.moduleId}");

                exports.echo = function (value) {

                    let message = formatter(value);

                    console.log(message);
                }
            `
        }
    };
}
