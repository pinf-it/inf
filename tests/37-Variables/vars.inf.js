
'use strict';

exports.inf = async function (inf) {

    const vars = {};

    return {

        invoke: function (pointer, value) {

            if (/^set\s/.test(pointer)) {
                vars[pointer.replace(/^set\s+/, "")] = value.value;
                return true;
            } else
            if (pointer === "vars") {

                return function (path) {

                    return inf.LIB.LODASH.get(vars, path);
                }
            }
        }
    };
}
