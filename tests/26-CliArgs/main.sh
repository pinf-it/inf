#!/usr/bin/env bash.origin.script

inf inf.json --opt1 val1 arg1

inf {
    "#echo": "OK : [opt1: %%args.opt1%%, arg1: %%args._[0]%%, argMissing: %%args._missing_%%]"
} --opt1 val1 arg1

inf {
    "#echo": "OK : [opt1: %%{args.opt1 ? 'set' : 'not set'}%%, opt2: %%{args.opt2 ? 'set' : 'not set'}%%]"
} --opt1

inf {
    "#echo + 1": "---",
    "#echo + 2": "%%args.opt1%%",
    "#echo + 3": "%%{args.opt1}%%",
    "#echo + 4": "%%args._missing_%%",
    "#echo + 5": "%%{args._missing_}%%",
    "#echo + 6": "---"
} --opt1 ""
