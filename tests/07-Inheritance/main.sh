#!/usr/bin/env bash.origin.script

# Inherit from one
inf {
    "#": "../06-MapAliasToComponent/",

    "stdout # echo": "ok",

    "# echo": "OK"
}

echo "---"

# Inherit from multiple
inf {
    "#": [
        "../06-MapAliasToComponent/",
        "./"
    ],

    "stdout # echo": "ok",
    "ourecho # echo": "ok",

    "# echo": "OK"
}

echo "---"

# Inherit from multiple
# Skip identical

inf {
    "#": [
        "../06-MapAliasToComponent/",
        "./",
        "./",
        "./link.",
        "./li*.",
        "./"
    ],

    "stdout # echo": "ok",
    "ourecho # echo": "ok",

    "# echo": "OK"
}
