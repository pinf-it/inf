#!/usr/bin/env bash.origin.script

inf {
    ":pattern.stream:": "./stream.",
    ":transform.uppercase:": "./uppercase.",
    ":transform.lowercase:": "./lowercase.",
    ":transform.camelcase:": "./camelcase.",
    "stdout #": "./stdout.",
    "stdout # :pattern.stream: out + 1": ":transform.uppercase: heLLo woRLd",
    "stdout # :pattern.stream: out + 2": ":transform.lowercase: stdout # getlast",
    "stdout # :pattern.stream: out + 3": {
        "get": ":transform.camelcase: stdout # getlast"
    }
}

exit 0
# Will throw "Undeclared Interface Error"
inf {
    "stdout #": "./stdout.",
    "stdout # :pattern.stream: out": ":transform.uppercase: hello world"
}
