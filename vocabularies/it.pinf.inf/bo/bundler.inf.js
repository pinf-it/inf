
'use strict';

exports.inf = async function (inf) {

    const RUNBASH = require("runbash");

    const options = {};

    return {

        invoke: async function (pointer, value) {

            if (/^set\(\)\s*/.test(pointer)) {
                let name = pointer.replace(/^set\(\)\s*/, '');
                let val = value.value;
                if (/^\./.test(val)) {
                    val = inf.LIB.PATH.join(value.meta.file, val);
                } else
                if (!/^\//.test(val)) {
                    val = inf.LIB.PATH.resolve(inf.rootDir, val);
                }
                inf.LIB.LODASH.set(options, [name], val);
                return true;
            } else
            if (pointer === 'nodejs-script') {

                let srcFilepath = value.toString();

                function makeTargetFilepath (type) {
                    const path = srcFilepath.replace(/\.js$/, "." + type + ".js");
                    if (options.targetBasePath) {
                        return inf.LIB.PATH.join(options.targetBasePath, path);
                    }
                    return path;
                }

                return RUNBASH(`
                    PATH="${inf.LIB.PATH.join(__dirname, "../../../node_modules/.bin")}:$PATH"

                    browserify \
                        --node \
                        --ignore-missing \
                        ${srcFilepath} \
                        -o ${makeTargetFilepath("bundle")}

                    babel \
                        --presets=@babel/env \
                        --plugins @babel/transform-runtime \
                        ${makeTargetFilepath("bundle")} \
                        --compact false \
                        --out-file ${makeTargetFilepath("bundle.es5")}

                    uglifyjs \
                        -o ${makeTargetFilepath("bundle.es5.min")} \
                        ${makeTargetFilepath("bundle.es5")}

                    node --eval '
                        const FS = require("fs");
                        function prependShebang (filename) {
                            let code = FS.readFileSync(filename, "utf8");
                            code = "#!/usr/bin/env node\\n" + code;
                            FS.writeFileSync(filename, code, "utf8");
                        }
                        prependShebang("${makeTargetFilepath("bundle")}");
                        prependShebang("${makeTargetFilepath("bundle.es5")}");
                        prependShebang("${makeTargetFilepath("bundle.es5.min")}");
                    '

                `.split("\n"), {
                    progress: true
                });

            } else {
                throw new Error("Pointer '" + pointer + "' not found in component '" +  __filename + "'!");
            }
        }
    };
}
