
'use strict';

exports.inf = async function (inf) {
   
    return {

        Component: {

            invoke: async function (pointer, value) {
                let self = this;

                if (pointer === "reflect") {
                    
                    let reflectionDir = inf.LIB.PATH.dirname(self.path);

                    if (value.value === "expand") {

                        function varPlaceholder (key) {
                            const val = new String(`%%%${key}%%%`);
                            val.replaceVariables = false;
                            return val;
                        }
    
                        return inf.expandNodeAspectsTo(/^\//, reflectionDir, function (aspect, key) {
    
                            if (aspect === '/.NOTES.md') {
                                var keyParts = key.match(/^([^\[]+)\['([^']+)'\]$/);
    
                                if (keyParts[1] === 'size') {
                                    if (
                                        keyParts[2] === '/.NOTES.md' ||
                                        keyParts[2] === '/.ui.js'
                                    ) {
                                        return inf.getNodeAspect(keyParts[2], varPlaceholder).length;
                                    }
                                    if (!inf.LIB.FS.existsSync(inf.LIB.PATH.join(reflectionDir, keyParts[2]))) {
                                        return '0';
                                    }
                                    return inf.LIB.FS.statSync(inf.LIB.PATH.join(reflectionDir, keyParts[2])).size;
                                } else
                                if (keyParts[1] === 'code') {
                                    if (
                                        keyParts[2] === '/.NOTES.md' ||
                                        keyParts[2] === '/.ui.js'
                                    ) {
                                        let code = inf.getNodeAspect(keyParts[2], varPlaceholder);
                                        code = new String(code);
                                        code.replaceVariables = false;
                                        return code;
                                    }
                                    if (!inf.LIB.FS.existsSync(inf.LIB.PATH.join(reflectionDir, keyParts[2]))) {
                                        return '';
                                    }
                                    let code = inf.LIB.FS.readFileSync(inf.LIB.PATH.join(reflectionDir, keyParts[2]), 'utf8');
                                    if (keyParts[2] === '/bundle.inf.js') {
                                        code = new String(code);
                                        code.replaceVariables = false;
                                    }
                                    return code;
                                }
    
                                throw new Error(`No value for key '${key}' in aspet '${aspect}'!`);
                            }
                        });
                    } else
                    if (value.value === "contract") {
    
                        let code = await inf.LIB.FS.readFileAsync(inf.LIB.PATH.join(reflectionDir, '/.ui.js'), 'utf8');
                        let bundlePath = inf.LIB.PATH.join(reflectionDir, '/bundle.inf.js');
                        let bundle = await inf.LIB.FS.readFileAsync(bundlePath, 'utf8');
    
                        // TODO: Fix codeblock parsing so we can use codeblock syntax in regexp without interference.
                        let indentRe = new RegExp('^([\\s\\t]*)"\\/\\.ui\\.js": \\(javascript \\(\\) >' + '>>', 'm');
                        let indent = bundle.match(indentRe)[1];
                        if (/\s$/.test(indent)) {
                            indent += '    ';   // 4 spaces soft tab
                        } else
                        if (/\s$/.test(indent)) {
                            indent += ' ';      // 1 hard tab
                        }
                        code = code.split("\n").map(function (line, i) {
                            return indent + line;
                        });
                        code = code.slice(1, code.length - 2).join("\n").replace(/(^\n|\n$)/g, "");
    
                        // TODO: Fix codeblock parsing so we can use codeblock syntax in regexp without interference.
                        let bundleRe = new RegExp('("\\/\\.ui\\.js": \\(javascript \\(\\) >' + '>>\\s*\\n)[\\s\\S]+?(\\s*<<' + '<\\),)');
                        bundle = bundle.replace(bundleRe, "$1" + code + "$2");
    
                        await inf.LIB.FS.writeFileAsync(bundlePath, bundle, 'utf8');
    
                        return;
                    }

                    throw new Error("NYI");
                }

                return this.invoke(pointer, value);
            }            
        }
    };
}
