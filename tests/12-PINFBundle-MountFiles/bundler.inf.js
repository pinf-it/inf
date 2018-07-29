
'use strict';

exports.inf = async function (inf) {

    const PINF = require("pinf-loader-js");

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
            } else
            if (pointer === 'eval') {

                let bundle = (await value.value()).value;

                if (!/^PINF\.bundle\(/.test(bundle)) {
                    console.error("bundle", bundle);
                    throw new Error("Cannot eval() code as it is not a PINF bundle!");
                }

                await new Promise(function (resolve, reject) {
                    PINF.sandbox("", {
                        load: function (uri, loadedCallback) {
                            try {
                                eval(bundle);
                                loadedCallback(null);
                            } catch (err) {
                                console.error("bundle", bundle);
                                console.error("err", err);
                                loadedCallback(new Error("Error evaluating bundle!"));
                            }
                        }
                    }, function (sandbox) {

                        resolve(sandbox.main());

                    }, reject);
                });

            } else {
                throw new Error("Pointer '" + pointer + "' not found in component '" +  __filename + "'!");
            }
        }
    };
}
