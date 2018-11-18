#!/usr/bin/env bash.origin.script

inf {
    ":stream:": "./stream.",
    "stdout #": "./stdout.",
    "stdout # :stream: out": "uppercase: hello world"
}

exit 0
# Will throw "Undeclared Protocol Error"
inf {
    "stdout #": "./stdout.",
    "stdout # :stream: out": "uppercase: hello world"
}
