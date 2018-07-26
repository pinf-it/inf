inf
===

| Weave components into a namespace and do work to bootstrap a component.

`inf` provides a *domain specific language* in the form of a **Interface File** to map aliased components into layered namespaces and declare relationships between them.

The syntax is JSON compliant and an ordered parser is used to process each document node in the order it was declared in.

The output is a nested namespace in the form of a JavaScript object with all nodes resolved, mapped and instanciated as per the `inf` components declared in a `inf.json` file.

Features:

  * TODO:
    * Create a nested namespace
    * Alias component URIs to aliases
    * Set properties on aliases
    * Map aliases to aliases
    * Comments
    * Ordered JSONish (allows for duplicate keys)
    * Extendable
    * Layerable
    * Inheritance
    * Supports [codeblock.js](https://github.com/0ink/codeblock.js)
    * Highly optimized runtime structure (RTNamespace)
    * Interfaces:
      * Unix CLI
      * NodeJS
      * Browser (The instanciated Namespace can be serialized to JavaScript if the Components only use browser APIs.)

Limitations:

  * Not mergeable (Cannot merge two `inf.json` files. To customize, merge a JSON object on top of namespace.)
  * Cannot use `JSON.parse()` as duplicate keys are dropped.
  * Parsing large instruction files that reference many Components may be slow but the resulting runtime structure (RTNamespace) is fast and small as long as the RTComponents are also optimized.
  * The instructions in a `inf.json` file can be hard to follow. To provide clarity follow a Vocabulary/Schema/Convention for aliases or generate `inf` instructions from a higher level abstraction that matches your domain model more closely ([ccjson](https://github.com/ccjson/ccjson.nodejs) is an example that can generate `inf.js` files as well as represent its runtime structure using RTNamespace & RTComponent).


Install
-------

    npm install inf


Usage
-----

See `tests/` for examples of all features. The tests can be run with `npm test`.

The point of `inf` is to execute `inf.json` files directly which will cause the owning component to **bootstrap & test itself**. Thus tests can also be run with `./inf.json`. If the `#!/usr/bin/env inf` shebang is missing from `inf.json` it can be run using `inf inf.json`.


API
===

*TODO: Component API*


Details
=======


Entities
--------

  * **Namespace** - The parsed hierarchical structure that is mapped via aliases in the `inf.json` file.

  * **RTNamespace** - Optimized runtime structure that holds resolved Component instances as nested object.
    * Can be serialized to JavaScript.

  * **Component** - The `inf` component abstraction that receives an *invocation* whenever the mapped alias is used to set a property or map a relationship.


Provenance
==========

Original source logic by Christoph Dorn under MIT License since 2018.
