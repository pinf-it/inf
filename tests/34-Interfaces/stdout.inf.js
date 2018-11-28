
'use strict';

exports.inf = async function (inf) {

    let lastMessage = null;

    return {

        invoke: async function (pointer, value) {

            if (pointer === "out") {

                let val = value.value;
                if (typeof val === "function") {
                    val = (await val()).value;
                }
                
                lastMessage = val.messages[val.messages.length-1];

                process.stdout.write(val.messages.join("\n") + "\n");

                return true;
            } else
            if (pointer === "getlast") {

                return lastMessage;
            }
        }
    };
}
