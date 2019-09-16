
'use strict';

exports.inf = async function (INF) {

    let impl = null;

    return {

        setImplementation: function (codeblock) {

            impl = async function (vars) {
                if (
                    codeblock['.@'] !== 'github.com~0ink~codeblock/codeblock:Codeblock' &&
                    codeblock.impl &&
                    codeblock.impl['.@'] === 'github.com~0ink~codeblock/codeblock:Codeblock'
                ) {
                    return INF.runCodeblock(codeblock.impl, vars);
                } else {
                    return INF.runCodeblock(codeblock, vars);
                }
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
