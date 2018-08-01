inf
===

| Weave components into a namespace and do work to bootstrap a component.

`inf` provides a *domain specific language* in the form of a **Interface File** to map aliased components into layered namespaces and declare relationships between them.

The syntax is JSON compliant and an ordered parser is used to process each document node in the order it was declared in.

The output is a flat namespace in the form of a JavaScript object with all nodes resolved, mapped and instanciated as per the `inf` components declared in a `inf.json` file. An intermediate `.~infi~inf.json` file containing `\t` and `\n` delimited JSON nodes for entire `inf` structure is also generated.

Features:

  * Map component URIs to aliases
  * Combine aliases with pointers
  * Set properties on aliased pointers
  * Map aliased pointers to aliased pointers
  * Inheritance
  * Ordered JSONish (allows for duplicate keys)
  * Supports [codeblock.js](https://github.com/0ink/codeblock.js)
  * Great compile target
  * Default `inf.pinf.it` vocabulary and components for bootstrapping simple projects
  * Export resolved `inf` component structure and mapped invocation relationships to JavaScript
  * TODO:
    * Comments
    * Extendable
    * Layerable
    * Highly optimized runtime structure (RTNamespace)
    * Interfaces:
      * Unix CLI
      * NodeJS
      * Browser (The instanciated Namespace can be serialized to JavaScript if the Components only use browser APIs.)

Limitations:

  * Cannot merge two `inf.json` files by overlaying them. Use inheritance and runtime customization.
  * Cannot use `JSON.parse()` as duplicate keys are dropped.
  * Parsing large instruction files that reference many Components may be slow but the resulting runtime structure (RTNamespace) is fast and small as long as the RTComponents are also optimized.
  * The instructions in a `inf.json` file can be hard to follow. To provide clarity follow a Vocabulary/Schema/Convention for aliases or generate `inf` instructions from a higher level abstraction that matches your domain model more closely ([ccjson](https://github.com/ccjson/ccjson.nodejs) is an example that can generate `inf.js` files as well as represent its runtime structure using RTNamespace & RTComponent).


Install
-------

    npm install inf


Usage
-----

See `tests/` for examples of all features. The tests can be run with `npm test`. Specific tests can be run with `npm test \d{2}` where `\d{2}` denotes the numbered test prefix.

The point of `inf` is to execute `inf.json` files which should cause the owning component to **bootstrap & test itself**. Thus tests can also be run by executing `./inf.json`. If the `#!/usr/bin/env inf` shebang is missing from `inf.json` it can be run using `inf inf.json`.


API
===

*TODO: Component API*


Details
=======

Terminilogy
-----------

  * URI:
    * `./bo/` - References a package at relative path (then e.g. `inf.json` is appended to find interface file)
    * `./bo.` - References a file at relative path (then e.g. `inf.json` is appended to find interface file)
    * `alias/bo/` & `alias/bo.` - References a package/file by mapped alias
    * `alias/bo` - References a package using namespace unique URI
    * `//domain.com/bo/` & `//domain.com/bo.` - References a package or file using globally unique URL

  * `inf.json`
  * `.~infi~inf.json`
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

  * **Namespace** - The parsed hierarchical structure that is mapped via aliases in the `inf.json` file.

  * **RTNamespace** - Optimized runtime structure that holds resolved Component instances as nested object.
    * Can be serialized to JavaScript.

  * **Component** - The `inf` component abstraction that receives an *invocation* whenever the mapped alias is used to set a property or map a relationship.


Provenance
==========

Original source logic by Christoph Dorn under MIT License since 2018.
