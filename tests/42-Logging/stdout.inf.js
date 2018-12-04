
'use strict';

exports.inf = async function (inf) {

    let formatter = null;

    return {

        setFormatter: async function (getter) {

            formatter = await getter();

            inf.console.info('got formatter:', formatter);
        },

        echo: function (message) {

            message = formatter(message);

            inf.console.log('log message:', message);

            if (message.length > 5) {
                inf.console.warn('Message is longer than 5 characters!');
            }

            process.stdout.write(message + "\n");

            inf.console.error('Test error message!');
        }
    };
}
