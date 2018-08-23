#!/usr/bin/env bash.origin.script

inf {
    ".* ##": "./plugin.",
    ".* ## prefix": "PRE-1: ",

    "entity1 #": "./entity.",

    "entity2 ##": "./plugin.",
    "entity2 ## prefix": "PRE-2: ",
    "entity.* ##": "./plugin.",
    "entity.* ## prefix": "PRE-3: ",

    "entity2 #": "./entity.",
    "entity3 #": "./entity.",

    "entity1 # echo": "ok",
    "entity2 # echo": "ok",
    "entity3 # echo": "ok"
}