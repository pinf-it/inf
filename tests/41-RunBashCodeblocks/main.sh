#!/usr/bin/env bash.origin.script

inf {
    "# echo +1": "-- 0 --",

    "vars #": "./vars.",
    "vars # set() filename": "text.txt",
    "VARS $": "vars # vars()",

    "# echo +1a": (run.bash (VARS) >>>

        cat %%%VARS.filename%%%

    <<<),

    "# echo +2a": "-- 1 --",

    "# run +1b": (run.bash.progress () >>>

        # Comment that should be ignored

        echo "progress ..."

    <<<),

    "# echo +2b": "-- 2 --",

    "runner1 #": "./runner1.",
    "runner1 # setImplementation()": (run.bash.method (VARS, opts) >>>

        ls %%%VARS.filename%%%

        echo "opts.size: %%%opts.size%%%"

    <<<),
    "# echo +3": "runner1 # run()",

    "# echo +4": "-- 3 --",

    "runner2 #": "./runner2.",
    "runner2 # setImplementation()": (run.bash.origin.script.method (VARS, opts) >>>

        ls %%%VARS.filename%%%

        BO_cecho "opts.size: %%%opts.size%%%" YELLOW

    <<<),
    "# echo +5": "runner2 # run()",

    "# echo +6": "-- 4 --",

    "# run +7": (run.bash.progress () >>>

        echo "error message" 1>&2

        exit 1
    <<<),

    "# echo +8": "THIS SHOULD NEVER SHOW"
} || true

inf ./inf.json

echo "OK"
