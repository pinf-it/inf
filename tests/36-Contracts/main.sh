#!/usr/bin/env bash.origin.script

inf {
    "<Message>": "./message.",
    ":pattern.stream: <Message>": "./stream.",
    ":transform.uppercase: <Message>": "./uppercase.",
    "stdout #": "./stdout.",
    "stdout # :pattern.stream: out": ":transform.uppercase: hello world - a"
}

echo "---"

inf {
    "<Message>": "./message.",
    ":pattern.stream: <Message>": "./stream.",
    ":transform.uppercase: <Message>": "./uppercase.",
    "stdout #": "./stdout.",
    "stdout # :pattern.stream: out +1": ":transform.uppercase: hello world - b",

    "# echo +1": "---",

    "<MessageAlso>": "./message.",
    "messenger #": "./messenger.",
    "messenger # enqueue + 2": ":transform.uppercase: hello world - 1",
    "messenger # <MessageAlso> enqueue + 3": ":transform.uppercase: hello world - 2",
    "messenger # <Message> enqueue + 4": "hello world - 3",
    "stdout # :pattern.stream: out +4": "messenger # queue",

    "# echo + 2": "---",

    ":pattern.stream2: <Message>": "./stream2.",
    "stdout # :pattern.stream2: out +5": "messenger # queue",

    "# echo + 3": "---",

    "ns @": "our",
    "<ns @ Message>": "./message.",
    "ns @ stdout #": "./stdout2.",
    "messenger # <ns @ Message> enqueue + 4": "hello world - 4",
    "ns @ stdout # :pattern.stream2: out +5": "messenger # queue"
}

exit 0
# Will throw "Undeclared Protocol Error"
inf {
    "stdout #": "./stdout.",
    "stdout # :pattern.stream: out": ":transform.uppercase: hello world"
}
