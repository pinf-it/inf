#!/usr/bin/env bash.origin.script

inf {
    "formatter #": "./formatter.",
    "stdout #": "./stdout.",
    "stdout # setFormatter()": "formatter # getFormatter()",

    "stdout # echo() + 1": "Hello 1 (\${__FILENAME__})",

    "#": "./",

    "stdout # echo() + 2": "Hello 4 (\${__FILENAME__})"
}
