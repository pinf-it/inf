
'use strict';

exports.inf = async function (inf) {

    return {

        protocol: function (alias, node) {

            return async function (value) {

                value.value = {
                    messages: [
                        value.value
                    ]
                };

                return value;
            }
        }
    };
}