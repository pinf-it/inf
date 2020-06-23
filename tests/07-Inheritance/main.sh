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
# Glob paths
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

echo "---"

# Inherit if file exists
inf {
    "#": [
        "../06-MapAliasToComponent/",
        "!./_does_not_exist.",
        "./"
    ],

    "stdout # echo": "ok",
    "ourecho # echo": "ok",

    "# echo": "OK"
}

echo "---"

# Inherit from empty
inf {
    "#": [
        "../06-MapAliasToComponent/",
        "./empty1.",
        "./",
        "./empty2."
    ],

    "stdout # echo": "ok",
    "ourecho # echo": "ok",

    "# echo": "OK"
}

echo "---"

# UniqueKeySuffix
inf {
    "# +1": "../06-MapAliasToComponent/",

    "stdout # echo +2": "ok",

    "# echo +3": "OK"
}

echo "---"

# Absolute path
inf {
    "#": "\${__DIRNAME__}/../06-MapAliasToComponent/",

    "stdout # echo": "ok",

    "# echo": "OK"
}
