
'use strict';

exports.inf = async function (INF) {

    let impl = null;

    return {

        invoke: function (pointer, value) {

            if (pointer === "setImplementation()") {

                const codeblock = value.value;

                impl = async function (vars) {
                    return INF.runCodeblock(codeblock, vars);
                };
                return true;
            }
        },

        run: async function () {
            return await impl({
                opts: {
                    size: INF.LIB.FS.statSync('main.sh').size
                }
            });
        }
    };
}
