
'use strict';

exports.inf = async function (inf) {

    let on = {
        turn: []
    };

    // We trigger all 'turn' handlers after all inf instructions are parsed.
    inf.on("parsed", function async () {

        return inf.LIB.Promise.mapSeries(on.turn, function (handler) {

            // TODO: Track which files are used to run tests and only re-run tests if
            //       a file has changed.
            // TODO: Check CLI option or ENV variable to force calling all handlers.

            return handler();
        });
    });

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

            } else
            if (pointer === "on.turn") {

                on.turn.push(value);
                
            } else {
                throw new Error("Pointer '" + pointer + "' not found in component '" +  __filename + "'!");
            }
        }
    };
}
