
'use strict';

exports.inf = async function (inf) {

    let formatter = null;

    return {

        setFormatter: async function (getter) {
            formatter = await getter();
        },

        invoke: async function (pointer, value) {

            if (pointer === "echo()") {

                let message = formatter(value);

                process.stdout.write(message + "\n");
    
                return true;
            }
        }
    };
}
