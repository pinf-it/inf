
'use strict';

exports.inf = async function (inf, alias) {

    return {

        configure: function (value) {

            return {
                // TODO: When 'alias' is an object use method to just get second namespace part
                apiContract: alias,
                message: `[${value.prefix}] ` + value.message,
                run: function (config) {

                    process.stdout.write(`${config.message}\n`);                    
                }
            };
        }
    };
}
