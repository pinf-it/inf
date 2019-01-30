#!/usr/bin/env bash.origin.script

inf {
    "vars #": "./vars.",
    "vars # set() filename": "main.sh",
    "VARS $": "vars # vars()",

    "# echo +1": (bash (VARS) >>>

        cat %%%VARS.filename%%%

    <<<),

    "# echo +2": "---",

    "runner1 #": "./runner1.",
    "runner1 # setImplementation()": (bash.method (VARS, opts) >>>

        ls %%%VARS.filename%%%

        echo "opts.size: %%%opts.size%%%"

    <<<),
    "# echo +3": "runner1 # run()",

    "# echo +4": "---",

    "runner2 #": "./runner2.",
    "runner2 # setImplementation()": (bash.method (VARS, opts) >>>

        ls %%%VARS.filename%%%

        echo "opts.size: %%%opts.size%%%"

    <<<),
    "# echo +5": "runner2 # run()"
}

echo "OK"