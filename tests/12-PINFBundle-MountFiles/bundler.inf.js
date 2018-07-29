
'use strict';

exports.inf = async function (inf) {

    var fs = {};

    return {

        invoke: async function (pointer, value) {

            if (pointer === 'bundle') {
// --------------------------------------------------
return `PINF.bundle("", function (require) {
${Object.keys(fs).map(function (filepath) {
        return `    require.memoize("${filepath}", ${fs[filepath]});`
    }).join("\n")}
});`
// --------------------------------------------------
            } else
            if (/^\//.test(pointer)) {

                if (value.value) {
                    if (typeof value.value === 'function') {
                        value = await value.value();
                    }
// --------------------------------------------------
fs[pointer] = `function (require, exports, module) {
${value.toString()}
    }`
// --------------------------------------------------
                }
            } else {
                throw new Error("Pointer '" + pointer + "' not found in component '" +  __filename + "'!");
            }
        }
    };
}
