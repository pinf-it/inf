
'use strict';

exports.inf = async function (INF) {

    const vars = {};

    return {

        set: function (name, value) {
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
