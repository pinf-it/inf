#!/usr/bin/env bash.origin.script

inf {
    "#": {
        "readme.com": "./readme.com/",
        "builder.com": "./builder.com/"
    },

    ":readme:": "readme.com @ generator/v0",
    ":builder:": "builder.com @ builder/v0",

    "readme.com @ generator/v0 # :readme: generate()": "Hello World",
    "builder.com @ builder/v0 # :builder: build()": "Script Source"
}
