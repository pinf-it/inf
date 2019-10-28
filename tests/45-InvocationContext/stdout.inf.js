
'use strict';

exports.inf = async function (inf) {

    let formatter = null;

    return {

        setFormatter: async function (getter) {

            formatter = await getter();
        },

        echo: function (message) {

            message = formatter(message);

            process.stdout.write(message + "\n");
        }
    };
}
