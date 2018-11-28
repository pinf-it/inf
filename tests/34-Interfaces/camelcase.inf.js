
'use strict';

exports.inf = async function (inf) {

    return {

        interface: function (alias, node) {

            return async function (value) {

                value.value = value.value.split(" ").map(function (word) {
                    return `${word.substring(0, 1).toUpperCase()}${word.substring(1).toLowerCase()}`;
                }).join(" ");

                return value;
            }
        }
    };
}
