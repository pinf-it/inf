
'use strict';

exports.inf = async function (inf) {

    return {

        invoke: function (pointer, value) {

            if (pointer === "echo") {

                process.stdout.write(value + "\n");

                return true;
            }
        }
    };
}

exports['my-adapter'] = function (programContext) {

    return function (instanceContext) {

        if (instanceContext.pointer === "echo") {

            process.stdout.write(instanceContext.value + "\n");

            return true;
        }
    };
}
