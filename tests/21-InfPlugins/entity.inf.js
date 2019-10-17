
'use strict';

exports.inf = async function (inf) {

    return {

        getPrefix () {
            return "EP:";
        },

        invoke: function (pointer, value) {

            if (pointer === "echo") {

                // Added by plugin
                value = inf.capitalize(value.toString());

                process.stdout.write(value + "\n");

                return true;
            }
        }
    };
}
