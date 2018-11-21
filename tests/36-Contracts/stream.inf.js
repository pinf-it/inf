
'use strict';

exports.inf = async function (inf) {

    return {

        interface: function (alias, node) {

            return async function (value) {

                if (
                    value.contract[0] === "Message" &&
                    value.contract[1].alias === "Message" &&
                    value.contract[1].impl.id === "tests/*/message"
                ) {
                    if (Array.isArray(value.value)) {
                        value.value = {
                            messages: value.value
                        };
                    } else {
                        value.value = {
                            messages: [
                                value.value
                            ]
                        };
                    }
                    return value;
                }
            }
        }
    };
}
