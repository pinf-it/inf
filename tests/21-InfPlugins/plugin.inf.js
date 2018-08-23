
'use strict';

exports.inf = async function (inf) {

    let prefix = null;

    return {

        invoke: function (pointer, value) {

            if (pointer === "prefix") {

                prefix = value.value;
            }
        },

        ComponentInitContext: {

            constructor: function (namespace) {
                let self = this;

                let forNode = self.forNode;
                self.forNode = function (node) {
                    let context = forNode(node);

                    context.capitalize = function (message) {
                        return message.toUpperCase();
                    }

                    return context;
                }
            }
        },

        Component: {

            invoke: async function (pointer, value) {
                let orig = this;

                value.value = prefix + value.value;

                return orig.invoke(pointer, value);
            }            
        }
    };
}
