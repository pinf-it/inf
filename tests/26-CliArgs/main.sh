#!/usr/bin/env bash.origin.script

inf inf.json --opt1 val1 arg1

inf {
    "#echo": "OK : [opt1: %%args.opt1%%, arg1: %%args._[1]%%]"
} --opt1 val1 arg1

inf {
    "#echo": "OK : [opt1: %%{args.opt1 ? 'set' : 'not set'}%%, opt2: %%{args.opt2 ? 'set' : 'not set'}%%]"
} --opt1
