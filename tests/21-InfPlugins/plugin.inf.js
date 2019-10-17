
'use strict';

exports.inf = async function (inf) {

    let prefix = null;

    return {

        getPrefix () {
            return "PP:";
        },

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

                        async function getPrefix () {
                            let prefix = null;
                            try {
                                prefix = await orig.invoke("getPrefix", {
                                    value: undefined
                                });
                                prefix = "noooo";
                            } catch (err) {
                                if (/Invocation for pointer 'getPrefix' is not supported in component/.test(err.message)) {
                                    prefix = await orig.invoke("getPrefix()", {
                                        value: undefined
                                    });
                                } else {
                                    throw err;
                                }
                            }
                            return prefix;
                        }

                        value.value = (await getPrefix()) + prefix + value.value;

                        return orig.invoke(pointer, value);
                    }            
                }
            };
        }
    };
}
