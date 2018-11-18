
const ASSERT = require("assert");
const INF = require("../..");

let inf = new INF.INF(__dirname, null, {});
inf.runInstructionsFile("inf.json").then(function (api) {

    ASSERT.equal(api.stdout, true);

});
