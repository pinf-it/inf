
'use strict';

exports.inf = async function (inf) {

    let on = {
        turn: []
    };

    // We trigger all 'turn' handlers after all inf instructions are parsed.
    inf.on("processed", function () {

        return inf.LIB.Promise.mapSeries(on.turn, function (handler) {

            // TODO: Track which files are used to run tests and only re-run tests if
            //       a file has changed.
            // TODO: Check CLI option or ENV variable to force calling all handlers.

            return handler.value();
        });
    });

    return {

        invoke: async function (pointer, value) {

            if (pointer === "js") {

                return inf.toPINFBundle("JavaScript");

            } else
            if (pointer === "reps") {

                return inf.toPINFBundle("JSONRep", {
                    ext: ".rep.js"
                });

            } else
            if (pointer === "run") {

                if (typeof value.value === "function") {
                    value = await value.value();
                }

                return true;
            } else
            if (pointer === "echo") {

                if (typeof value.value === "function") {
                    value = await value.value();
                }

                if (value.value instanceof Buffer) {
                    value = value.value.toString();
                } else {
                    value = value.toString();
                }

                process.stdout.write(value + "\n");

                return true;
            } else
            if (pointer === "stderr") {

                if (typeof value.value === "function") {
                    value = await value.value();
                }

                if (value.value instanceof Buffer) {
                    value = value.value.toString();
                } else {
                    value = value.toString();
                }

                process.stderr.write(value + "\n");

                return true;
            } else
            if (/^\//.test(pointer)) {

                let path = inf.LIB.PATH.join(inf.rootDir, pointer);

                return inf.LIB.FS.readFileAsync(path);

            } else
            if (pointer === "on.turn") {

                on.turn.push(value);

                return true;
            } else {
                throw new Error("Pointer '" + pointer + "' not found in component '" +  __filename + "'!");
            }
        }
    };
}
