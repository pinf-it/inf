#!/usr/bin/env bash.origin.script

inf {
    "# echo +1": "Before",

    "runner #": "./",

    "runner # message": "Our Message", 

    "runner # run": (inf (message) >>>
        {
            "# echo": "Hello from sub inf: %%%message%%%"
        }
    <<<),

    "# echo +2": "After"
}

echo "---"

inf inf.json
