#!/usr/bin/env node

/*
TODO:
  * Check why 'npm test 01 --dev --debug' includes bash.origin so many times and the wrong one from outside the DL workspace.

*/

'use strict'

const CONSOLE = {};
Object.keys(console).forEach(function (name) {
    CONSOLE[name] = console[name];
});

const EventEmitter = require("events").EventEmitter;
const Promise = require("bluebird");
const PATH = require("path");
const FS = require("fs-extra");
Promise.promisifyAll(FS);
FS.existsAsync = function (path) {
    return new Promise(function (resolve) {
        return FS.exists(path, resolve);
    });
}
const GLOB = require("glob");
GLOB.async = Promise.promisify(GLOB);

const CLARINET = require("clarinet");
const CODEBLOCK = require("codeblock");
const CODEBLOCK_REQUIRE = CODEBLOCK.makeRequire(require, {
    cacheCompiled: true,
    stripComments: false,
    codeblockPackageUri: "codeblock"
});

const CRYPTO = require("crypto");
const MINIMIST = require("minimist");
const TRAVERSE = require("traverse");

const LODASH_GET = require("lodash/get");
const LODASH_VALUES = require("lodash/values");


// ####################################################################################################
// # Bootstrap
// ####################################################################################################

// TODO: Declare logger

function log () {
    if (!process.env.VERBOSE) return;
    var args = Array.from(arguments);
    args.unshift("[inf]");
    CONSOLE.log.apply(CONSOLE, args);
}

