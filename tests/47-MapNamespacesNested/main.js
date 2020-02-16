
const INF = require("../..");
const ASSERT = require("assert");

let inf = new INF.INF(__dirname, null, {});
inf.runInstructionsFile("main.inf.json").then(function (api) {

    console.error("api (main.js)", JSON.stringify(api, null, 4));

    let prefix = '';
    if (api['ours|ours.com/api|announcement|say|inf.pinf.it/cli/runner/v0|first|inf.pinf.it/announcer/impl/v0']) {
        prefix = 'ours|ours.com/api|announcement|';
    }

    let expected = [
        prefix + "say|inf.pinf.it/cli/runner/v0|first|inf.pinf.it/announcer/impl/v0",
        prefix + "say|inf.pinf.it/cli/runner/v0|second|inf.pinf.it/announcer/impl/v1/pre",
        "main"
    ];

    ASSERT.deepEqual(Object.keys(api), expected);
});
