
'use strict';

exports.inf = async function (inf) {

    const routes = {};

    return {

        invoke: function (pointer, value) {

            if (value.value === "run()") {

                console.log(routes[pointer]);
                return true;
            } else {

                routes[pointer] = value.value;
                return true;
            }
        }
    };
}
