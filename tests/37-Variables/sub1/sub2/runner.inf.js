
'use strict';

exports.inf = async function (INF, ALIAS) {

    return {

        invoke: async function (pointer, value, options) {

            if (pointer === "run") {

                await options.callerNamespace.componentInitContext.load(value);

                return true;
            } else
            if (pointer === "run_root") {

                await INF.load(value);

                return true;
            }
        }
    };
}
