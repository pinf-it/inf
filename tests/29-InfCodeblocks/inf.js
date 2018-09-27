
'use strict';

exports.inf = async function (inf) {

    let message = null;

    return {

        invoke: async function (pointer, value) {

            if (pointer === "message") {

                message = value.toString();

                return true;
            } else
            if (pointer === "run") {
                
                return inf.run(await value.toInstructions({
                    message: message
                }));
            }
        }
    };
}
