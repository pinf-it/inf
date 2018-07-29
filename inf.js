#!/usr/bin/env node

/*
TODO:
  * Check why 'npm test 01 --dev --debug' includes bash.origin so many times and the wrong one from outside the DL workspace.

*/

'use strict'

const EventEmitter = require("events").EventEmitter;
const Promise = require("bluebird");
const PATH = require("path");
const FS = require("fs");
Promise.promisifyAll(FS);
FS.existsAsync = function (path) {
    return new Promise(function (resolve) {
        return FS.exists(path, resolve);
    });
}
const CLARINET = require("clarinet");
const CODEBLOCK = require("codeblock");


// ####################################################################################################
// # Bootstrap
// ####################################################################################################

// TODO: Declare logger

function log () {
    if (!process.env.VERBOSE) return;
    var args = Array.from(arguments);
    args.unshift("[inf]");
    console.log.apply(console, args);
}

setImmediate(function () {
    if (require.main === module) {
        async function main () {
            try {

                let cwd = process.cwd();
                let filepath = process.argv[2];

                let inf = new INF(cwd);

                if (/^\{/.test(filepath)) {
                    await inf.runInstructions(filepath);
                } else {
                    await inf.runInstructionsFile(PATH.relative(cwd, PATH.resolve(filepath)));
                }

            } catch (err) {
                console.error("[inf]", err);
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

    constructor (rootDir, referringNamespace) {
        let self = this;

        self.rootDir = rootDir;
        self.referringNamespace = referringNamespace;
    }

    async runInstructionsFile (filepath) {
        let self = this;

        let path = PATH.join(self.rootDir, filepath);
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

        self.parser = new Parser(self.rootDir, filepath);
        // TODO: Instead of first populating 'instructionObjects' and then processing them we should
        //       process instruction objects as they come in. This will allow for faster processing of
        //       large instruction files.
        let instructionObjects = await self.parser.parseInstructions(instructions);

        self.namespace = new Namespace(self.rootDir, self.referringNamespace);
        self.processor = new Processor(self.namespace);
       
        await Promise.mapSeries(instructionObjects, await function (instructionObject) {
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

    constructor (rootDir, filepath) {
        this.rootDir = rootDir;
        this.filepath = filepath;
        if (this.filepath) {
            this.infiFilepath = PATH.join(this.filepath, '..', '.~infi~' + PATH.basename(this.filepath));
        }
    }

    async parseInstructions (instructions) {
        let self = this;

        if (self.infiFilepath) {
            let exists = await FS.existsAsync(self.infiFilepath);
            if (exists) {
                if (
                    (await FS.statAsync(self.infiFilepath)).mtime >=
                    (await FS.statAsync(PATH.join(self.rootDir, self.filepath))).mtime
                ) {
                    return (await FS.readFileAsync(self.infiFilepath, "utf8")).split("\n");
                }
            }
        }

        let PARSER_EVENT_DEBUG = false;

        // Strip shebang
        instructions = instructions.replace(/^#!.+\n/, "");

        // Normalize codeblocks
        instructions = CODEBLOCK.purifyCode(instructions, {
            freezeToJSON: true
        }).toString();

        if (PARSER_EVENT_DEBUG) console.log("[inf] Parser:parseInstructions(instructions)", instructions);

        let instructionObjects = [];

        // Parse JSON using SAX parser which allows for repeated keys.
        await new Promise(function (resolve, reject) {
            function onInstructionObject (obj) {
                instructionObjects.push(obj);
            }
            let parser = CLARINET.parser();
            parser.onerror = function (err) {
                console.error("err", err); 
                console.error("self.rootDir", self.rootDir);
                console.error("filepath", self.filepath);
                console.error("instructions", instructions);
                reject(new Error("Error parsing instructions!"));
            };
            let rootObj = null;
            let currentObject = null;
            let currentKey = null;
            let previousKeyStack = [];
            let previousObjectStack = [];
            parser.onopenobject = function (key) {
                if (PARSER_EVENT_DEBUG) console.log("[inf] Parser:parseInstructions():parser:onopenobject", key);
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
                if (PARSER_EVENT_DEBUG) console.log("[inf] Parser:parseInstructions():parser:onvalue", value);
                if (currentKey === null) {
                    currentObject.push(value);
                } else {
                    currentObject[currentKey] = value;
                }
            };
            parser.onkey = function (key) {
                if (PARSER_EVENT_DEBUG) console.log("[inf] Parser:parseInstructions():parser:onkey", key);
                if (this.depth === 1) {
                    onInstructionObject(rootObj);
                    currentObject = rootObj = {};
                }
                currentKey = key;
            };
            parser.oncloseobject = function () {
                if (PARSER_EVENT_DEBUG) console.log("[inf] Parser:parseInstructions():parser:oncloseobject");
                if (this.depth === 1) {
                    onInstructionObject(rootObj);
                } else {
                    currentKey = previousKeyStack.pop();
                    currentObject = previousObjectStack.pop();
                }
            };
            parser.onopenarray = function () {
                if (PARSER_EVENT_DEBUG) console.log("[inf] Parser:parseInstructions():parser:onopenarray");
                previousObjectStack.push(currentObject);
                currentObject = currentObject[currentKey] = [];
                previousKeyStack.push(currentKey);
                currentKey = null;
            };
            parser.onclosearray = function () {
                if (PARSER_EVENT_DEBUG) console.log("[inf] Parser:parseInstructions():parser:onclosearray");
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
            await FS.writeFileAsync(self.infiFilepath, instructionObjects.join("\n"));
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

        let mod = require(self.path);

        if (typeof mod.inf !== "function") {
            throw new Error("Component at path '" + self.path + "' does not export 'inf()'!");
        }

        return self.impl = await mod.inf(namespace.componentInitContext);
    }

    async invoke (instruction) {
        let self = this;

        if (typeof self.impl.invoke !== "function") {
            throw new Error("Component at path '" + self.path + "' does not export 'inf().invoke()'!");
        }

        return self.impl.invoke(instruction);
    }
}

class ComponentInitContext extends EventEmitter {

    constructor (namespace) {
        super();

        let self = this;

        self.LIB = {
            Promise: Promise,
            PATH: PATH,
            FS: FS
        };

        self.cwd = (namespace.referringNamespace && namespace.referringNamespace.rootDir) || namespace.rootDir;
    }
}

class Namespace {

    constructor (rootDir, referringNamespace) {
        let self = this;

        self.rootDir = rootDir;

        self.referringNamespace = referringNamespace;

        self.components = (self.referringNamespace && self.referringNamespace.components) || {};
        self.aliases = (self.referringNamespace && self.referringNamespace.aliases) || {};

        self.componentInitContext = new ComponentInitContext(self);

        if (self.referringNamespace) {
            self.referringNamespace.componentInitContext.on("processed", function () {
                self.componentInitContext.emit("processed");
            });
        }
    }

    flipDomainInUri (uri) {
        if (/^(\/|\.)/.test(uri)) {
            // There is no domain when using an absolute or relative path.
            return uri;
        }
        let uriMatch = uri.match(/^([^\/]+)(\/.+)?$/);
        let domain = uriMatch[1].split(".");
        domain.reverse();
        return (domain.join(".") + (uriMatch[2] || ""));
    }

    async resolveInfUri (uri) {
        let self = this;

        uri = self.flipDomainInUri(uri);

        let filepath = PATH.join(uri, "inf.json");

        if (/^\./.test(uri)) {
            var cwdPath = PATH.join(self.rootDir, filepath);
            if (await FS.existsAsync(cwdPath)) {
                return cwdPath;
            }
        }

        var defaultPath = PATH.join(__dirname, "vocabularies", filepath);
        if (await FS.existsAsync(defaultPath)) {
            return defaultPath;
        }

        throw new Error("Inf file for uri '" + uri + "' not found!");
    }

    async resolveComponentUri (uri) {
        let self = this;

        if (/\/$/.test(uri)) {
            throw new Error("Component uri '" + uri + "' may not end with '/'!");
        }

        uri = self.flipDomainInUri(uri);

        let filepath = uri + ".inf.js";

        if (/^\./.test(uri)) {
            var cwdPath = PATH.join(self.rootDir, filepath);
            if (await FS.existsAsync(cwdPath)) {
                return cwdPath;
            }    
        }

        var defaultPath = PATH.join(__dirname, "vocabularies/it.pinf.inf", filepath);
        if (await FS.existsAsync(defaultPath)) {
            return defaultPath;
        }

        throw new Error("Component for uri '" + uri + "' not found!");
    }

    async getComponentForUri (uri) {
        let self = this;

        if (!self.components[uri]) {

            let path = await self.resolveComponentUri(uri);

            log("Load component for uri '" + uri + "' from file:", path);

            let component = new Component(path);

            self.components[uri] = await component.init(self);
        }
        return self.components[uri];
    }

    async mapComponent (alias, uri) {
        let self = this;

        let component = await self.getComponentForUri(uri);

        if (self.aliases[alias]) {
            throw new Error("Cannot map component '" + component.path + "' to alias '" + alias + "' as alias is already mapped to '" + self.aliases[alias].path + "'!");
        }

        log("Map component for uri '" + uri + "' to alias '" + alias + "'");

        return self.aliases[alias] = component;
    }

    async getComponentForAlias (alias) {
        let self = this;

        if (alias === '') {
            // Default component
            return self.getComponentForUri("inf");
        }

        if (!self.aliases[alias]) {
            throw new Error("No component mapped to alias '" + alias + "'!");
        }

        return self.aliases[alias];
    }
}



class Node {

    static WrapInstructionNode (value) {

        if (value instanceof Node) {
            return value;
        } else
        if (!value) {
            return new Node(value);
        } else
        if (CodeblockNode.handlesValue(value)) {
            return new CodeblockNode(value);
        } else
        if (ReferenceNode.handlesValue(value)) {
            return new ReferenceNode(value);
        }

        return new Node(value);
    }

    constructor (value) {
        this.value = value;
    }

    toString () {
        if (typeof this.value === "object") return JSON.stringify(this.value, null, 4);
        return this.value;
    }
}

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
            value.match(/^([^#]*?)\s*#\s*(.*?)$/)
        );
    }

    constructor (value) {
        super(value);
        let keyMatch = ReferenceNode.handlesValue(value);
        this.alias = keyMatch[1];
        this.pointer = keyMatch[2];
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

        if (typeof value.value === "string") {

            // See if we are referencing an aliased component. If we are we resolve the reference
            // and pass it along with the component invocation.
            let referenceMatch = value.value.match(/^([^#]*?)\s*#\s*(.+?)$/);

            if (referenceMatch) {

                let referencedComponent = await self.namespace.getComponentForAlias(referenceMatch[1]);

                // We create an invocation wrapper to avoid leaking references.
                value = Node.WrapInstructionNode(async function (instruction) {

                    let value = Node.WrapInstructionNode(instruction);

                    value = await referencedComponent.invoke(referenceMatch[2], value);

                    return Node.WrapInstructionNode(value);
                });
            }
        }

        return value;
    }

    async processInstruction (anchor, value) {
        let self = this;

        log("Parse instruction:", anchor, ":", value);

        // Wrap anchor and value node to provide a uniform interface to simple and complex objects.
        anchor = Node.WrapInstructionNode(anchor);
        value = Node.WrapInstructionNode(value);

        if (! anchor instanceof ReferenceNode) {
            console.error("anchor", anchor);
            throw new Error("'anchor' is not a ReferenceNode! It must follow the '[<Alias> ]#[ <Pointer>]' format.");
        }

        // Inherit from another inf.json file
        if (anchor.value === "#") {

            let path = await self.namespace.resolveInfUri(value.value);

            log("Inherit from inf file:", path);

            let inf = new INF(PATH.dirname(path), self.namespace);

            await inf.runInstructionsFile(PATH.basename(path));

        } else
        // Component mapping
        if (anchor.pointer === '') {

            await self.namespace.mapComponent(anchor.alias, value);

        } else
        // Mapped component instruction
        if (anchor.pointer != '') {

            let component = await self.namespace.getComponentForAlias(anchor.alias);

            value = await self.closureForValueIfReference(value);

            return component.invoke(anchor.pointer, value);

        } else {
            console.error("instruction:", anchor, ":", value);
            console.error("anchor.alias:", anchor.alias);
            console.error("anchor.pointer:", anchor.pointer);
            throw new Error("Unknown instruction!");
        }
    }

}
