#!/usr/bin/env bash

# Instead of using an 'inf.json' file we can also pass JSON to the 'inf' command.
# Passing JSON to commands is easy in the test file here since it is run using
# bash.origin.test which adds JSON sytnax support to bash using bash.origin.module.

inf {
    "#echo": "OK"
}
