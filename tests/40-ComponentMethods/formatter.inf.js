
'use strict';

exports.inf = async function (inf) {

    let mode = null;

    return {

        set: function (type, value) {
            if (type === 'mode') {
                mode = value;
            }
        },

        getFormatter: function () {
            return function (value) {
                if (mode === "UPPERCASE") {
                    value = value.toUpperCase();
                }
                return value;
            }
        }
    };
}
