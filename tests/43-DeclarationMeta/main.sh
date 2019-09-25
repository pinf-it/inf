#!/usr/bin/env bash.origin.script

inf {
    "formatter #": "./formatter.",
    "stdout #": "./stdout.",
    "stdout # setFormatter()": "formatter # getFormatter()",

    "stdout # echo() + 1": "Hello 1 (\${__FILENAME__})",

    "#": "./",

    "stdout # echo() + 2": "Hello 4 (\${__FILENAME__})",

    "# echo + 1": "---",

    "stdout # echo2() + 3": "Hello 5",

    "stdout # echo2() + 4": "stdout # wrapGreeting() Hello 6"
}
