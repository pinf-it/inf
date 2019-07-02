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
const ASSERT = require("assert");
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
const ESCAPE_REGEXP = require("escape-regexp");

const LODASH_GET = require("lodash/get");
const LODASH_VALUES = require("lodash/values");
const LODASH_MERGE = require("lodash/merge");
const LODASH_TO_PATH = require("lodash/toPath")


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

let exitContext = null;

function exitWithError (err) {
    if (exitContext) {
        CONSOLE.error("[inf] cwd:", exitContext.cwd);
        CONSOLE.error("[inf] filepath:", exitContext.filepath);
    }
    CONSOLE.error("[inf]", err);
    CONSOLE.error("[inf]", "Exit with code: 1");
    process.exit(1);
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

                var cwd = process.cwd();
                let args = MINIMIST(process.argv.slice(2), {
                    boolean: [
                        'verbose',
                        'debug',
                        'progress'
                    ]
                });
                if (args.verbose && !process.env.VERBOSE) {
                    process.env.VERBOSE = "1";
                }
                if (args.cwd) {
                    cwd = PATH.resolve(cwd, args.cwd);
                    process.chdir(cwd);
                }
                var filepath = args._.shift();

                exitContext = {
                    cwd: cwd,
                    filepath: filepath
                };

                // TODO: Implement '--help'

                let inf = new INF(cwd, null, args);

                if (/^\{/.test(filepath)) {
                    await inf.runInstructions(filepath);
                } else {
                    await inf.runInstructionsFile(PATH.relative(cwd, PATH.resolve(filepath)));
                }

            } catch (err) {
                exitWithError(err);
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

        log("INF filename", __filename);
    }

    async runInstructionsFile (filepath) {
        let self = this;

        if (/~infi\.log$/.test(filepath)) {
            filepath = filepath.replace(/(^\.~|~infi\.log$)/g, "");
        }

        let path = PATH.resolve(self.baseDir, filepath);
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

        if (!filepath) {
            filepath = CRYPTO.createHash('sha1').update(instructions).digest('hex').substring(0, 7);
        }

        filepath = PATH.resolve(self.baseDir, filepath);
        const baseDir = PATH.dirname(filepath);
        filepath = PATH.basename(filepath);

        self.parser = new Parser(baseDir, filepath);
        // TODO: Instead of first populating 'instructionObjects' and then processing them we should
        //       process instruction objects as they come in. This will allow for faster processing of
        //       large instruction files.
        let instructionObjects = await self.parser.parseInstructions(instructions);

        self.namespace = new Namespace(self, baseDir, self.referringNamespace, self.options);
        self.processor = new Processor(self.namespace);

        if (filepath) {
            self.namespace.pathStack.push(PATH.resolve(baseDir, filepath));
            if (self.referringNamespace) {
                self.referringNamespace.pathStack.push(PATH.resolve(baseDir, filepath));
            }
        }

        await Promise.mapSeries(instructionObjects, await function (instructionObject) {

            if (self.namespace.stopped) {
                return null;
            }

            // Replace variables
            instructionObject = instructionObject.replace(/"%%([^%]+)%%"/g, function () {
                if (/^\{.+\}$/.test(arguments[1])) {
                    // Executable expression
                    let args = self.options;
                    return JSON.stringify(eval(arguments[1].replace(/(^\{|\}$)/g, "")) || '');
                } else {
                    // Simple varibale reference
                    return JSON.stringify(LODASH_GET({
                        args: self.options
                    }, arguments[1], ''));
                }
            });
            instructionObject = instructionObject.replace(/(%+)([^%]+)(%+)/g, function () {
                if (arguments[1] !== '%%') {
                    return arguments[0];
                }
                if (/^\{.+\}$/.test(arguments[2])) {
                    // Executable expression
                    let args = self.options;
                    return eval(arguments[2].replace(/(^\{|\}$)/g, "") || '');
                } else {
                    // Simple varibale reference
                    return LODASH_GET({
                        args: self.options
                    }, arguments[2], '');    
                }
            });

            instructionObject = instructionObject.split("\t");
            return self.processor.processInstruction(instructionObject[0], JSON.parse(instructionObject[1]));
        });

        if (self.referringNamespace) {
            Object.keys(self.namespace.mappedNamespaceAliases).forEach(function (key) {
                if (typeof self.referringNamespace.mappedNamespaceAliases[key] === "undefined") {
                    self.referringNamespace.mappedNamespaceAliases[key] = self.namespace.mappedNamespaceAliases[key];
                }
            });
        }

        if (!self.namespace.referringNamespace) {
            self.namespace.componentInitContext.emit("processed");
        }

        return self.namespace.apis;
    }
}
exports.INF = INF;


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

    async init (namespace, options) {
        let self = this;

        options = options || {};

        // TODO: Optionally inject seed into path hash to increase uniqueness of identical relpaths across namespaces.
        self.pathHash = options.pathHash || CRYPTO.createHash('sha1').update(PATH.relative(namespace.baseDir, self.path)).digest('hex');

        let mod = options.exports || null;

        if (!mod) {
            // Check if module contains a codeblock as we need to purify it first before it can be required.
            if (/>>>/.test(FS.readFileSync(self.path, "utf8"))) {
                mod = CODEBLOCK_REQUIRE(self.path);
            } else {
                mod = require(self.path);
            }
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

                pluginInstance.alias = alias;
                pluginInstance.impl = await mod.inf(componentInitContext, alias);

                function makeMethodWrapper (type, method) {

                    return function (arg1, arg2) {

                        const self = this;

                        // See if there is a component method instead of using generic 'invoke'.
                        if (
                            method === "invoke" &&
                            /^[a-zA-z0-9_]+\(\)/.test(arg1) &&
                            typeof pluginInstance.impl[arg1.replace(/^([a-zA-z0-9_]+)\(\).*$/, "$1")] === "function"
                        ) {
                            const args1_parts = arg1.match(/^([a-zA-z0-9_]+)\(\)\s*(.*?)$/);

                            if (args1_parts[2]) {
                                log(`Calling method '${args1_parts[0]}' in component '${pluginInstance.path}' with arguments:`, args1_parts[2], typeof arg2.value);
                            } else {
                                log(`Calling method '${args1_parts[0]}' in component '${pluginInstance.path}' with argument:`, typeof arg2.value);
                            }

                            let value = arg2.value;
                            // If we have a wrapped node we wrap the invocation so we can pull out the 'value'.
                            if (arg2.wrapped) {
                                value = async function () {
                                    const result = await arg2.value.apply(this, arguments);
                                    return result.value;
                                }
                            }

                            let args = [
                                value
                            ];
                            if (args1_parts[2]) {
                                args.unshift(args1_parts[2]);
                            }

                            // NOTE: We only pass in the value (not the wrapper).
                            // TODO: Optionally pass in the wrapper?
                            let result = pluginInstance.impl[arg1.replace(/^([a-zA-z0-9_]+)\(\).*$/, "$1")].apply(self, args);
                            // NOTE: We do not check if the result is undefined as an undefined result is valid when using component methods.
                            //       'invoke()' in contrast must always return something to ensure the invocation was handled.

                            return result;
                        }

                        log(`Calling method '${method}' in component '${pluginInstance.path}' with args:`, arg1, typeof arg2);

                        if (!pluginInstance.impl[method]) {
                            if (method === "invoke") {
                                throw new Error(`Component at path '${pluginInstance.path}' does not export 'inf().${method}(pointer, value)'!`);
                            }
                            throw new Error(`Component at path '${pluginInstance.path}' does not export 'inf().${method}(alias, node)'!`);
                        }

                        let result = pluginInstance.impl[method].call(self, arg1, arg2);

                        function checkResult (result) {
                            if (typeof result === "undefined") {
                                if (type === "invoke") {
                                    badInvocation(arg1, arg2, self);
                                } else {
                                    noFactory(method, arg1, arg2, self);
                                }
                                return false;
                            }
                            return true;
                        }

                        if (checkResult(result)) {
                            // If we get a promise as a result we attach to it and ensure it does not resolve to undefined.
                            if (
                                typeof result === "object" &&
                                typeof result.then === 'function'
                            ) {
                                result.then(checkResult).catch(exitWithError);
                            }
                        }

                        return result;
                    }                    
                }

                [
                    "invoke",
                    "interface",
                    "contract",
                ].forEach(function (method) {
                    if (typeof pluginInstance.impl[method] === "function") {
                        pluginInstance[method] = makeMethodWrapper(
                            (method === "invoke") ? "invoke": "factory",
                            method
                        );
                    }
                });

                if (
                    type === "component" &&
                    !pluginInstance.invoke
                ) {
                    pluginInstance.invoke = makeMethodWrapper("invoke", "invoke");
                }

                pluginInstance.invokeContractAliasMethod = function (method, args) {
                    const wrapper = makeMethodWrapper("invoke", method);
                    return wrapper.apply(this, args);
                }
            }

            return instances[type][alias];
        }
    }
}

