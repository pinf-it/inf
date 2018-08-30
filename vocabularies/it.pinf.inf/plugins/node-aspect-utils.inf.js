
'use strict';

exports.inf = async function (inf) {

    return {

        ComponentInitContext: {

            constructor: function (namespace) {
                let self = this;

                let forNode = self.forNode;
                self.forNode = function (node) {
                    let context = forNode(node);
                    
                    context.getNodeAspect = function (aspect, args) {
                        if (typeof node.impl[aspect] !== "function") {
                            throw new Error(`Aspect '${aspect}' for node '${node.path}' does not seem to be a codeblock!`);
                        }
                        let codeblock = node.impl[aspect]();
                        if (
                            !codeblock ||
                            codeblock['.@'] !== 'github.com~0ink~codeblock/codeblock:Codeblock'
                        ) {
                            throw new Error(`Aspect '${aspect}' for node '${node.path}' is not a codeblock!`);
                        }
            
                        try {
                            return codeblock.compile(args).getCode();
                        } catch (err) {
                            console.error(err);
                            throw new Error(`Error while compiling codeblock for node aspect '${aspect}' for node '${node.path}'`);
                        }
                    }
            
                    context.expandNodeAspectsTo = async function (aspectRe, baseDir, args) {
            
                        let aspects = Object.keys(node.impl).filter(function (key) {
                            return aspectRe.test(key);
                        });
            
                        await inf.LIB.Promise.map(aspects, async function (aspect) {
            
                            let path = inf.LIB.PATH.join(baseDir, aspect);
            
                            let compileArgs = args;
                            if (typeof compileArgs === "function") {
                                compileArgs = function (key) {
                                    return args(aspect, key);
                                }
                            }
            
                            let code = context.getNodeAspect(aspect, compileArgs);
            
                            // TODO: Fix codeblock inconsistency when dealing with newlines.
                            await inf.LIB.FS.outputFileAsync(path, code + '\n', "utf8");
                        });
                    }

                    return context;
                }
            }
        }

    };
}
