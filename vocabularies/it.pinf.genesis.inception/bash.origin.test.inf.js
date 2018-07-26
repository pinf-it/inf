
'use strict';

exports.inf = async function (inf) {

    const SPAWN = require("child_process").spawn;

    let testDir = null;

    async function ensureDependencies () {

        // TODO: Install bash.origin.test if not found.
    }

    return {

        invoke: async function (pointer, instruction) {

            if (pointer === "dir") {

                testDir = instruction;

            } else
            if (pointer === "run") {

                await ensureDependencies();

                return new Promise(function (resolve, reject) {

                    var proc = SPAWN("bash.origin.test", [
                        testDir
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