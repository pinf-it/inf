
'use strict';

const ASSERT = require("assert");

exports.inf = async function (inf, alias) {

    return {

        invoke: function (pointer, value) {

            if (pointer === "run()") {

                const api = this._infComponent.getAPI();

                console.log("api (main1.inf.js)", JSON.stringify(api, null, 4));

                ASSERT.deepEqual(Object.keys(api), [
                    "ours|ours.com/api|announcement|say|inf.pinf.it/cli/runner/v0|first|inf.pinf.it/announcer/impl/v0",
                    "ours|ours.com/api|announcement|say|inf.pinf.it/cli/runner/v0|second|inf.pinf.it/announcer/impl/v1/pre",
                    "ours|ours.com/api|announcement|main"
                ]);

                return {
                    alias: alias,
                    result: "runner result"
                };
            }
        }
    };
}
