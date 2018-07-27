
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

        invoke: function (pointer, value) {

            if (pointer === "on.turn") {

                on.turn.push(value);

            } else {
                throw new Error("Pointer '" + pointer + "' not found in component '" +  __filename + "'!");
            }
        }
    };
}