setImmediate(function () {
    if (
        // If running after being browserified
        (typeof require.main === "undefined") ||
        // If running in NodeJS
        require.main === module
    ) {
        async function main () {
            try {

                let cwd = process.cwd();
                let args = MINIMIST(process.argv.slice(2));
                if (args.verbose && !process.env.VERBOSE) {
                    process.env.VERBOSE = "1";
                }
                let filepath = args._[0];

                let inf = new INF(cwd, null, args);

                if (/^\{/.test(filepath)) {
                    await inf.runInstructions(filepath);
                } else {
                    await inf.runInstructionsFile(PATH.relative(cwd, PATH.resolve(filepath)));
                }

            } catch (err) {
                CONSOLE.error("[inf]", err);
                process.exit(1);
            }
        }
        main();
    }
});

// ####################################################################################################
// # Classes
// ####################################################################################################

class INF {

    constructor (baseDir, referringNamespace, options) {
        let self = this;

        self.baseDir = baseDir;
        self.referringNamespace = referringNamespace;
        self.options = options || {};
    }

    async runInstructionsFile (filepath) {
        let self = this;

        filepath = filepath.replace(/(^\.~|~infi\.log$)/g, "");

        let path = PATH.join(self.baseDir, filepath);
        let exists = await FS.existsAsync(path);

        if (!exists) {
            throw new Error("[inf] File '" + path + "' not found!");
        }

        log("Load file:", path);

        let instructions = await FS.readFileAsync(path, "utf8");

        return self.runInstructions(instructions, filepath);
    }

    async runInstructions (instructions, filepath) {
        let self = this;

        self.parser = new Parser(self.baseDir, filepath);
        // TODO: Instead of first populating 'instructionObjects' and then processing them we should
        //       process instruction objects as they come in. This will allow for faster processing of
        //       large instruction files.
        let instructionObjects = await self.parser.parseInstructions(instructions);

        self.namespace = new Namespace(self.baseDir, self.referringNamespace, self.options);
        self.processor = new Processor(self.namespace);

        if (filepath) {
            self.namespace.pathStack.push(PATH.join(self.baseDir, filepath));
            if (self.referringNamespace) {
                self.referringNamespace.pathStack.push(PATH.join(self.baseDir, filepath));
            }
        }

        await Promise.mapSeries(instructionObjects, await function (instructionObject) {

            // Replace variables
            instructionObject = instructionObject.replace(/%%([^%]+)%%/g, function () {

                if (/^\{.+\}$/.test(arguments[1])) {
                    // Executable expression
                    let args = self.options;
                    return eval(arguments[1].replace(/(^\{|\}$)/g, ""));
                } else {
                    // Simple varibale reference
                    return LODASH_GET({
                        args: self.options
                    }, arguments[1], arguments[0]);    
                }
            });

            instructionObject = instructionObject.split("\t");
            return self.processor.processInstruction(instructionObject[0], JSON.parse(instructionObject[1]));
        });

        if (!self.namespace.referringNamespace) {
            self.namespace.componentInitContext.emit("processed");
        }

        // TODO: Dump state
    }
}


class Parser {

    constructor (baseDir, filepath) {
        this.baseDir = baseDir;
        this.filepath = filepath;
        if (this.filepath) {
            this.infiFilepath = PATH.join(this.filepath, '..', '.~' + PATH.basename(this.filepath) + '~infi.log');
        }
    }

    async parseInstructions (instructions) {
        let self = this;

        let sourceExists = (self.filepath && await FS.existsAsync(PATH.join(self.baseDir, self.filepath)));
        let infiExists = (self.infiFilepath && await FS.existsAsync(PATH.join(self.baseDir, self.infiFilepath)));

        if (infiExists) {
            if (!sourceExists) return (await FS.readFileAsync(PATH.join(self.baseDir, self.infiFilepath), "utf8")).split("\n");
            if (
                (await FS.statAsync(PATH.join(self.baseDir, self.infiFilepath))).mtime >=
                (await FS.statAsync(PATH.join(self.baseDir, self.filepath))).mtime
            ) {
                return (await FS.readFileAsync(PATH.join(self.baseDir, self.infiFilepath), "utf8")).split("\n");
            }
        }

        let PARSER_EVENT_DEBUG = false;

        // Strip shebang
        instructions = instructions.replace(/^#!.+\n/, "");

        // Normalize codeblocks
        instructions = CODEBLOCK.purifyCode(instructions, {
            freezeToJSON: true
        }).toString();

        if (PARSER_EVENT_DEBUG) CONSOLE.log("[inf] Parser:parseInstructions(instructions)", instructions);

        let instructionObjects = [];

        // Parse JSON using SAX parser which allows for repeated keys.
        await new Promise(function (resolve, reject) {
            function onInstructionObject (obj) {
                instructionObjects.push(obj);
            }
            let parser = CLARINET.parser();
            parser.onerror = function (err) {
                CONSOLE.error("err", err); 
                CONSOLE.error("self.baseDir", self.baseDir);
                CONSOLE.error("filepath", self.filepath);
                CONSOLE.error("instructions", instructions);
                reject(new Error("Error parsing instructions!"));
            };
            let rootObj = null;
            let currentObject = null;
            let currentKey = null;
            let previousKeyStack = [];
            let previousObjectStack = [];
            parser.onopenobject = function (key) {
                if (PARSER_EVENT_DEBUG) CONSOLE.log("[inf] Parser:parseInstructions():parser:onopenobject", key);
                if (this.depth === 0) {
                    currentObject = rootObj = {};
                } else {
                    previousObjectStack.push(currentObject);

                    if (Array.isArray(currentObject)) {
                        let obj = {};
                        obj[key] = {}
                        currentObject.push(obj);
                        currentObject = obj;
                    } else {
                        currentObject = currentObject[currentKey] = {};
                    }
                    previousKeyStack.push(currentKey);
                }
                currentKey = key;
            };
            parser.onvalue = function (value) {
                if (PARSER_EVENT_DEBUG) CONSOLE.log("[inf] Parser:parseInstructions():parser:onvalue", value);
                if (currentKey === null) {
                    currentObject.push(value);
                } else {
                    currentObject[currentKey] = value;
                }
            };
            parser.onkey = function (key) {
                if (PARSER_EVENT_DEBUG) CONSOLE.log("[inf] Parser:parseInstructions():parser:onkey", key);
                if (this.depth === 1) {
                    onInstructionObject(rootObj);
                    currentObject = rootObj = {};
                }
                currentKey = key;
            };
            parser.oncloseobject = function () {
                if (PARSER_EVENT_DEBUG) CONSOLE.log("[inf] Parser:parseInstructions():parser:oncloseobject");
                if (this.depth === 1) {
                    onInstructionObject(rootObj);
                } else {
                    currentKey = previousKeyStack.pop();
                    currentObject = previousObjectStack.pop();
                }
            };
            parser.onopenarray = function () {
                if (PARSER_EVENT_DEBUG) CONSOLE.log("[inf] Parser:parseInstructions():parser:onopenarray");
                previousObjectStack.push(currentObject);
                currentObject = currentObject[currentKey] = [];
                previousKeyStack.push(currentKey);
                currentKey = null;
            };
            parser.onclosearray = function () {
                if (PARSER_EVENT_DEBUG) CONSOLE.log("[inf] Parser:parseInstructions():parser:onclosearray");
                currentKey = previousKeyStack.pop();
                currentObject = previousObjectStack.pop();
            };
            parser.onend = resolve;
            parser.write(instructions).close();            
        });

        instructionObjects = instructionObjects.map(function (instructionObject) {
            let key = Object.keys(instructionObject)[0];
            return [
                key,
                JSON.stringify(instructionObject[key])
            ].join("\t");
        });

        if (self.infiFilepath) {
            await FS.writeFileAsync(PATH.join(self.baseDir, self.infiFilepath), instructionObjects.join("\n"));
        }

        return instructionObjects;
    }
}


class Component {

    constructor (path) {
        let self = this;

        self.path = path;
    }

    async init (namespace) {
        let self = this;

        // TODO: Optionally inject seed into path hash to increase uniqueness of identical relpaths across namespaces.
        self.pathHash = CRYPTO.createHash('sha1').update(PATH.relative(namespace.baseDir, self.path)).digest('hex');

        let mod = null;

        // Check if module contains a codeblock as we need to purify it first before it can be required.
        if (/>>>/.test(FS.readFileSync(self.path, "utf8"))) {
            mod = CODEBLOCK_REQUIRE(self.path);
        } else {
            mod = require(self.path);
        }

        if (typeof mod.inf !== "function") {
            throw new Error("Component at path '" + self.path + "' does not export 'inf()'!");
        }

        let instances = {};
        self.getComponentAliases = function () {
            return Object.keys(instances.component || {});
        }
        self.forAlias = async function (type, alias) {

            if (!instances[type]) {
                instances[type] = {};
            }

            if (!instances[type][alias]) {

                let plugins = namespace.getPluginsForAlias(alias);
                
                var componentInitContext = Object.create(namespace.componentInitContext);

                var pluginOverrides = [];
                plugins.forEach(function (plugin) {
                    if (
                        plugin.impl.ComponentInitContext &&
                        plugin.impl.ComponentInitContext.constructor
                    ) {
                        plugin.impl.ComponentInitContext.constructor.call(componentInitContext, namespace);
                    }
                });

                let pluginInstance = Object.create(self);


                pluginInstance.invoke = async function (pointer, value) {
            
                    if (typeof pluginInstance.impl.invoke !== "function") {
                        throw new Error("Component at path '" + pluginInstance.path + "' does not export 'inf().invoke(pointer, value)'!");
                    }

                    return pluginInstance.impl.invoke.call(null, pointer, value);
                };

                componentInitContext = componentInitContext.forNode(pluginInstance);

                let instance = pluginInstance;
                await Promise.mapSeries(plugins, async function (plugin) {

                    if (plugin.impl.inf) {
                        let impl = await plugin.impl.inf(componentInitContext, alias);

                        if (impl.Component) {
                            Object.keys(impl.Component).forEach(function (functionName) {
                                let origInstance = instance;
                                instance = Object.create(origInstance);
                                if (/^async /.test(impl.Component[functionName].toString())) {
                                    instance[functionName] = async function () {
                                        return impl.Component[functionName].apply(origInstance, arguments);
                                    };
                                } else {
                                    instance[functionName] = function () {
                                        return impl.Component[functionName].apply(origInstance, arguments);
                                    };    
                                }
                            });
                        }
                    }
                });
                instances[type][alias] = instance;

                pluginInstance.impl = await mod.inf(componentInitContext, alias);
            }

            return instances[type][alias];
        }
    }
}

const LIB = {
    Promise: Promise,
    PATH: PATH,
    FS: FS,
    CODEBLOCK: CODEBLOCK,
    CRYPTO: CRYPTO,
    INF: exports
};
LIB.Promise.defer = function () {
    var deferred = {};
    deferred.promise = new LIB.Promise(function (resolve, reject) {
        deferred.resolve = resolve;
        deferred.reject = reject;
    });
    return deferred;
}

class ComponentInitContext extends EventEmitter {

    constructor (namespace) {
        super();

        let self = this;

        self.setMaxListeners(9999);

        self.LIB = LIB;

        self.baseDir = namespace.baseDir;

        Object.defineProperty(self, 'rootDir', {
            get: function () {
                if (namespace.referringNamespace) {
                    return namespace.referringNamespace.componentInitContext.rootDir;
                }
                return namespace.baseDir;
            }
        });

        self.toPINFBundle = async function (aspectName, options) {
            options = options || {};
            let self = this;
            let memoizedComponents = {};
// --------------------------------------------------
return `return new Promise(function (resolve, reject) { require.sandbox(function (require) {
${(await namespace.gatherComponentAspect(aspectName)).map(function (component) {
    return Object.keys(component.aspect).map(function (alias) {
        memoizedComponents[component.pathHash + ":" + alias] = true;
        return `require.memoize("/${component.pathHash}-${alias}${options.ext || '.js'}", function (require, exports, module) {\n${component.aspect[alias]}\n});`;
    }).join("\n");
}).join("\n")}
require.memoize("/main.js", function (require, exports, module) {
    let rtNamespace = {};
    ${(await Promise.map(Object.keys(namespace.aliases).filter(function (alias) {
        return (!!memoizedComponents[namespace.aliases[alias].pathHash + ":" + alias]);
    }), function (alias) {
        return `rtNamespace['${alias}'] = require('./${namespace.aliases[alias].pathHash}-${alias}${options.ext || '.js'}')`;
    })).join('\n')}
    return rtNamespace;
});
}, function (sandbox) { try { resolve(sandbox.main()); } catch (err) { reject(err); } }, reject); });`
// --------------------------------------------------
        }

        self.run = async function (filepath) {

            let path = PATH.resolve(namespace.baseDir || "", filepath);

            let inf = new INF(PATH.dirname(path), null, namespace.options);

            return inf.runInstructionsFile(PATH.basename(path));
        }

        self.wrapValue = function (value) {
            return Node.WrapInstructionNode(namespace, value);
        }

        self.forNode = function (node) {

            let context = Object.create(self);

            // TIP: Load additional functionality into the context via a plugin.

            return context;
        }
    }
}

class Namespace {

    constructor (baseDir, referringNamespace, options) {
        let self = this;

        self.baseDir = baseDir;
        self.options = options || {};

        self.referringNamespace = referringNamespace;

        self.components = (self.referringNamespace && self.referringNamespace.components) || {};
        self.aliases = (self.referringNamespace && self.referringNamespace.aliases) || {};
        self.plugins = (self.referringNamespace && self.referringNamespace.plugins) || [];
        self.pathStack = (self.referringNamespace && self.referringNamespace.pathStack) || [];
        //self.pathStack = [].concat((self.referringNamespace && self.referringNamespace.pathStack) || []);

        self.componentInitContext = new ComponentInitContext(self);

        if (self.referringNamespace) {
            self.referringNamespace.componentInitContext.on("processed", function () {
                self.componentInitContext.emit("processed");
            });
        }
    }
/*
    flipDomainInUri (uri) {
        if (/^(\/|\.)/.test(uri)) {
            // There is no domain when using an absolute or relative path.
            return uri;
        }
        if (/(\/|\.)$/.test(uri) && !/\//.test(uri)) {
            // There is no domain when referencing a package or file without '/'
            return uri;
        }
        let uriMatch = uri.match(/^([^\/]+)(\/.+)?$/);
        let domain = uriMatch[1].split(".");
        domain.reverse();
        return (domain.join(".") + (uriMatch[2] || ""));
    }
*/
    isInheritingFrom (path) {
        return (this.pathStack.indexOf(path) !== -1);
    }

    async resolveInfUri (uri) {
        let self = this;

//        uri = self.flipDomainInUri(uri);

        if (!/(\/|\.)$/.test(uri)) {
            CONSOLE.error("uri", uri);
            throw new Error(`Invalid uri!. 'uri' must end with '/' to reference a package or '.' to reference a file. 'inf.json' is then appended by inf resolver.`);
        }

        let filepath = uri + "inf.json";

        if (/^\./.test(uri)) {
            let cwdPaths = await GLOB.async(filepath, { cwd: self.baseDir });
            if (cwdPaths.length) {
                return cwdPaths.map(function (filepath) {
                    return PATH.join(self.baseDir, filepath);
                });
            }
        }

        if (self.options.vocabularies) {
            var vocabulariesPath = PATH.resolve(self.baseDir, self.options.vocabularies, "it.pinf.inf", filepath);
            if (await FS.existsAsync(vocabulariesPath)) {
                return [ vocabulariesPath ];
            }

            vocabulariesPath = PATH.resolve(self.baseDir, self.options.vocabularies, filepath);
            if (await FS.existsAsync(vocabulariesPath)) {
                return [ vocabulariesPath ];
            }
        } else
        if (process.env.INF_VOCABULARIES) {
            vocabulariesPath = PATH.resolve(process.env.INF_VOCABULARIES, "it.pinf.inf", filepath);
            if (await FS.existsAsync(vocabulariesPath)) {
                return [ vocabulariesPath ];
            }

            vocabulariesPath = PATH.resolve(process.env.INF_VOCABULARIES, filepath);
            if (await FS.existsAsync(vocabulariesPath)) {
                return [ vocabulariesPath ];
            }
        }

        let defaultPaths = await GLOB.async(filepath, { cwd: PATH.join(__dirname, "vocabularies") });
        if (defaultPaths.length) {
            return defaultPaths.map(function (filepath) {
                return PATH.join(__dirname, "vocabularies", filepath);
            });
        }

        CONSOLE.error("self.options.vocabularies", self.options.vocabularies);
        CONSOLE.error("process.env.INF_VOCABULARIES", process.env.INF_VOCABULARIES);
        throw new Error("Inf file for uri '" + uri + "' (filepath: '" + filepath + "') not found from baseDir '" + self.baseDir + "'!");

    }

    async resolveComponentUri (uri) {
        let self = this;

//        if (/\/$/.test(uri)) {
//            throw new Error("Component uri '" + uri + "' may not end with '/'!");
//        }

//        uri = self.flipDomainInUri(uri);

        if (/^\./.test(uri)) {
            var exactPath = PATH.resolve(self.baseDir || "", uri);
            if (await FS.existsAsync(exactPath)) {
                if ((await FS.statAsync(exactPath)).isFile()) {
                    return exactPath;
                }
            }
        }

        if (!/(\/|\.)$/.test(uri)) {
            CONSOLE.error("uri", uri);
            throw new Error("'uri' must end with '/' to reference a pakage or '.' to reference a file. 'inf.js' is then appended by component resolver.");
        }

        let filepath = uri + "inf.js";

        if (/^\./.test(uri)) {
            var cwdPath = PATH.join(self.baseDir, filepath);
            if (await FS.existsAsync(cwdPath)) {
                return cwdPath;
            }    
        }

        if (self.options.vocabularies) {
            var vocabulariesPath = PATH.join(self.baseDir, self.options.vocabularies, "it.pinf.inf", filepath);
            if (await FS.existsAsync(vocabulariesPath)) {
                return vocabulariesPath;
            }

            vocabulariesPath = PATH.join(self.baseDir, self.options.vocabularies, filepath);
            if (await FS.existsAsync(vocabulariesPath)) {
                return vocabulariesPath;
            }
        } else
        if (process.env.INF_VOCABULARIES) {
            vocabulariesPath = PATH.resolve(process.env.INF_VOCABULARIES, "it.pinf.inf", filepath);
            if (await FS.existsAsync(vocabulariesPath)) {
                return vocabulariesPath;
            }

            vocabulariesPath = PATH.resolve(process.env.INF_VOCABULARIES, filepath);
            if (await FS.existsAsync(vocabulariesPath)) {
                return vocabulariesPath;
            }
        }            

        var defaultVocabulariesPath = PATH.join(__dirname, "vocabularies/it.pinf.inf", filepath);
        if (await FS.existsAsync(defaultVocabulariesPath)) {
            return defaultVocabulariesPath;
        }

        defaultVocabulariesPath = PATH.join(__dirname, "vocabularies", filepath);
        if (await FS.existsAsync(defaultVocabulariesPath)) {
            return defaultVocabulariesPath;
        }

        throw new Error("Component for uri '" + uri + "' (filepath: '" + filepath + "') not found from baseDir '" + self.baseDir + "'!");
    }

    async getComponentForUri (uri) {
        let self = this;

        let path = await self.resolveComponentUri(uri);

        if (!self.components[path]) {

            log("Load component for uri '" + uri + "' from file:", path);

            let component = new Component(path);

            await component.init(self);

            self.components[path] = component;
        }
        return self.components[path];
    }

    async mapComponent (alias, uri) {
        let self = this;

        let component = await self.getComponentForUri(uri);

        if (self.aliases[alias]) {
            throw new Error("Cannot map component '" + component.path + "' to alias '" + alias + "' as alias is already mapped to '" + self.aliases[alias].path + "'!");
        }

        log("Map component for uri '" + uri + "' to alias '" + alias + "'");

        return self.aliases[alias] = await component.forAlias('component', alias);
    }

    async mapPlugin (match, uri) {
        let self = this;

        let component =  await self.getComponentForUri(uri);

        log("Map plugin for uri '" + uri + "' to match '" + match + "'");

        self.plugins.push({
            match: match,
            re: new RegExp(match),
            component: await component.forAlias('plugin', match)
        });

        return component;
    }

    getPluginsForMatch (match) {
        return this.plugins.filter(function (plugin) {
            return (plugin.match === match);
        }).map(function (plugin) {
            return plugin.component;
        });
    }

    getPluginsForAlias (alias) {
        return this.plugins.filter(function (plugin) {
            return plugin.re.test(alias);
        }).map(function (plugin) {
            return plugin.component;
        });
    }

    async getComponentForAlias (alias) {
        let self = this;

        if (alias === '') {
            // Default component
            return (await self.getComponentForUri("inf.")).forAlias('component', '');
        }

        if (!self.aliases[alias]) {
            throw new Error("No component mapped to alias '" + alias + "'!");
        }

        return self.aliases[alias];
    }

    async gatherComponentAspect (aspectName) {
        let self = this;
        return Promise.map(Object.keys(self.components), async function (uri) {

            let aliases = self.components[uri].getComponentAliases();
            let aspectsCode = {};

            await Promise.map(aliases, async function (alias) {

                let aspectCode = (await self.components[uri].forAlias('component', alias)).impl['to' + aspectName];

                if (!aspectCode) {
                    return;
                }

                if (typeof aspectCode === "function") {
                    aspectCode = await aspectCode();
                }

                if (typeof aspectCode === "string") {
                    // Purify codeblocks in a string payload which is assumed to be JavaScript so that
                    // the payload becomes valid javascript and can be combined with other JS code without
                    // further processing by the consuming component.
                    aspectCode = CODEBLOCK.purifyCode(aspectCode, {
                        freezeToJavaScript: true
                    }).toString();
                } else
                if (
                    typeof aspectCode === "object" &&
                    aspectCode['.@'] === 'github.com~0ink~codeblock/codeblock:Codeblock'
                ) {
                    // Compile codeblock with no args so that consuming component does not need to deal
                    // with codeblock processing and is able to use payload as-is.

                    aspectCode = aspectCode.compile().getCode();
                } else
                if (
                    typeof aspectCode === "object" &&
                    typeof aspectCode.codeblock === "function"
                ) {
                    // Compile codeblock using provided args so that consuming component does not need to deal
                    // with codeblock processing and is able to use payload as-is.
                    let args = aspectCode.args || [];
                    aspectCode = aspectCode.codeblock();
                    let argsByName = {};
                    if (Array.isArray(args)) {
                        /*
                        return {
                            args: [ arg1 ],
                            codeblock: (javascript (arg1) >>>
                            <<<)
                        };                    
                        */
                        aspectCode._args.forEach(function (name, i) {
                            argsByName[name] = args[i];
                        });
                    } else
                    if (typeof args === "object") {
                        /*
                        return {
                            args: {
                                arg1: arg1
                            },
                            codeblock: (javascript (arg1) >>>
                            <<<)
                        };                    
                        */
                        argsByName = args;                    
                    }
                    aspectCode = aspectCode.compile(argsByName).getCode();
                }
                aspectsCode[alias] = aspectCode;
            });

            return {
                uri: uri,
                pathHash: self.components[uri].pathHash,
                aspect: aspectsCode
            };
        });
    }    
}



class Node {

    static WrapInstructionNode (namespace, value) {

        if (value instanceof Node) {
            return value;
        } else
        if (!value) {
            return new Node(namespace, value);
        } else
        if (CodeblockNode.handlesValue(value)) {
            return new CodeblockNode(namespace, value);
        } else
        if (ReferenceNode.handlesValue(value)) {
            return new ReferenceNode(namespace, value);
        }

        return new Node(namespace, value);
    }

    constructor (namespace, value) {
        this.value = value;

        this.baseDir = namespace.baseDir;
    }

    toString () {
        if (typeof this.value === "object") return JSON.stringify(this.value, null, 4);
        return this.value;
    }
}
exports.Node = Node;

class CodeblockNode extends Node {

    static handlesValue (value) {
        return (
            typeof value === "object" &&
            value['.@'] === 'github.com~0ink~codeblock/codeblock:Codeblock'
        );
    }

    toString () {
        let codeblock = CODEBLOCK.thawFromJSON(this.value);

        return codeblock.getCode();
    }
}

class ReferenceNode extends Node {

    static handlesValue (value) {
        return (
            typeof value === "string" &&
            value.match(/^([^#]*?)\s*(##?)\s*(.*?)(\s+\+([^\+]+))?$/)
        );
    }

    constructor (namespace, value) {
        super(namespace, value);
        let keyMatch = ReferenceNode.handlesValue(value);
        this.alias = keyMatch[1];
        this.type = keyMatch[2] === '##' ? 'plugin' : 'component';
        this.pointer = keyMatch[3];
    }

    toString () {
        return (this.alias + '#' + this.pointer);
    }
}


class Processor {

    constructor (namespace) {
        let self = this;

        self.namespace = namespace;
    }

    async closureForValueIfReference (value) {
        let self = this;

        async function wrapValue (value) {

            // See if we are referencing an aliased component. If we are we resolve the reference
            // and pass it along with the component invocation.
            let referenceMatch = value.value.match(/^([^#]*?)\s*#\s*(.+?)$/);

            if (referenceMatch) {

                let referencedComponent = await self.namespace.getComponentForAlias(referenceMatch[1]);

                // We create an invocation wrapper to avoid leaking references.
                value = Node.WrapInstructionNode(self.namespace, async function (instruction) {

                    let value = Node.WrapInstructionNode(self.namespace, instruction);

                    value = await referencedComponent.invoke(referenceMatch[2], value);

                    return Node.WrapInstructionNode(self.namespace, value);
                });

                value.alias = referenceMatch[1];
                value.pointer = referenceMatch[2];
                value.jsId = "./" + referencedComponent.pathHash + "-" + value.alias;
            }

            return value;
        }

        if (typeof value.value === "string") {

            value = await wrapValue(value);

        } else
        if (typeof value.value === "object") {

            let wrappedValues = {};
            let wrappedValuesIndex = 0;

            TRAVERSE(value.value).forEach(function (obj) {
                if (
                    typeof obj === "string" &&
                    /^([^#]*?)\s*#\s*(.+?)$/.test(obj)
                ) {
                    wrappedValuesIndex++;
                    wrappedValues[wrappedValuesIndex] = wrapValue({
                        value: obj
                    });
                    this.update(`___WRAPPED_VALUE_${wrappedValuesIndex}___`, true);
                }
            });

            await Promise.mapSeries(Object.keys(wrappedValues), async function (key) {
                wrappedValues[key] = await wrappedValues[key];
            });

            TRAVERSE(value.value).forEach(function (obj) {
                if (
                    typeof obj === "string" &&
                    /^___WRAPPED_VALUE_/.test(obj)
                ) {
                    this.update(wrappedValues[parseInt(obj.replace(/^.+_(\d+)_.+$/, "$1"))], true);
                }
            });
        }

        return value;
    }

    async processInstruction (anchor, value) {
        let self = this;

        log("Parse instruction:", anchor, ":", value);

        // Detect comment
        if (anchor === '//') {
            return;
        }

        // Wrap anchor and value node to provide a uniform interface to simple and complex objects.
        anchor = Node.WrapInstructionNode(self.namespace, anchor);
        value = Node.WrapInstructionNode(self.namespace, value);

        if (! anchor instanceof ReferenceNode) {
            CONSOLE.error("anchor", anchor);
            throw new Error("'anchor' is not a ReferenceNode! It must follow the '[<Alias> ]#[ <Pointer>]' format.");
        }

        // Inherit from another inf.json file
        if (anchor.value === "#") {

            let uris = Array.isArray(value.value) ? value.value : [ value.value ];

            await Promise.mapSeries(uris, async function (uri) {

                let paths = await self.namespace.resolveInfUri(uri);

                await Promise.mapSeries(paths, async function (path) {

                    if (!self.namespace.isInheritingFrom(path)) {

                        log("Inherit from inf file:", path);

                        let inf = new INF(PATH.dirname(path), self.namespace, self.namespace.options);

                        await inf.runInstructionsFile(PATH.basename(path));
                    }
                });
            });

        } else
        // Component mapping
        if (anchor.pointer === '') {

            if (anchor.type === 'component') {

                await self.namespace.mapComponent(anchor.alias, value.value);

            } else
            if (anchor.type === 'plugin') {

                await self.namespace.mapPlugin(anchor.alias, value.value);

            }

        } else
        // Mapped component instruction
        if (anchor.pointer != '') {

            value = await self.closureForValueIfReference(value);

            if (anchor.type === 'component') {

                let component = await self.namespace.getComponentForAlias(anchor.alias);

                log(`Invoke component '${component.path}' for alias '${anchor.alias}'`);

                return component.invoke(anchor.pointer, value);

            } else
            if (anchor.type === 'plugin') {

                let plugins = self.namespace.getPluginsForMatch(anchor.alias);

                await Promise.mapSeries(plugins, function (plugin) {
                    return plugin.invoke(anchor.pointer, value);
                });
            }

        } else {
            CONSOLE.error("instruction:", anchor, ":", value);
            CONSOLE.error("anchor.alias:", anchor.alias);
            CONSOLE.error("anchor.pointer:", anchor.pointer);
            throw new Error("Unknown instruction!");
        }
    }

}
