#!/usr/bin/env bash.origin.script

inf {
    "module#": (javascript (exports, process) >>>
        'use strict';

        exports.inf = async function (inf) {

            return {

                invoke: function (pointer, value) {

                    if (pointer === "stop()") {

                        inf.stopProcessing();

                        return true;
                    }
                }
            };
        }
    <<<),

    "# echo + 1": "Hello World!",

    "module # stop()": "Component OK",

    "# echo + 2": "This should NOT show!"
}
