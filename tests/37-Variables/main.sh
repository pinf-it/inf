#!/usr/bin/env bash.origin.script

inf {
    "vars #": "./vars.",
    "vars # set greeting": "Hello World",
    "PINF $": "vars # vars",
    "# echo +1": "\${PINF.greeting}",

    "# echo +2": "---",

    "ns @": "our",
    "ns @ PINF $": "vars # vars",
    "# echo +3": "\${ns @ PINF.greeting}",

    "# echo +4": "---",

    "ns @ router #": "./router.",
    "vars # set route": "/",
    "ns @ router # \${ns @ PINF.route}": "\${ns @ PINF.greeting}",
    "ns @ router # / + 1": "run()"
}
