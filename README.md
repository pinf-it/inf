inf
===

[![CircleCI](https://circleci.com/gh/pinf-it/inf.svg?style=svg)](https://circleci.com/gh/pinf-it/inf)

> Encode JSON Entity Models into cross-linked directed acyclic graph event architectures to multiplex process execution flow.

`inf` allows for the expansion of many aspects from a singular structure to externalized entities and the reverse contraction as well as the instantiation of a singular structure from multiple perspectives in source and optimized form.

`inf` uses a *domain specific language* in the form of an **Interface File** to map aliased components into layered namespaces and declare relationships between them. The syntax is JSON compliant and an ordered parser is used to process each document node in the same sequence as it was declared.

The output is a combined structure in the form of a JavaScript object with all nodes resolved, mapped and instanciated as per the `inf` components declared in an `inf.json` file. An intermediate `.~inf.json~infi.log` file containing `\t` and `\n` delimited node instructions for the `inf` structure is also generated.

In theory: The generated combined structure is invoked by choosing one component as a starting point and following established relationships to let the execution travel through the linked tree of referenced nodes.

In practice: The current `inf` implementation acts as an interpreter where a parser feeds an embedded VM with the `.~inf.json~infi.log` file instructions and the VM links and executes the generated combined structure.

In future: A `.~inf.json~infci.log` file will be generated which will hold compiled instructions for an optimized `inf` VM to execute where the `inf` VM is a small JavaScript framework that can run on any JavaScript engine.

### Features

  * Map component URIs to aliases
  * Combine aliases with pointers
  * Set properties on aliased pointers
  * Map aliased pointers to aliased pointers
  * Inheritance
  * Ordered JSONish (allows for duplicate keys)
  * Supports [codeblock.js](https://github.com/0ink/codeblock.js)
  * Great compile target
  * Default `inf.pinf.it` vocabulary and components for bootstrapping simple projects
  * Extendable via plugins
  * Comments
  * Unix CLI interface via `inf`
  * Browserifyable
  * Heavily tested
  * NodeJS API interface

### Limitations

  * Cannot merge two `inf.json` files by merging them. Use inheritance and runtime customization instead. Overlaying is planned.
  * Cannot use `JSON.parse()` for `inf.json` files as duplicate keys are dropped unless duplicate keys are suffixed with `+<unique>`. Assumes order of keys is preserved.
  * Parsing large instruction files that reference many Components may be slow but the resulting runtime structure (RTNamespace) is fast and small as long as the RTComponents are also optimized.
  * The instructions in an `inf.json` file can be hard to follow. To provide clarity follow a Vocabulary/Schema/Convention for aliases or generate `inf` instructions from a higher level abstraction that matches your domain model more closely ([ccjson](https://github.com/ccjson/ccjson.nodejs) is an example that can generate `inf.js` files as well as represent its runtime structure using RTNamespace & RTComponent).

### TODO

  * Export resolved `inf` component structure and mapped invocation relationships along with optimized invocation handlers to JavaScript
  * Layerable
  * Highly optimized runtime structure (RTNamespace)
  * Refactor parser to generate much better `infi` files
  * Split parser and interpreter
  * Implement `infci` files


Install
=======

    # Many source files & npm dependencies
    npm install @pinf-it/inf

    # All in one file & no npm dependencies
    npm install @pinf-it/inf-dist

Usage
-----

See `tests/` for examples of all features. The tests can be run with `npm test`. Specific tests can be run with `npm test \d{2}` where `\d{2}` denotes the numbered test prefix. When making changes to tests use the `--dev` flag to disable the test runner validation. When done, delete the `.expected.log` file for the test and run test again without `--dev` to generate comparison file.

The point of `inf` is to execute `inf.json` files. If the `#!/usr/bin/env inf` shebang is missing from a `*.inf.json` file it can be run using `inf *.inf.json`.

`inf` can be [browserified](https://github.com/browserify/browserify) to make it lightweight & portable for use in projects. Look for distribution files in `dist/` and run `npm run build` to generate a new build. These builds are published to npm at `@pinf-it/inf-dist`.

Development
-----------

Run tests:

    # Run against source
    npm test

    # Run against single-file build
    npm run build
    npm run test-dist


Overview & Approach
===================

When building systems made up of components, the components must be configured and arranged into a hierarchy that allows for controlled initialization and cross-linking in order to then respond to queries. Such bootstrapping can be accomplished by following imperative code instructions directly or compiling declarative code instructions into imperative code and then executing it.

A system may be a single process running an event loop, a single process with one or more threads, multiple processes on the same or different machienes and sandboxed execution environments such as DOM pages.

The declarative approach is leveraged by `inf` in order to:

  * Enforce component boundaries
  * Schematize component configurations & relationships
  * Have full insight into the component relationship model
  * Generate optimized runtime imperative code
  * Manifest a single source component into multiple execution contexts
  * Combine arbitrary components into cohesive systems
  * Make all components addressable in context using unique identifiers

Instead of writing imperative code to combine components, `inf` requires the use of declarative interface files which forces the developer to think about component capabilities, boundaries and relationship structures that fit into a model that spans the whole system.

A major goal of `inf` composed systems is to support system growth and maintenance by making re-composition and use of all kinds of third party components easy.


Basic Example
-------------

There are many possibilities for how to leverage `inf` to compose systems or parts thereof using the few core features that `inf` provides. It becomes even more interesting when applying more advanced concepts & features of `inf`. How to best apply `inf` is a big topic and requires experience. The example below provides a simple introduction to `inf` basics and can be found in the [53-Example-ServerMiddleware](./tests/53-Example-ServerMiddleware) test.

Example problem statement:

**We need a Node.js server that can handle configured routes and respond with a list of available routes.**

Every project that generates a combined structure begins with an `inf.json` file:

```
{
    "Server #": "./server.",

    "middleware-1 #": "./middleware/well-known-list-endpoints.",
    "Server # GET() /.well-known/list-endpoints": "middleware-1 # getApp()",

    "middleware-2 #": "./middleware/get-random-greeting.",
    "Server # GET() /get-random-greeting": "middleware-2 # getApp()",

    "Server # start()": ""
}
```

Where:

  * `"Server #": "./server."` - sets the `server.inf.js` module as the owner of the **Server** namespace.
  * `"middleware-1 #": "./middleware/well-known-list-endpoints."` - sets the `./middleware/well-known-list-endpoints.inf.js` module as the owner of the **middleware-1** namespace.
  * `"Server # GET() /.well-known/list-endpoints": "middleware-1 # getApp()"` - calls `getApp()` on the **middleware-1** namespace and registers it as a `GET()` route handler on the **Server** namespace.
  * `"Server # start()": ""` - starts the server for the **Server** namespace.

The server is implemented in a `server.inf.js` file:

```
exports.inf = async function (INF, ALIAS) {

    const HTTP = require('http');
    INF.LIB.Promise.promisifyAll(HTTP);

    let server = null;
    const middlewareApps = [];

    return {

        invoke: async function (pointer, value) {

            if (/^GET\(\)\s/.test(pointer)) {

                const route = pointer.replace(/^GET\(\)\s/, '');
                const routeRe = new RegExp(`^${route.replace(/\//, '\\/')}`);

                const app = (await value.value({
                    middlewareApps: middlewareApps
                })).value;

                middlewareApps.push([route, routeRe, app]);

                return true;
            } else
            if (pointer === 'start()') {

                server = HTTP.createServer(function (req, res) {
                    // TODO: Handle request by matching against 'middlewareApps' routes
                    //       and invoking matched middleware app.
                });
                await server.listenAsync(8080);

                return true;
            }
        }
    };
}
```

A sample route is implemented in a `middleware/get-random-greeting.inf.js` file:

```
exports.inf = async function (inf) {

    const greetings = [
        'Hello World',
        'Good Morning',
        'Good Day',
        'Good Afternoon',
        'Good Evening'
    ];
    let lastGreetingIndex = 0;

    return {

        invoke: function (pointer, value) {

            if (pointer === 'getApp()') {

                return function (req, res, next) {

                    res.end(greetings[lastGreetingIndex]);

                    lastGreetingIndex += 1;
                    if (lastGreetingIndex > greetings.length - 1) {
                        lastGreetingIndex = 0;
                    }                    
                };
            }
        }
    };
}
```

The resulting system can be booted using `inf inf.json` and will respond to these requests:

  * `http://localhost:8080/.well-known/list-endpoints` - Will return a JSON response listing available routes based on declared routes.
  * `http://localhost:8080/get-random-greeting` - Will respond with a random greeting as an example.

The next step to make this example more powerful would be to split the `inf.json` instructions into multiple files and allow for dynamic registration of routes. See [54-Example-ServerMiddleware-Advanced](./tests/54-Example-ServerMiddleware-Advanced) for a possible approach.

See [tests](./tests) for in-depth examples of all `inf` features.


Syntax
======

*TODO*


API
===

`inf` Command
-------------

*TODO*


`inf` Component
---------------

*TODO*


`inf` External Variables
------------------------

*TODO*


`inf` Magic Variables
---------------------

The table below illustrates variable values for file `/.../sub1/sub2/foo.inf.json` with an execution start directory of `/...`.

Variable Name | Example Value
--- | ---
`__FILE__` , `__FILEPATH__` | `/.../sub1/sub2/foo.inf.json`
`__FILENAME__` , `__BASENAME__` | `foo.inf.json`
`__DIRNAME__` , `__DIRPATH__` | `/.../sub1/sub2`
`__FILENAME_STEM__` | `foo.inf`
`__FILENAME_STEM2__` | `foo`
`__FILENAME_EXTENSION__` | `json`
`__FILENAME_SUFFIX__` | `.json`
`__DIR_PARENT_PATH__` | `/.../sub1`
`__DIR_BASENAME__` | `sub2`
`__BASEDIR__` | `/...`
`__RELPATH__` | `sub1/sub2/foo.inf.json`


Details
=======

Terminology
-----------

<details>
  <summary>TODO: Complete</summary>
  
  * URI:
    * `./bo/` - References a package at relative path (then e.g. `inf.json` is appended to find interface file)
    * `./bo.` - References a file at relative path (then e.g. `inf.json` is appended to find interface file)
    * `alias/bo/` & `alias/bo.` - References a package/file by mapped alias
    * `alias/bo` - References a package using namespace unique URI
    * `//domain.com/bo/` & `//domain.com/bo.` - References a package or file using globally unique URL

  * `inf.json`
  * `.~inf.json~infi.log`
  * Instruction File
  * Instructions
  * Instruction
  * Alias
  * Component Uri
  * Component
  * Pointer
  * Value
  * ValueReference - A *proxy function* to get the **Value** from a mapped **Component**.

</details>

Entities
--------

<details>
  <summary>TODO: Complete</summary>

  * **Namespace** - The parsed hierarchical structure that is mapped via aliases in the `inf.json` file.

  * **RTNamespace** - Optimized runtime structure that holds resolved Component instances as nested object.
    * Can be serialized to JavaScript.

  * **Component** - The `inf` component abstraction that receives an *invocation* whenever the mapped alias is used to set a property or map a relationship.

</details>


Provenance
==========

Original code licensed under the MIT License by Christoph Dorn since 2018.
