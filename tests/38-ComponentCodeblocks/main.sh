#!/usr/bin/env bash.origin.script

inf {
    "stdout#": (javascript (exports, process) >>>
        'use strict';

        exports.inf = async function (inf) {

            return {

                invoke: function (pointer, value) {

                    if (pointer === "echo") {

                        process.stdout.write(value + "\n");

                        return true;
                    }
                }
            };
        }
    <<<),

    "stdout#echo": "Component OK",

    "#echo": "Default OK"
}
