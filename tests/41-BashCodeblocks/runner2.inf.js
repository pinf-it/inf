
'use strict';

exports.inf = async function (INF) {

    let impl = null;

    return {

        setImplementation: function (codeblock) {
            impl = async function (vars) {
                return INF.runCodeblock(codeblock, vars);
            };
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
