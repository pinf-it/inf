
'use strict';

exports.inf = async function (inf) {

    let prefix = null;

    return {

        invoke: function (pointer, value) {

            if (pointer === "prefix") {

                prefix = value.value;

                return true;
            }
        },

        ComponentInitContext: {

            constructor: function (namespace) {
                let self = this;

                let forNode = self.forNode;
                self.forNode = function () {
                    let context = forNode.apply(self, arguments);

                    context.capitalize = function (message) {
                        return message.toUpperCase();
                    }

                    return context;
                }
            }
        },

        inf: async function (inf) {
            
            return {
                Component: {

                    invoke: async function (pointer, value) {
                        let orig = this;

                        value.value = prefix + value.value;

                        return orig.invoke(pointer, value);
                    }            
                }
            };
        }
    };
}
