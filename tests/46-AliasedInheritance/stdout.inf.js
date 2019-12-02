
'use strict';

exports.inf = async function (inf, alias) {

    let config = null;

    return {

        config: function (_config) {
            config = _config;
        },

        invoke: function (pointer, value) {

            if (pointer === "echo") {

                const message = `[${alias}] ` + value + ` (hostname: ${config.hostname})`;

                process.stdout.write(`${message}\n`);

                return message;
            }
        }
    };
}
