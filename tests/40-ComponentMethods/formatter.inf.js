
'use strict';

exports.inf = async function (inf) {

    let mode = null;

    return {

        setMode: function (_mode) {
            mode = _mode;
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
