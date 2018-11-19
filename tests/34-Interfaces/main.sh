#!/usr/bin/env bash.origin.script

inf {
    ":pattern.stream:": "./stream.",
    ":transform.uppercase:": "./uppercase.",
    "stdout #": "./stdout.",
    "stdout # :pattern.stream: out": ":transform.uppercase: hello world"
}

exit 0
# Will throw "Undeclared Interface Error"
inf {
    "stdout #": "./stdout.",
    "stdout # :pattern.stream: out": ":transform.uppercase: hello world"
}
