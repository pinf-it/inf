
'use strict';

exports.inf = async function (inf) {

    const routes = {};
    let prefix = '';

    return {

        setPrefix: async function (getter) {
            prefix = await getter();
        },

        invoke: function (pointer, value) {

            if (value.value === "run() all") {

                console.log(prefix, routes[pointer]);
                return true;
            } else {

                routes[pointer] = value.value;
                return true;
            }
        }
    };
}
