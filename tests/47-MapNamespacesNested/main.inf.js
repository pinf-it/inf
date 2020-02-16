
'use strict';

const ASSERT = require("assert");

exports.inf = async function (inf, alias) {

    return {

        invoke: function (pointer, value) {

            if (pointer === "run()") {

                const api = this._infComponent.getAPI();

                console.log("api (main.inf.js)", JSON.stringify(api, null, 4));

                let prefix = '';
                if (api['ours|ours.com/api|announcement|say|inf.pinf.it/cli/runner/v0|first|inf.pinf.it/announcer/impl/v0']) {
                    prefix = 'ours|ours.com/api|announcement|';
                }

                let expected = [
                    prefix + "say|inf.pinf.it/cli/runner/v0|first|inf.pinf.it/announcer/impl/v0",
                    prefix + "say|inf.pinf.it/cli/runner/v0|second|inf.pinf.it/announcer/impl/v1/pre"
                ];

                ASSERT.deepEqual(Object.keys(api), expected);

                return {
                    alias: alias,
                    result: "runner result"
                };
            }
        }
    };
}
