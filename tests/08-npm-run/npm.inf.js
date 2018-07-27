
'use strict';

exports.inf = async function (inf) {

    const SPAWN = require("child_process").spawn;

    return {

        invoke: function (pointer, value) {

            if (pointer === "run") {

                return new Promise(function (resolve, reject) {

                    var proc = SPAWN("npm", [
                        'run',
                        value
                    ], {
                        cwd: inf.cwd,
                        stdio: [
                            "ignore",
                            "inherit",
                            "inherit"
                        ]
                    });
                    proc.on('error', reject);
                    proc.on('close', function (code) {
                        if (code !== 0) {
                            return reject(new Error("Process exited with code: " + code));
                        }
                        resolve(null);
                    });
                });

            } else {
                throw new Error("Pointer '" + pointer + "' not found in component '" +  __filename + "'!");
            }
        }
    };
}
