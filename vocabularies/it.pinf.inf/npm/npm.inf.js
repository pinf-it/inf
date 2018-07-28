
'use strict';

exports.inf = async function (inf) {

    const SPAWN = require("child_process").spawn;

    return {

        invoke: function (pointer, value) {

            if (pointer === "test") {

                return new Promise(function (resolve, reject) {

                    var proc = SPAWN("npm", [
                        'run',
                        'test'
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
