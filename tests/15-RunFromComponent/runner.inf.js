
'use strict';

exports.inf = async function (inf) {

    return {

        invoke: async function (pointer, value) {

            if (pointer === "run") {

                await inf.run(value.value + "inf.json");
            }
        }
    };
}
