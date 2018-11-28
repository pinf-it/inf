
'use strict';

exports.inf = async function (inf, alias) {

    return {
        invoke: function (pointer, value) {

            if (pointer === "get()") {
                return `[${alias}] Hello World`;
            }
        }
    };
}
