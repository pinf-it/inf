
'use strict';

exports.inf = async function (inf) {

    const SPAWN = require("child_process").spawn;

    let testDir = null;

    async function ensureDependencies () {

        // TODO: Install bash.origin.test if not found.
    }

    return {

        invoke: async function (pointer, value) {

            if (pointer === "dir") {

                testDir = value.value;

            } else
            if (pointer === "run") {

                await ensureDependencies();

                return new Promise(function (resolve, reject) {

                    let env = {};
                    // Remove existing bash.origin.test variables in case a test is calling
                    // another set of tests.
                    Object.keys(process.env).forEach(function (name) {
                        if (/^BO_TEST_/.test(name)) return;
                        env[name] = process.env[name];
                    });

                    var proc = SPAWN("bash.origin.test", [
                        testDir
                    ], {
                        cwd: inf.cwd,
                        env: env,
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
