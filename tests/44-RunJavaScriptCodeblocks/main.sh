#!/usr/bin/env bash.origin.script

inf {
    "# echo +1": "-- 0 --",

    "vars #": "../41-RunBashCodeblocks/vars.",
    "vars # set() filename": "../41-RunBashCodeblocks/text.txt",
    "VARS $": "vars # vars()",

    "# echo +1a": (run.javascript (VARS) >>>

        process.stdout.write(require("fs").readFileSync('%%%VARS.filename%%%', 'utf8') + '\n');

        console.log('logged progress ...');
        process.stdout.write('stdout progress ...\n');
        process.stderr.write('stderr progress ...\n');

    <<<),

    "# echo +2a": "-- 1 --",

    "# run +1b": (run.javascript.progress () >>>

        # Comment that should be ignored

        console.log('logged progress ...');
        process.stdout.write('stdout progress ...\n');
        process.stderr.write('stderr progress ...\n');

    <<<),

    "# echo +2b": "-- 2 --",

    "runner1 #": "../41-RunBashCodeblocks/runner1.",
    "runner1 # setImplementation()": (run.javascript.method (VARS, opts) >>>

        process.stdout.write(require('child_process').execSync('ls %%%VARS.filename%%%') + '\n');

        process.stdout.write("opts.size: %%%opts.size%%%\n");

        console.log('logged progress ...');
        process.stdout.write('stdout progress ...\n');
        process.stderr.write('stderr progress ...\n');

    <<<),
    "# echo +3": "runner1 # run()",

    "# echo +4": "-- 3 --",

    "runner2 #": "../41-RunBashCodeblocks/runner2.",
    "runner2 # setImplementation()": (run.javascript.method (VARS, opts) >>>

        process.stdout.write(require('child_process').execSync('ls %%%VARS.filename%%%') + '\n');

        process.stdout.write("opts.size: %%%opts.size%%%\n");

    <<<),
    "# echo +5": "runner2 # run()",

    "# echo +6": "-- 4 --",

    "# run +7": (run.javascript.progress () >>>

        process.stderr.write("error message\n");

        throw new Error("There was a problem");
    <<<),

    "# echo +8": "THIS SHOULD NEVER SHOW"
} || true

inf ./inf.json

inf ./buffer.inf.json

echo "OK"
