
'use strict';

exports.inf = async function (inf) {

    return {

        Message: function (message) {

            if (Array.isArray(message)) {
                return {
                    messages: message
                };
            }

            return {
                messages: [
                    message
                ]
            };
        },

        /*
        // NOTE: The code below is equivalent to the code above where above
        //       the contract provides the interface wrapper.

        interface: function (alias, node) {
            return async function (value) {
                if (value.contract[0] === "Message") {
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
        */
    };
}
