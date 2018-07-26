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
    }

    async resolveComponentId (id) {

        if (/\/$/.test(id)) {
            throw new Error("Component id '" + id + "' may not end with '/'!");
        }

        // Flip domain name
        let idMatch = id.match(/^([^\/]+)(\/.+)?$/);
        let domain = idMatch[1].split(".");
        domain.reverse();
        id = domain.join(".") + (idMatch[2] || "");

        let filepath = id + ".inf.js";

//        var nsPath = PATH.join(self.rootDir, id + ".inf.js");

        var defaultPath = PATH.join(__dirname, "components", filepath);
        if (await FS.existsAsync(defaultPath)) {
            return defaultPath;
        }

        throw new Error("Component for id '" + id + "' not found!");
    }

    async loadComponent (id) {
        let self = this;

        if (!self.components[id]) {

            let path = await self.resolveComponentId(id);

            log("Load component for id '" + id + "' from file:", path);

            self.components[id] = await Component.ForPath(path);
        }
        return self.components[id];
    }
}

class Parser {

    constructor (namespace) {
        let self = this;

        self.namespace = namespace;
    }

    async processInstructions (instructions) {
        let self = this;
        return Promise.map(Object.keys(instructions), await function (key) {
            return self.processInstruction(key, instructions[key]);
        });
    }

    async processInstruction (key, value) {
        let self = this;

        log("Parse instruction:", key, ":", value);

        if (/^#/.test(key)) {

            let component = await self.namespace.loadComponent(key.replace(/^#/, ""));

            return component.invoke(value);

        } else {
            console.error("instruction:", key, ":", value);
            throw new Error("Unknown instruction!");
        }
    }

}
