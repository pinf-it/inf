#!/usr/bin/env bash.origin.script

inf {
    "vars #": "./vars.",
    "vars # set() filename": "main.sh",
    "VARS $": "vars # vars()",

    "# echo": (bash (VARS) >>>

        cat %%%VARS.filename%%%

    <<<)
}

echo "OK"
