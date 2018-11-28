
'use strict';

exports.inf = function (inf, alias) {

    console.log("stdout alias:", alias);

    return {
        invoke: async function (pointer, value) {

            if (pointer === "log()") {

                let val = value.value;
                if (typeof val === "function") {
                    val = (await val()).value;
                }

                console.log(`[${alias}] log():`, val);
                return true;
            }
        }
    };
}
