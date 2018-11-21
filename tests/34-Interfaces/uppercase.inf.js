
'use strict';

exports.inf = async function (inf) {

    return {

        interface: function (alias, node) {

            return async function (value) {

                value.value = value.value.toUpperCase();

                return value;
            }
        }
    };
}
