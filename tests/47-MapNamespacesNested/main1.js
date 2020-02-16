
const INF = require("../..");
const ASSERT = require("assert");

let inf = new INF.INF(__dirname, null, {});
inf.runInstructionsFile("main1.inf.json").then(function (api) {

    console.error("api (main1.js)", JSON.stringify(api, null, 4));

    ASSERT.deepEqual(Object.keys(api), [
        "ours|ours.com/api|announcement|say|inf.pinf.it/cli/runner/v0|first|inf.pinf.it/announcer/impl/v0",
        "ours|ours.com/api|announcement|say|inf.pinf.it/cli/runner/v0|second|inf.pinf.it/announcer/impl/v1/pre",
        "ours|ours.com/api|announcement|main",
        "main1"
    ]);
});
