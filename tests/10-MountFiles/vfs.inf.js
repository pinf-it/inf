
'use strict';

exports.inf = async function (inf) {

    let fs = {};

    return {

        invoke: function (pointer, value) {

            value = value.value;

            if (/^\//.test(pointer)) {

                if (value) {

                    fs[pointer] = value;

                    return true;
                } else {

                    return fs[pointer];
                }
            }
        }
    };
}
