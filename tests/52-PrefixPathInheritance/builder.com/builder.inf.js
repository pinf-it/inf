
'use strict';

exports.inf = async function (inf, alias) {

    return {

        interface: function (alias, node) {

            const interfacePrefix = (node.namespace.anchorPrefix && node.namespace.anchorPrefix.toString()) || '';

            return async function (value, pointer, context) {

                const prefix = (context.namespace.anchorPrefix && context.namespace.anchorPrefix.toString()) || '';

                value.value = `BUILT[${interfacePrefix}][${prefix}]: ${value.value}`;

                return value;
            }
        }
    };
}
