
'use strict';

exports.inf = async function (INF, ALIAS) {

    return {

        invoke: async function (pointer, value) {

            if (pointer === "run") {

                return INF.load(value);
            }
        }
    };
}
