
'use strict';

let harnessCount = 0;

exports.inf = async function (inf, alias) {

    harnessCount++;

    console.log('[builder.com] Init harness with alias:', alias, harnessCount);

    return {

        interface: function (alias, node) {

            console.log('[builder.com] Init interface with alias:', alias);

            return async function (value) {

                value.value = value.value + ' (via interface)';

                return value;
            }
        },

        build: function (value) {

            console.log("[builder.com] build():", value);
        }
    };
}
