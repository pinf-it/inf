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

        // Strip shebang
        instructions = instructions.replace(/^#!.+\n/, "");

        // Parse JSON
        try {
            instructions = JSON.parse(instructions);
        } catch (err) {
            console.error("self.rootDir", self.rootDir);
            console.error("filepath", filepath);
            console.error("instructions", instructions);
            throw new Error("Error parsing instructions!");
        }

        self.namespace = new Namespace(self.rootDir, self.referringNamespace);

        self.parser = new Parser(self.namespace);

        await self.parser.processInstructions(instructions);

        // TODO: Dump state
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
            self.referringNamespace.componentInitContext.on("parsed", function () {
                self.componentInitContext.emit("parsed");
            });
        }
    }

    flipDomainInUri (uri) {
        if (/^\./.test(uri)) {
            // There is no domain when using a relative path.
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

        var defaultPath = PATH.join(__dirname, "components", filepath);
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

        if (!self.aliases[alias]) {
            throw new Error("No component mapped to alias '" + alias + "'!");
        }

        return self.aliases[alias];
    }
}

class Parser {

    constructor (namespace) {
        let self = this;

        self.namespace = namespace;
    }

    async processInstructions (instructions) {
        let self = this;
        await Promise.mapSeries(Object.keys(instructions), await function (key) {
            return self.processInstruction(key, instructions[key]);
        });

        if (!self.namespace.referringNamespace) {
            self.namespace.componentInitContext.emit("parsed");
        }
    }

    async processInstruction (key, value) {
        let self = this;

        log("Parse instruction:", key, ":", value);

        // Inherit from another inf.json file
        if (key === "#") {

            let path = await self.namespace.resolveInfUri(value);

            log("Inherit from inf file:", path);

            let inf = new INF(PATH.dirname(path), self.namespace);

            await inf.runInstructionsFile(PATH.basename(path));

        } else
        // Default 'inf' namespace
        if (/^#/.test(key)) {

            let component = await self.namespace.getComponentForUri(key.replace(/^#\s*/, ""));

            return component.invoke(undefined, value);

        } else
        // Component mapping
        if (/#$/.test(key)) {

            await self.namespace.mapComponent(key.replace(/\s*#$/, ""), value);

        } else
        // Component instruction
        if (/^.+#.+$/.test(key)) {

            let component = await self.namespace.getComponentForAlias(key.replace(/^([^#]+?)\s*#.+?$/, "$1"));

            if (typeof value === "string") {
                // See if we are referencing an aliased component. If we are we resolve the reference
                // and pass it along with the component invocation.
                let referenceMatch = value.match(/^([^#]+?)\s*#\s*(.+?)$/);
                if (referenceMatch) {

                    let referencedComponent = await self.namespace.getComponentForAlias(referenceMatch[1]);

                    // We create an invocation wrapper to avoid leaking references.
                    value = function (instruction) {
                        return referencedComponent.invoke(referenceMatch[2], instruction);
                    }
                }
            }

            return component.invoke(key.replace(/^[^#]+#\s*/, ""), value);

        } else {
            console.error("instruction:", key, ":", value);
            throw new Error("Unknown instruction!");
        }
    }

}
