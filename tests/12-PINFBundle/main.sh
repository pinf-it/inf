#!/usr/bin/env bash.origin.script

inf {
    "bundle #": "./bundler",

    "bundle # /main.js": (javascript () >>>

        console.log("Hello World!");

    <<<),

    "# echo": "bundle # bundle"
}
