
'use strict';

exports.inf = async function (inf) {

    let mode = null;

    return {

        set: function (type, value) {
            if (type === 'mode') {

                inf.log('set', type, value);

                mode = value;
            }
        },

        getFormatter: function () {
            return function (value) {

                inf.console.info(`format value '${value}' using mode '${mode}'`);

                if (mode === "UPPERCASE") {
                    value = value.toUpperCase();
                }
                return value;
            }
        }
    };
}
