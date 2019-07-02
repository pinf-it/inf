#!/usr/bin/env bash.origin.script

inf {
    "vars #": "./vars.",
    "vars # set() filename": "main.sh",
    "VARS $": "vars # vars()",

    "# echo +1a": (bash (VARS) >>>

        cat %%%VARS.filename%%%

    <<<),

    "# echo +2a": "-- 1 --",

    "# run +1b": (bash.progress () >>>

        echo "progress ..."

    <<<),

    "# echo +2b": "-- 2 --",

    "runner1 #": "./runner1.",
    "runner1 # setImplementation()": (bash.method (VARS, opts) >>>

        ls %%%VARS.filename%%%

        echo "opts.size: %%%opts.size%%%"

    <<<),
    "# echo +3": "runner1 # run()",

    "# echo +4": "-- 3 --",

    "runner2 #": "./runner2.",
    "runner2 # setImplementation()": (bash.method (VARS, opts) >>>

        ls %%%VARS.filename%%%

        echo "opts.size: %%%opts.size%%%"

    <<<),
    "# echo +5": "runner2 # run()",

    "# echo +6": "-- 4 --",

    "# run +7": (bash.progress () >>>

        echo "error message" 1>&2

        exit 1
    <<<),

    "# echo +8": "THIS SHOULD NEVER SHOW"
}

echo "OK"
