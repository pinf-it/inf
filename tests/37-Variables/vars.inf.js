
'use strict';

exports.inf = async function (inf) {

    const vars = {};

    return {

        existingValue: function (value) {
            if (Object.keys(vars).filter(function (name) {
                return (vars[name] === value);
            }).length) {
                return value;
            }
            throw new Error(`Value '${value}' does not exist in 'vars'!`);
        },

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
