#!/usr/bin/env bash.origin.script

inf {
    ":stream:": "./stream.",
    ":uppercase:": "./uppercase.",
    "stdout #": "./stdout.",
    "stdout # :stream: out": ":uppercase: hello world"
}

exit 0
# Will throw "Undeclared Protocol Error"
inf {
    "stdout #": "./stdout.",
    "stdout # :stream: out": ":uppercase: hello world"
}
