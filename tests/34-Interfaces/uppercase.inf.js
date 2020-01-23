
'use strict';

let harnessCount = 0;

exports.inf = async function (inf, harnessAlias) {

    harnessCount++;

    console.log("Loaded interface harness:", harnessAlias, harnessCount);

    let interfaceCount = 0;

    return {

        interface: function (alias, node) {

            interfaceCount++;

            console.log("Loaded interface:", alias, interfaceCount, `(${harnessAlias}:${harnessCount})`);

            return async function (value) {

                value.value = value.value.toUpperCase();

                return value;
            }
        }
    };
}
