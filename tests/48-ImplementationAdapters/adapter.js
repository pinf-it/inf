
'use strict';

exports.forInstance = async function (namespace, impl, context) {

    const implInst = await impl({
        // programContext
    });

    return {

        invoke: function (pointer, value) {

            value.value = value.value + ' (via adapter)';

            return implInst({
                pointer: pointer,
                value: value
            });
        }
    };
}
