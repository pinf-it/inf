
'use strict';

exports.inf = async function (inf, alias) {

    console.log("alias:", alias);

    return {
        invoke: function (pointer, value) {

            if (pointer === "log()") {
                console.log("log():", value.value);
                return true;
            }
        }
    };
}