const LIB = {
    Promise: Promise,
    ASSERT: ASSERT,
    PATH: PATH,
    FS: FS,
    GLOB: GLOB,
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
Object.defineProperty(LIB, 'verbose', { get: function() { return !!process.env.VERBOSE; } });
Object.defineProperty(LIB, 'UTIL', { get: function() { return require("util"); } });
Object.defineProperty(LIB, 'CHILD_PROCESS', { get: function() { return require("child_process"); } });
Object.defineProperty(LIB, 'LODASH_MERGE', { get: function() { return require("lodash/merge"); } });
Object.defineProperty(LIB, 'LODASH', { get: function() { return require("lodash"); } });
Object.defineProperty(LIB, 'RUNBASH', { get: function() { return require("runbash"); } });
Object.defineProperty(LIB, 'COLORS', { get: function() { return require("colors/safe"); } });

Object.defineProperty(LIB, 'STABLE_JSON', { get: function() {
    const SORTED_JSON_STRINGIFY = require("json-stable-stringify");
    return {
        parse: JSON.parse,
        stringify: function (obj, replacer, space) {
            if (space) {
                return SORTED_JSON_STRINGIFY(obj, {
                    space: ((function () {
                        var indent = "";
                        for (var i=0;i<space;i++) indent += " ";
                        return indent;
                    })())
                });
            } else {
                return SORTED_JSON_STRINGIFY(obj);
            }
        }
    };
} });

exports.LIB = LIB;


async function runCodeblock (namespace, value, vars) {
    vars = vars || {};

    if (value['.@'] !== 'github.com~0ink~codeblock/codeblock:Codeblock') {
        throw new Error("'value' is not a codeblock!");
    }

    let codeblock = CODEBLOCK.thawFromJSON(value);

    if (
        codeblock.getFormat() === 'bash' ||
        codeblock.getFormat() === 'bash.progress' ||
        codeblock.getFormat() === 'bash.method'
    ) {

        await Promise.map(codeblock._args, async function (name) {
            if (typeof vars[name] === 'undefined') {
                vars[name] = await namespace.getValueForVariablePath([name]);
            }
        });

        codeblock = codeblock.compile(vars);

        const code = codeblock.getCode();

        const RUNBASH = require("runbash");

        log("Running bash code from codeblock");

        let result = null;

        try {
            result = await RUNBASH(codeblock.getCode(), {
                progress: (codeblock.getFormat() === 'bash.progress') || namespace.options.progress || !!process.env.VERBOSE,
                wait: true
            });
        } catch (err) {
            result = err;
        }

        if (result.stderr) {
            log('Discarding stderr:', result.stderr);
        }

        if (codeblock.getFormat() !== 'bash.progress') {
            if (result.code !== 0) {
                console.error("code", code);
                console.error("result", result);
                throw new Error(`Bash codeblock exited with non 0 code of '${result.code}'!`);
            }
        } else {
            if (result.code !== 0) {
                console.error(LIB.COLORS.red('[inf][bash] Ended with exit code: ' + result.code));
                process.exit(1);
            }
        }

        return result.stdout;

    } else {
        throw new Error(`Unsupported codeblock format '${codeblock.getFormat()}'!`);
    }
}


class ComponentInitContext extends EventEmitter {

    constructor (namespace) {
        super();

        let self = this;

        self.setMaxListeners(9999);

        self.LIB = LIB;

        self.options = namespace.options;
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

        self.stopProcessing = function () {
            // TODO: Indicate who called stop.
            namespace.stopProcessing();
        }

        self.run = async function (filepath, options) {

            let opts = LODASH_MERGE({}, namespace.options, options || {});
            
            if (/\{/.test(filepath)) {

                let inf = new INF(self.baseDir, null, opts);

                return inf.runInstructions(filepath);
            }

            let path = PATH.resolve(namespace.baseDir || "", filepath);

            let inf = new INF(PATH.dirname(path), null, opts);

            return inf.runInstructionsFile(PATH.basename(path));
        }

        self.load = async function (filepath) {

            if (/\{/.test(filepath)) {
                return namespace.inf.runInstructions(filepath);
            }

            let path = PATH.resolve(namespace.baseDir || "", filepath);
            return namespace.inf.runInstructionsFile(path);
        }

        self.wrapValue = function (value) {
            return Node.WrapInstructionNode(namespace, value);
        }

        self.badInvocation = badInvocation;

        self.isCodeblock = function (value) {
            return (
                typeof value === 'object' &&
                value['.@'] === 'github.com~0ink~codeblock/codeblock:Codeblock'
            );
        }

        self.runCodeblock = async function (value, vars) {
            return runCodeblock(namespace, value, vars);
        }

        self.forNode = function (node) {

            let context = Object.create(self);

            // TIP: Load additional functionality into the context via a plugin.

            function formatMessage (args) {
                return args.map(function (arg) {
                    if (
                        typeof arg === 'function' ||
                        (typeof arg !== 'string' && typeof arg === 'object')
                    ) {
                        return self.LIB.COLORS.gray(arg.toString());
                    }
                    return arg;
                    /*
                    return self.LIB.UTIL.inspect(arg, {
                        depth: 3,            // Increase depth in debug mode?
                        maxArrayLength: 25,  // Increase depth in debug mode?
                        showHidden: false,   // Enable in debug mode
                        showProxy: false,    // Enable in debug mode
                        colors: true,
                    });
                    */
                });
            }

            // TODO: When running in debug mode, switch on callsite information.
            context.console = {
                log: function () {
                    let args = Array.from(arguments);
                    args = formatMessage(args);
                    args.unshift(self.LIB.COLORS.gray.bold(`[inf][${node.alias}] Log\t`));
                    CONSOLE.log.apply(CONSOLE, args);
                },
                info: function () {
                    let args = Array.from(arguments);
                    args = formatMessage(args);
                    args.unshift(self.LIB.COLORS.blue.bold(`[inf][${node.alias}] Info\t`));
                    CONSOLE.info.apply(CONSOLE, args);
                },
                warn: function () {
                    let args = Array.from(arguments);
                    args = formatMessage(args);
                    args.unshift(self.LIB.COLORS.yellow.bold(`[inf][${node.alias}] Warning\t`));
                    CONSOLE.warn.apply(CONSOLE, args);
                },
                error: function () {
                    let args = Array.from(arguments);
                    args = formatMessage(args);
                    args.unshift(self.LIB.COLORS.red.bold(`[inf][${node.alias}] Error\t`));
                    CONSOLE.error.apply(CONSOLE, args);
                }
            }
            context.log = context.console.log;

            return context;
        }
    }
}

class Namespace {

    constructor (inf, baseDir, referringNamespace, options) {
        let self = this;

        self.inf = inf;
        self.baseDir = baseDir;
        self.options = options || {};
        self.stopped = false;

        self.referringNamespace = referringNamespace;

        self.components = (self.referringNamespace && self.referringNamespace.components) || {};
        self.aliases = (self.referringNamespace && self.referringNamespace.aliases) || {};
        self.interfaces = (self.referringNamespace && self.referringNamespace.interfaces) || {};
        self.variables = (self.referringNamespace && self.referringNamespace.variables) || {};
        self.contracts = (self.referringNamespace && self.referringNamespace.contracts) || {};
        self.plugins = (self.referringNamespace && self.referringNamespace.plugins) || [];
        self.pathStack = (self.referringNamespace && self.referringNamespace.pathStack) || [];
        //self.pathStack = [].concat((self.referringNamespace && self.referringNamespace.pathStack) || []);

        self.componentInitContext = new ComponentInitContext(self);

        if (self.referringNamespace) {
            self.referringNamespace.componentInitContext.on("processed", function () {
                self.componentInitContext.emit("processed");
            });
        }

        if (self.referringNamespace && self.referringNamespace.mappedNamespaceAliases) {
            self.mappedNamespaceAliases = {};
            Object.keys(self.referringNamespace.mappedNamespaceAliases).forEach(function (key) {
                self.mappedNamespaceAliases[key] = self.referringNamespace.mappedNamespaceAliases[key];
            });
        } else {
            self.mappedNamespaceAliases = {};    
        }

        self.apis = {};

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

    stopProcessing () {
        this.stopped = true;
        if (this.referringNamespace) {
            this.referringNamespace.stopProcessing();
        }
    }

    async findInParentTree (dir, filepath) {
        let path = PATH.join(dir, filepath);
        const exits = await FS.existsAsync(path);
        if (exits) return path;
        const newPath = PATH.dirname(dir);
        if (newPath === dir) return null;
        return this.findInParentTree(newPath, filepath);
    }

    async resolveInfUri (uri) {
        let self = this;

//        uri = self.flipDomainInUri(uri);

        if (!/(\/|\.)$/.test(uri)) {
            CONSOLE.error("uri", uri);
            throw new Error(`Invalid uri!. 'uri' must end with '/' to reference a package or '.' to reference a file. 'inf.json' is then appended by inf resolver.`);
        }

        let filepath = uri + "inf.json";

        // 1. Relative paths
        if (/^\./.test(uri)) {
            let cwdPaths = await GLOB.async(filepath, { cwd: self.baseDir });
            if (cwdPaths.length) {
                return cwdPaths.map(function (filepath) {
                    return PATH.join(self.baseDir, filepath);
                });
            }
        }

        // 2. Explicityly configured
        let vocabulariesPath = null;
        if (self.options.vocabularies) {
            vocabulariesPath = PATH.resolve(self.baseDir, self.options.vocabularies, "it.pinf.inf", filepath);
            if (await FS.existsAsync(vocabulariesPath)) {
                return [ vocabulariesPath ];
            }

            vocabulariesPath = PATH.resolve(self.baseDir, self.options.vocabularies, filepath);
            if (await FS.existsAsync(vocabulariesPath)) {
                return [ vocabulariesPath ];
            }
        } else
        // 3. Environment variable
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

        // 4. Walk up parent tree
        let parentTreePath = await self.findInParentTree(self.baseDir, filepath);
        if (parentTreePath) {
            return [ parentTreePath ];
        }

        // 5. Fallback to bundled defaults
        let defaultPaths = await GLOB.async(filepath, { cwd: PATH.join(__dirname, "vocabularies") });
        if (defaultPaths.length) {
            return defaultPaths.map(function (filepath) {
                return PATH.join(__dirname, "vocabularies", filepath);
            });
        }

        // 6. Not found
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

        if (
            typeof uri === "object" &&
            uri['.@'] === 'github.com~0ink~codeblock/codeblock:Codeblock'
        ) {
            const key = CRYPTO.createHash('sha1').update(JSON.stringify(uri)).digest('hex');
            if (!self.components[key]) {

                let codeblock = CODEBLOCK.thawFromJSON(uri);
                let exports = {};
                codeblock.run({
                    process: process,
                    exports: exports
                });

                // TODO: Get filepath from 'uri._filepath'
                let component = new Component(null);

                await component.init(self, {
                    pathHash: key,
                    exports: exports
                });
    
                self.components[key] = component;
            }
            return self.components[key];
        }

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

    async mapInterface (alias, uri) {
        let self = this;

        let component = await self.getComponentForUri(uri);

        if (self.interfaces[alias]) {
            throw new Error("Cannot map interface '" + component.path + "' to alias '" + alias + "' as alias is already mapped to '" + self.interfaces[alias].path + "'!");
        }

        log("Map interface for uri '" + uri + "' to alias '" + alias + "'");

        return self.interfaces[alias] = await component.forAlias('interface', alias);
    }

    async mapContract (anchor, uri) {
        let self = this;
        const alias = anchor.alias;

        let component = await self.getComponentForUri(uri);

        if (self.contracts[alias]) {
            throw new Error("Cannot map contract '" + component.path + "' to alias '" + alias + "' as alias is already mapped to '" + self.contracts[alias].path + "'!");
        }

        log("Map interface for uri '" + uri + "' to alias '" + alias + "'");

        self.contracts[alias] = await component.forAlias('contract', alias);

        self.contracts[alias].namespacePrefix = anchor.namespacePrefix;

        return self.contracts[alias];
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

    async mapVariables (alias, value) {
        let self = this;

        if (self.variables[alias]) {
            throw new Error("Cannot map variables '" + component.path + "' to alias '" + alias + "' as alias is already mapped to '" + self.variables[alias].path + "'!");
        }

        log("Map variables for pointer '" + value.value + "' to alias '" + alias + "'");

        return self.variables[alias] = value;
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

    getInterfaceForAlias (alias) {
        if (!this.interfaces[alias]) {
            throw new Error(`Interface for alias '${alias}' not mapped!`);
        }
        if (!this.interfaces[alias].$instance) {
            if (!this.interfaces[alias].interface) {
                if (
                    !this.interfaces[alias].contract ||
                    !this.interfaces[alias].contract[1].impl.interfaceWrapper
                ) {
                    throw new Error(`Interface with alias '${alias}' does not export 'interface()' nor does it's contract provide a wrapper.`);
                }
                this.interfaces[alias].interface = this.interfaces[alias].contract[1].impl.interfaceWrapper(this.interfaces[alias]);
            }
            this.interfaces[alias].$instance = this.interfaces[alias].interface.call(null, alias, this.interfaces[alias]);
        }
        return this.interfaces[alias];
    }

    getContractForAlias (alias) {
        if (!this.contracts[alias]) {
            throw new Error(`Contract for alias '${alias}' not mapped!`);
        }
        if (!this.contracts[alias].$instance) {
            if (!this.contracts[alias].contract) {
                console.error("this.contracts[alias]", this.contracts[alias]);
                throw new Error(`Contract for alias '${alias}' not initialized! Does the component export a 'contract()' method!`);
            }
            this.contracts[alias].$instance = this.contracts[alias].contract(alias, this.contracts[alias]);
        }
        return this.contracts[alias];
    }

    async getValueForVariablePath (path) {
        const parts = LODASH_TO_PATH(path);
        if (!this.variables[parts[0]]) {
            console.error("this.variables", this.variables);
            throw new Error(`Variables for alias '${parts[0]}' not mapped! Needed for resolving '${path}'.`);
        }
        if (!this.variables[parts[0]].$instance) {
            this.variables[parts[0]].$instance = (await (await this.variables[parts[0]]).value({
                // TODO: Provide full calling context?
                value: parts
            })).value;
        }
        // TODO: Provide full calling context?
        return this.variables[parts[0]].$instance(parts.slice(1));
    }

    async replaceVariablesInString (value) {
        const self = this;
        if (
            typeof value === "string" &&
            /\$\{([^\}]+)\}/.test(value)
        ) {
            const re = /\$\{([^\}]+)\}/g;
            let m;
            let vars = {};
            while ( m = re.exec(value) ) {
                vars[m[0]] = await self.getValueForVariablePath(m[1]);
                if (typeof vars[m[0]] === "undefined") {
                    throw new Error(`Value for variable '${m[1]}' came back as undefined!`);
                }
            }
            let keys = Object.keys(vars);
            if (keys.length) {
                keys.forEach(function (key) {
                    value = value.replace(new RegExp(ESCAPE_REGEXP(key), "g"), vars[key]);
                });
            }
        }
        return value;
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
            const codeblock = new CodeblockNode(namespace, value);

            if (codeblock.getFormat() === 'inf') {
                return new InfNode(namespace, codeblock);
            }

            return codeblock;
        } else
        if (InterfaceReferenceNode.handlesValue(value)) {

            log("new InterfaceReferenceNode for value:", value);

            return new InterfaceReferenceNode(namespace, value);
        } else
        if (ContractReferenceNode.handlesValue(value)) {

            log("new ContractReferenceNode for value:", value);

            return new ContractReferenceNode(namespace, value);
        } else
        if (VariablesReferenceNode.handlesValue(value)) {

            log("new VariablesReferenceNode for value:", value);

            return new VariablesReferenceNode(namespace, value);
        } else
       if (ReferenceNode.handlesValue(value)) {

            log("new ReferenceNode for value:", value);

            return new ReferenceNode(namespace, value);
        }

        log("new Node for value type:", typeof value);

        return new Node(namespace, value);
    }

    constructor (namespace, value) {
        const self = this;
        self.value = value;

        self.baseDir = namespace.baseDir;

        self._finalizeProperty = function (name) {
            if (
                self[name] &&
                typeof self[name] === "string"
            ) {
                let m = self[name].match(/^\s*:([^:\s]+):\s*(.+)$/);
                if (m) {

                    log(`detected interface '${m[1]}' when finalizing '${self[name]}' with value:`, value);

                    self.interface = [
                        m[1],
                        namespace.getInterfaceForAlias(m[1])
                    ];
                    self[name] = m[2];
                }
                m = self[name].match(/^\s*<([^<>\s]+)>\s*(.+)$/);
                if (m) {

                    log(`detected contract '${m[1]}' when finalizing '${self[name]}' with value:`, value);

                    self.contract = [
                        m[1],
                        namespace.getContractForAlias(m[1])
                    ];
                    self[name] = m[2];
                }
            }
        }

        self.propertyToPath = function (propertyPath) {
            const value = (propertyPath && LODASH_GET(this.value, propertyPath, null)) || this.value;
            if (!value) throw new Error(`No value at property path '${propertyPath}'!`);
            if (/^\//.test(value)) {
                return value;
            } else
            if (/^\.\.?\//.test(value)) {
                return PATH.join(this.baseDir, value);
            } else
            if (/^~\//.test(value)) {
                return PATH.join(process.env.HOME, value.substring(2));
            }
            return PATH.join(namespace.inf.baseDir, value);
        }

        self._finalizeProperty("value");
    }
    
    toString () {
        if (typeof this.value === "object") return JSON.stringify(this.value, null, 4);
        return this.value;
    }

    toPath () {
        return this.propertyToPath();
    }
}
exports.Node = Node;


function badInvocation (pointer, value, component) {
    console.error("value", value);
    throw new Error(`Invocation for pointer '${pointer}' is not supported${component ? ` in component '${component.path}'` : ''}`);
}

function noFactory (method, alias, node, component) {
    console.error("ERROR alias", alias);
    console.error("ERROR node", node);
    throw new Error(`Call to factory '${method}' did not retrurn a function${component ? ` for component '${component.path}'` : ''}`);
}


class CodeblockNode extends Node {

    static handlesValue (value) {
        return (
            typeof value === "object" &&
            value['.@'] === 'github.com~0ink~codeblock/codeblock:Codeblock'
        );
    }

    getFormat () {
        if (!CodeblockNode.handlesValue(this.value)) {
            throw new Error("Value no longer a codeblock!");
        }
        return CODEBLOCK.thawFromJSON(this.value).getFormat();
    }

    toString (args) {
        if (!CodeblockNode.handlesValue(this.value)) {
            return super.toString();
        }

        let codeblock = CODEBLOCK.thawFromJSON(this.value);

        codeblock = codeblock.compile(args);

        return codeblock.getCode();
    }
}

class InfNode extends Node {

    async toInstructions (vars) {
        return this.value.toString(vars);
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
        if (keyMatch) {
            this.alias = keyMatch[1].replace(/^:[^:]+:\s*/, "").replace(/^<[^<>]+>\s*/, "");
            this.type = keyMatch[2] === '##' ? 'plugin' : 'component';
            this.pointer = keyMatch[3];
            this._finalizeProperty("pointer");
        }
    }

    toString () {
        return (this.alias + '#' + this.pointer);
    }
}

class InterfaceReferenceNode extends ReferenceNode {

    static handlesValue (value) {

//console.log("InterfaceReferenceNode:handlesValue", value, value.match(/^:\s*([^:]+)\s*:(\s*<([^<>]+)>)?$/));

        return (
            typeof value === "string" &&
            value.match(/^:\s*([^:]+)\s*:(\s*<([^<>]+)>)?$/)
//            value.match(/^:\s*([^:]+)\s*:$/)
        );
    }

    constructor (namespace, value) {
        super(namespace, '');
        let keyMatch = InterfaceReferenceNode.handlesValue(value);
        this.alias = keyMatch[1].replace(/^:[^:]+:\s*/, "").replace(/^<[^<>]+>\s*/, "");
        this.type = 'interface';
        this.pointer = '';
        if (keyMatch[2]) {
            this.contract = keyMatch[3];
        }
    }

    toString () {
        return (':' + this.alias + ':');
    }
}

class ContractReferenceNode extends ReferenceNode {

    static handlesValue (value) {
        return (
            typeof value === "string" &&
            value.match(/^<\s*([^<>]+)\s*>$/)
        );
    }

    constructor (namespace, value) {
        super(namespace, '');
        let keyMatch = ContractReferenceNode.handlesValue(value);
        this.alias = keyMatch[1].replace(/^:[^:]+:\s*/, "").replace(/^<[^<>]+>\s*/, "");
        this.type = 'contract';
        this.pointer = '';
    }

    toString () {
        return ('<' + this.alias + '>');
    }
}

class VariablesReferenceNode extends ReferenceNode {

    static handlesValue (value) {
        return (
            typeof value === "string" &&
            value.match(/^([^\$]+?)\s*\$$/)
        );
    }

    constructor (namespace, value) {
        super(namespace, '');
        let keyMatch = VariablesReferenceNode.handlesValue(value);
        this.alias = keyMatch[1].replace(/^:[^:]+:\s*/, "").replace(/^<[^<>]+>\s*/, "");
        this.type = 'variables';
        this.pointer = '';
    }

    toString () {
        return (this.alias + '$');
    }
}

class Processor {

    constructor (namespace) {
        let self = this;

        self.namespace = namespace;
    }

    async closureForValueIfReference (value, valueProcessor) {
        let self = this;

        async function wrapValue (_value, topLevel) {

            // See if we are referencing an aliased component. If we are we resolve the reference
            // and pass it along with the component invocation.
            let referenceMatch = _value.value.match(/^([^#]*?)\s*#\s*(.+?)$/);

            if (
                referenceMatch &&
                !/_#_/.test(referenceMatch[0])
            ) {

                let referenceValue = value;
                if (!topLevel) {
                    referenceValue = Node.WrapInstructionNode(self.namespace, referenceMatch[0]);
                }
                referenceValue.propertyPathMount = _value.propertyPathMount || [];

                let referencedComponent = await self.namespace.getComponentForAlias(referenceValue.alias);

                // We create an invocation wrapper to avoid leaking references.
                _value = Node.WrapInstructionNode(self.namespace, async function (instruction) {

                    let wrappedValue = Node.WrapInstructionNode(self.namespace, instruction);

                    wrappedValue = await referencedComponent.invoke(referenceValue.pointer, wrappedValue);

                    wrappedValue = Node.WrapInstructionNode(self.namespace, wrappedValue);

                    if (valueProcessor) {
                        wrappedValue = await valueProcessor(referenceValue, wrappedValue);
                    }

                    return wrappedValue;
                });

                _value.interface = value.interface || null;
                _value.contract = value.contract || null;

                _value.wrapped = true;
                _value.alias = referenceValue.alias;
                _value.pointer = referenceValue.pointer;
                _value.jsId = "./" + referencedComponent.pathHash + "-" + _value.alias;
            }

            return _value;
        }

        if (value instanceof InfNode) {
            // An InfNode is not a reference.
            return value;
        } else
        if (typeof value.value === "string") {

            value = await wrapValue(value, true);

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
                        value: obj,
                        propertyPathMount: this.path
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

        log("");
        log(" ", anchor, ":", value);

        // Detect comment
        if (anchor === '//') {
            return;
        }

        // Handle namespaces
        let anchorNamespacePrefix = null;
        if (/^[^@]+?\s*@$/.test(anchor)) {
            // Namespace mapping
            const alias = anchor.replace(/^([^@]+?)\s*@$/, "$1");

            const m = value.match(/^([^@]+?)\s*@\s*(.+?)$/);
            if (m) {
                const valueAlias = m[1];
                const valuePointer = m[2];

                if (typeof self.namespace.mappedNamespaceAliases[valueAlias] === "undefined") {
                    console.error("self.namespace", self.namespace);
                    throw new Error(`Namespace alias '${valueAlias}' is not mapped!`);
                }

                log(`Replace namespace alias '${valueAlias}' with:`, self.namespace.mappedNamespaceAliases[valueAlias]);
                
                value = [
                    self.namespace.mappedNamespaceAliases[valueAlias].replace(/\/$/, ""),
                    valuePointer.replace(/^\//, "")
                ].join("/").replace(/\/$/, "");
            }

            log(`Map namespace alias '${alias}' to:`, value);

            self.namespace.mappedNamespaceAliases[alias] = value;
            return;
        }
        if (/<\s*[^@]+?\s*@\s*[\S]+\s*>/.test(anchor)) {
            // Namespace usage for contracts

            const m = anchor.match(/^.*?<\s*([^@]+?)\s*@\s*([\S]+)\s*>.*?$/);
            const alias = m[1];
            const pointer = m[2];
            
            if (typeof self.namespace.mappedNamespaceAliases[alias] === "undefined") {
                console.error("self.namespace", self.namespace);
                throw new Error(`Namespace alias '${alias}' is not mapped!`);
            }

            log(`Replace namespace alias '${alias}' with:`, self.namespace.mappedNamespaceAliases[alias]);

            anchorNamespacePrefix = self.namespace.mappedNamespaceAliases[alias].replace(/\/$/, "");

            anchor = anchor.replace(/^(.*?<\s*)[^@]+?\s*@\s*[\S]+(\s*>.*?)$/, `$1${[
                self.namespace.mappedNamespaceAliases[alias].replace(/\/$/, ""),
                pointer.replace(/^\//, "")
            ].join("/").replace(/\/$/, "")}$2`);

        }
        if (/^[^@]+?\s*@\s*[^#]+\s*#/.test(anchor)) {
            // Namespace usage for anchors
//            const alias = anchor.replace(/^([^@]+?)\s*@.+$/, "$1");

            const m = anchor.match(/^([^@]+?)\s*@\s*([^#]*?)\s*#/);
            const alias = m[1];
            const pointer = m[2];

            if (typeof self.namespace.mappedNamespaceAliases[alias] === "undefined") {
                console.error("self.namespace", self.namespace);
                throw new Error(`Namespace alias '${alias}' is not mapped!`);
            }

            log(`Replace namespace alias '${alias}' with:`, self.namespace.mappedNamespaceAliases[alias]);

            anchorNamespacePrefix = self.namespace.mappedNamespaceAliases[alias].replace(/\/$/, "");

            anchor = anchor.replace(/^[^@]+?\s*@\s*[^#]+(\s*#)/, `${[
                self.namespace.mappedNamespaceAliases[alias].replace(/\/$/, ""),
                pointer.replace(/^\//, "")
            ].join("/").replace(/\/$/, "")}$1`);
        }

        if (/^[^@]+?\s*@\s*[^#]+\s*#/.test(value)) {
            // Namespace usage for value

            const valueM = value.match(/^([^@]+?)\s*@\s*([^#]*?)\s*#/);
            const valueAlias = valueM[1];
            const valuePointer = valueM[2];

            if (typeof self.namespace.mappedNamespaceAliases[valueAlias] === "undefined") {
                console.error("self.namespace", self.namespace);
                throw new Error(`Namespace alias '${valueAlias}' is not mapped!`);
            }

            log(`Replace namespace alias '${valueAlias}' with:`, self.namespace.mappedNamespaceAliases[valueAlias]);

            value = value.replace(/^[^@]+?\s*@\s*[^#]+(\s*#)/, `${[
                self.namespace.mappedNamespaceAliases[valueAlias].replace(/\/$/, ""),
                valuePointer.replace(/^\//, "")
            ].join("/").replace(/\/$/, "")}$1`);
        }

        // Wrap anchor and value node to provide a uniform interface to simple and complex objects.
        anchor = Node.WrapInstructionNode(self.namespace, anchor);
        value = Node.WrapInstructionNode(self.namespace, value);
        if (anchorNamespacePrefix) {
            anchor.namespacePrefix = anchorNamespacePrefix;
//            value.anchorNamespacePrefix = anchor.namespacePrefix;
        }

        if (! anchor instanceof ReferenceNode) {
            CONSOLE.error("anchor", anchor);
            throw new Error("'anchor' is not a ReferenceNode! It must follow the '[<Alias> ]#[ <Pointer>]' format.");
        }

        log("anchor.type:", anchor.type);


        // Run various codeblocks if applicable.
        if (value instanceof CodeblockNode) {
            if (value.getFormat() === 'bash') {
                value.value = await runCodeblock(self.namespace, value.value);
            } else
            if (value.getFormat() === 'bash.progress') {
                value.value = await runCodeblock(self.namespace, value.value);
            }
            // NOTE: To cause a bash codeblock to run on invocation vs when parsing instructions
            //       use 'bash.method' for the codeblock format. The invoked method can then
            //       run it via 'INF.runCodeblock(value, vars)'
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
            if (anchor.type === 'interface') {

                const interfaceComponent = await self.namespace.mapInterface(anchor.alias, value.value);

                if (anchor.contract) {
                    interfaceComponent.contract = [
                        anchor.contract,
                        self.namespace.getContractForAlias(anchor.contract)
                    ];
                }

            } else
            if (anchor.type === 'contract') {

                await self.namespace.mapContract(anchor, value.value);

            } else
            if (anchor.type === 'plugin') {

                await self.namespace.mapPlugin(anchor.alias, value.value);

            } else
            if (anchor.type === 'variables') {

                await self.namespace.mapVariables(anchor.alias, self.closureForValueIfReference(value));

            } else {
                throw new Error(`Anchor of type '${anchor.type}' not supported!`);
            }

        } else
        // Mapped component instruction
        if (anchor.pointer != '') {

            // Replace variables            
            anchor.pointer = await self.namespace.replaceVariablesInString(anchor.pointer);
            value.value = await self.namespace.replaceVariablesInString(value.value);

            value = await self.closureForValueIfReference(value, async function (value, _value) {

                if (value.interface) {
                    // TODO: Ensure anchor contract is the same as or inherits from the same value contract.
                    _value.contract = value.interface[1].contract || null;
                    const _interface = value.interface;
                    _value = await _interface[1].$instance(_value, anchor.pointer, value.propertyPathMount);
                    if (typeof _value === "undefined") {
                        throw new Error(`Value is undefined after processing by local interface '${_interface[0]}'!`);
                    }
                    if (_value.contract) {
                        // Verify output of interface via contract
                        log(`Verify local interface output from '${_interface[0]}' using contract '${_value.contract[1].alias}'`);
                        _value = await _value.contract[1].$instance(_value, anchor.pointer, value.propertyPathMount);
                    }
                }               

                if (anchor.interface) {
                    // TODO: Ensure anchor contract is the same as or inherits from the same value contract.
                    _value.contract = anchor.interface[1].contract || null;
                    const _interface = anchor.interface;
                    _value = await _interface[1].$instance(_value, anchor.pointer, value.propertyPathMount);
                    if (typeof _value === "undefined") {
                        throw new Error(`Value is undefined after processing by local interface '${_interface[0]}'!`);
                    }
                    if (_value.contract) {
                        // Verify output of interface via contract
                        log(`Verify local interface output from '${_interface[0]}' using contract '${_value.contract[1].alias}'`);
                        _value = await _value.contract[1].$instance(_value, anchor.pointer, value.propertyPathMount);
                    }
                }

                return _value;
            });

            if (!value.wrapped) {

                if (value.interface) {
                    value.contract = value.interface[1].contract || null;
                    const _interface = value.interface;
                    delete value.interface;
                    value = await _interface[1].$instance(value, anchor.pointer);
                    if (typeof value === "undefined") {
                        throw new Error(`Value is undefined after processing by remove interface '${_interface[0]}'!`);
                    }
                    if (value.contract) {
                        // Verify output of interface via contract
                        log(`Verify remote interface output from '${_interface[0]}' using contract '${value.contract[1].alias}'`);
                        value = await value.contract[1].$instance(value, anchor.pointer);
                    }
                }

                if (anchor.interface) {
                    // TODO: Ensure anchor contract is the same as or inherits from the same value contract.
                    value.contract = anchor.interface[1].contract || null;
                    const _interface = anchor.interface;
                    delete anchor.interface;
                    value = await _interface[1].$instance(value, anchor.pointer);
                    if (typeof value === "undefined") {
                        throw new Error(`Value is undefined after processing by local interface '${_interface[0]}'!`);
                    }
                    if (value.contract) {
                        // Verify output of interface via contract
                        log(`Verify local interface output from '${_interface[0]}' using contract '${value.contract[1].alias}'`);
                        value = await value.contract[1].$instance(value, anchor.pointer);
                    }
                } else
                if (anchor.contract) {
                    // Verify value via contract
                    log(`Verify value using contract '${anchor.contract[1].alias}'`);

                    value = await anchor.contract[1].$instance(value, anchor.pointer);
                }

                if (anchor.contract) {
                    value.contract = anchor.contract || null;
                }
            } else {
                if (anchor.interface) {
                    value.contract = anchor.interface[1].contract || null;
                }
            }

            if (anchor.type === 'component') {

                let component = await self.namespace.getComponentForAlias(anchor.alias);

                log(`Invoke component '${component.path}' for alias '${anchor.alias}'`);

                let response;
                if (
                    anchor.contract &&
                    anchor.contract[1].impl.invokeWrapper
                ) {
                    if (!component.$wrappedInvoke) {
                        component.$wrappedInvoke = await (anchor.contract[1].impl.invokeWrapper(component)).call(null, anchor.contract[0]);
                    }                    
                    response = await component.$wrappedInvoke(anchor.pointer, value);
                } else
                if (
                    anchor.interface &&
                    anchor.interface[1].contract &&
                    anchor.interface[1].contract[1].impl.invokeWrapper
                ) {
                    if (!component.$wrappedInvoke) {
                        component.$wrappedInvoke = await (anchor.interface[1].contract[1].impl.invokeWrapper(component)).call(null, anchor.interface[1].contract[0]);
                    }
                    response = await component.$wrappedInvoke(anchor.pointer, value);
                }

                if (typeof response === "undefined") {
                    if (!component.invoke) {
                        console.error("anchor", anchor);
                        console.error("component", component);
                        throw new Error("Interface and contract invoke responses (if applicable) are undefined and component does not implement 'invoke()'!");
                    }
                    response = await component.invoke(anchor.pointer, value);
                }

                self.namespace.apis[anchor.alias] = response;

                return response;

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
