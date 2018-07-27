
'use strict';

exports.inf = async function (inf) {

    return {

        invoke: async function (pointer, value) {

            if (pointer === "echo") {

                if (typeof value === "function") {
                    value = await value();
                }
                process.stdout.write(value + "\n");

            } else
            if (/^\//.test(pointer)) {

                let path = inf.LIB.PATH.join(inf.cwd, pointer);
                return inf.LIB.FS.readFileAsync(path);

            } else {
                throw new Error("Pointer '" + pointer + "' not found in component '" +  __filename + "'!");
            }
        }
    };
}
