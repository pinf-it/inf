#!/usr/bin/env node

/*
TODO:
  * Check why 'npm test 01 --dev --debug' includes bash.origin so many times and the wrong one from outside the DL workspace.

*/

'use strict'

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

    constructor (rootDir) {
        let self = this;

        self.rootDir = rootDir;
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

        self.rootNamespace = new Namespace(self.rootDir);

        self.parser = new Parser(self.rootNamespace);

        await self.parser.processInstructions(instructions);

        // TODO: Dump state
    }

}

class Component {

    static async ForPath (path) {
        let component = new Component(path);
        return component.init();
    }

    constructor (path) {
        let self = this;

        self.path = path;
    }

    async init () {
        let self = this;

        let mod = require(self.path);

        if (typeof mod.inf !== "function") {
            throw new Error("Component at path '" + self.path + "' does not export 'inf()'!");
        }

        return self.impl = await mod.inf({
            LIB: {
                Promise: Promise,
                PATH: PATH,
                FS: FS
            }
        });
    }

    async invoke (instruction) {
        let self = this;

        if (typeof self.impl.invoke !== "function") {
            throw new Error("Component at path '" + self.path + "' does not export 'inf().invoke()'!");
        }

        return self.impl.invoke(instruction);
    }
}

class Namespace {

    constructor (rootDir) {
        let self = this;

        self.rootDir = rootDir;
        self.components = {};
        self.aliases = {};
    }

    async resolveComponentId (id) {
        let self = this;

        if (/\/$/.test(id)) {
            throw new Error("Component id '" + id + "' may not end with '/'!");
        }

        // Flip domain name
        let idMatch = id.match(/^([^\/]+)(\/.+)?$/);
        let domain = idMatch[1].split(".");
        domain.reverse();
        id = domain.join(".") + (idMatch[2] || "");

        let filepath = id + ".inf.js";

        if (/^\./.test(id)) {
            var cwdPath = PATH.join(self.rootDir, id + ".inf.js");
            if (await FS.existsAsync(cwdPath)) {
                return cwdPath;
            }    
        }

        var defaultPath = PATH.join(__dirname, "components", filepath);
        if (await FS.existsAsync(defaultPath)) {
            return defaultPath;
        }

        throw new Error("Component for id '" + id + "' not found!");
    }

    async getComponentForId (id) {
        let self = this;

        if (!self.components[id]) {

            let path = await self.resolveComponentId(id);

            log("Load component for id '" + id + "' from file:", path);

            self.components[id] = await Component.ForPath(path);
        }
        return self.components[id];
    }

    async mapComponent (alias, id) {
        let self = this;

        let component = await self.getComponentForId(id);

        if (self.aliases[alias]) {
            throw new Error("Cannot map component '" + component.path + "' to alias '" + alias + "' as alias is already mapped to '" + self.aliases[alias].path + "'!");
        }

        log("Map component for id '" + id + "' to alias '" + alias + "'");

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
        return Promise.mapSeries(Object.keys(instructions), await function (key) {
            return self.processInstruction(key, instructions[key]);
        });
    }

    async processInstruction (key, value) {
        let self = this;

        log("Parse instruction:", key, ":", value);

        // Default 'inf' namespace
        if (/^#/.test(key)) {

            let component = await self.namespace.getComponentForId(key.replace(/^#\s*/, ""));

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
