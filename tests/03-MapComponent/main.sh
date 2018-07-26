#!/usr/bin/env bash.origin.script

# Instead of using an 'inf.json' file we can also pass JSON to the 'inf' command.
# Passing JSON to commands is easy in the test file here since it is run using
# bash.origin.test which adds JSON sytnax support to bash using bash.origin.module.

# NOTE: When using this approach, keys may not be repeated as bash.origin.modules uses
#       a standard JSON parser to process the JSON syntax.

inf {
    "stdout#": "./stdout",
    "stdout#echo": "OK"
}
