inf
===

[![CircleCI](https://circleci.com/gh/pinf-it/inf.svg?style=svg)](https://circleci.com/gh/pinf-it/inf)

| Weave aspects with sub components into a namespace and do work to bootstrap an owning component.

`inf` allows for the expansion of many aspects from a singular structure to externalized entities and the reverse contraction as well as the instantiation of a singular structure from multiple perspectives in source and optimized form.

`inf` uses a *domain specific language* in the form of an **Interface File** to map aliased components into layered namespaces and declare relationships between them. The syntax is JSON compliant and an ordered parser is used to process each document node in the order it was declared.

The output is a namespace in the form of a JavaScript object with all nodes resolved, mapped and instanciated as per the `inf` components declared in an `inf.json` file. An intermediate `.~inf.json~infi.log` file containing `\t` and `\n` delimited node instructions for the `inf` structure is also generated.

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
  * Export resolved `inf` component structure and mapped invocation relationships along with optimized invocation handlers to JavaScript
  * Extendable via plugins
  * Comments
  * Unix CLI interface via `inf`
  * Browserifyable
  * Heavily tested
  * TODO:
    * Layerable
    * NodeJS API interface
    * Highly optimized runtime structure (RTNamespace)

### Limitations

  * Cannot merge two `inf.json` files by overlaying them. Use inheritance and runtime customization.
  * Cannot use `JSON.parse()` for `inf.json` files as duplicate keys are dropped unless duplicate keys are suffixed with `+<unique>`. Assumes order of keys is preserved.
  * Parsing large instruction files that reference many Components may be slow but the resulting runtime structure (RTNamespace) is fast and small as long as the RTComponents are also optimized.
  * The instructions in an `inf.json` file can be hard to follow. To provide clarity follow a Vocabulary/Schema/Convention for aliases or generate `inf` instructions from a higher level abstraction that matches your domain model more closely ([ccjson](https://github.com/ccjson/ccjson.nodejs) is an example that can generate `inf.js` files as well as represent its runtime structure using RTNamespace & RTComponent).


Install
=======

    npm install @pinf-it/inf
    npm install @pinf-it/inf-dist


Usage
-----

See `tests/` for examples of all features. The tests can be run with `npm test`. Specific tests can be run with `npm test \d{2}` where `\d{2}` denotes the numbered test prefix. When making changes to tests use the `--dev` flag to disable the test runner validation. When done, delete the `.expected.log` file for the test and run test again without `--dev` to generate comparison file.

The point of `inf` is to execute `inf.json` files. If the `#!/usr/bin/env inf` shebang is missing from a `*.inf.json` file it can be run using `inf *.inf.json`.

`inf` can be [browserified](https://github.com/browserify/browserify) to make it lightweight & portable for use in projects. Look for distribution files in `dist/` and run `npm run build` to generate a new build. These builds are published to npm at `@pinf-it/inf-dist`.


API
===

*TODO: Component API*

Magic Variables
---------------

  * `__FILE__` - **/.../sub1/sub2/foo.inf.json**
  * `__FILEPATH__` - **/.../sub1/sub2/foo.inf.json**
  * `__FILENAME__` - **foo.inf.json**
  * `__BASENAME__` - **foo.inf.json**
  * `__DIRNAME__` - **/.../sub1/sub2**
  * `__DIRPATH__` - **/.../sub1/sub2**
  * `__FILENAME_STEM__` - **foo.inf**
  * `__FILENAME_STEM2__` - **foo**
  * `__FILENAME_EXTENSION__` - **json**
  * `__FILENAME_SUFFIX__` - **.json**
  * `__DIR_PARENT_PATH__` - **/.../sub1**
  * `__DIR_BASENAME__` - **sub2**
  * `__BASEDIR__` - **/...**
  * `__RELPATH__` - **sub1/sub2/foo.inf.json**


Details
=======

Terminology
-----------

*TODO: Complete*

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

Entities
--------

*TODO: Complete*

  * **Namespace** - The parsed hierarchical structure that is mapped via aliases in the `inf.json` file.

  * **RTNamespace** - Optimized runtime structure that holds resolved Component instances as nested object.
    * Can be serialized to JavaScript.

  * **Component** - The `inf` component abstraction that receives an *invocation* whenever the mapped alias is used to set a property or map a relationship.


Provenance
==========

Original code licensed under the MIT License by Christoph Dorn since 2018.
