#!/usr/bin/env bash.origin.script

inf {
    ":pattern.stream:": "./stream.",
    ":transform.uppercase:": "./uppercase.",
    ":transform.lowercase:": "./lowercase.",
    ":transform.camelcase:": "./camelcase.",
    "stdout #": "./stdout.",
    "stdout # :pattern.stream: out + 1": ":transform.uppercase: heLLo woRLd",
    "# echo + 1": "---",
    "stdout # :pattern.stream: out + 2": ":transform.lowercase: stdout # getlast",
    "# echo + 2": "---",
    "stdout # :pattern.stream: out + 3": {
        "get": ":transform.camelcase: stdout # getlast"
    },
    "# echo + 3": "---",
    "stdout # :transform.uppercase: :pattern.stream: out + 4": ":transform.lowercase: Hello World"
}

exit 0
# Will throw "Undeclared Interface Error"
inf {
    "stdout #": "./stdout.",
    "stdout # :pattern.stream: out": ":transform.uppercase: hello world"
}
