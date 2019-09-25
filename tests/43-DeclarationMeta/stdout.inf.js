
'use strict';

exports.inf = async function (inf) {

    let formatter = null;

    return {

        setFormatter: async function (getter) {
            formatter = await getter();
        },

        wrapGreeting: function (greeting) {
            return greeting;
        },

        invoke: async function (pointer, value) {

            if (pointer === "echo()") {

                let message = formatter(value);

                process.stdout.write(message + "\n");
    
                return true;
            } else
            if (pointer === "echo2()") {

                if (typeof value.value === 'function') {
                    value.value = (await value.value()).value;
                }

                let message = `${value.value} [line: ${value.meta.line}, column: ${value.meta.column}, pos: ${value.meta.pos}, file: ${value.meta.file}]`;

                process.stdout.write(message + "\n");

                return true;
            }
        }
    };
}
