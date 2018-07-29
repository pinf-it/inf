
'use strict';

exports.inf = async function (inf) {

    let formatter = null;

    return {

        invoke: async function (pointer, value) {

            value = value.value;

            if (pointer === "formatter") {

                formatter = value;

            } else
            if (pointer === "echo") {

                let message = await formatter(value);
                
                process.stdout.write(message.toString() + "\n");
            }
        },

        toJavaScript: function () {

            return `
                exports.echo = function () {

                }            
            `
        }
    };
}
