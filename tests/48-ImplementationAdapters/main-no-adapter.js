
const ASSERT = require("assert");
const INF = require("../..");

let inf = new INF.INF(__dirname, null, {});
inf.runInstructionsFile("inf.json").then(function (api) {

    ASSERT.deepEqual(api.stdout, [ { anchor: [], implements: [], api: true } ]);

});
