#!/usr/bin/env bash.origin.script

inf {
    ":pattern.stream:": "./stream.",
    ":transform.uppercase:": "./uppercase.",
    ":transform.lowercase:": "./lowercase.",
    ":transform.camelcase:": "./camelcase.",
    "stdout #": "./stdout.",
    "stdout # :pattern.stream: out + 1": ":transform.uppercase: heLLo woRLd",

    "# echo + 1": "-- 1 --",

    "stdout # :pattern.stream: out + 2": ":transform.lowercase: stdout # getlast",

    "# echo + 2": "-- 2 --",

    "stdout # :pattern.stream: out + 3": {
        "get": ":transform.camelcase: stdout # getlast"
    },

    "# echo + 3": "-- 3 --",

    "stdout # :transform.uppercase: :pattern.stream: out + 4": ":transform.lowercase: Hello World",

    "# echo + 4": "-- 4 --",

    "uppercase-comp #": "./uppercase.",
    ":to.upper:": "uppercase-comp",
    "stdout # :pattern.stream: out + 4": ":to.upper: heLLo woRLd",

    "# echo + 5": "-- 5 --",

    ":to.upper2:": "uppercase-comp",
    "stdout # :pattern.stream: out + 5": ":to.upper2: heLLo woRLd",

    "# echo + 6": "-- 6 --",

    ":transform.uppercase2:": "./uppercase.",
    "stdout # :pattern.stream: out + 6": ":transform.uppercase2: heLLo woRLd"
}

exit 0
# Will throw "Undeclared Interface Error"
inf {
    "stdout #": "./stdout.",
    "stdout # :pattern.stream: out": ":transform.uppercase: hello world"
}
