
'use strict';

let harnessCount = 0;

exports.inf = async function (inf, alias) {

    harnessCount++;

    console.log('[readme.com] Init harness with alias:', alias, harnessCount);

    return {

        interface: function (alias, node) {

            console.log('[readme.com] Init interface with alias:', alias);

            return async function (value) {

                value.value = value.value + ' (via interface)';

                return value;
            }
        },

        generate: function (value) {

            console.log("[readme.com] generate():", value);
        }
    };
}
