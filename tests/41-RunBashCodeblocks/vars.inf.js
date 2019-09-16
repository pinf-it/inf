
'use strict';

exports.inf = async function (INF) {

    const vars = {};

    return {

        set: function (name, value) {
            if (
                typeof value === 'object' &&
                value['.@'] === 'github.com~0ink~codeblock/codeblock:Codeblock'
            ) {
                const origValue = value;
                value = async function () {
                    return INF.runCodeblock(origValue, {});
                };
            }
            vars[name] = value;
        },

        vars: function () {
            return function (path) {
                if (!path.length) return vars;
                return INF.LIB.LODASH.get(vars, path);
            };
        }
    };
}
