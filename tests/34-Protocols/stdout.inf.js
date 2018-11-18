
'use strict';

exports.inf = async function (inf) {

    return {

        invoke: function (pointer, value) {

            if (pointer === "out") {

                process.stdout.write(value.value.messages.join("\n") + "\n");

                return true;
            }
        }
    };
}
