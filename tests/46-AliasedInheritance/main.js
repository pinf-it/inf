
const INF = require("../..");
const ASSERT = require("assert");

let inf = new INF.INF(__dirname, null, {});
inf.runInstructionsFile("_.inf.json").then(function (api) {

    console.error("api (main.js)", JSON.stringify(api, null, 4));

    ASSERT.deepEqual(api, {
        "deploy|inf.pinf.it/cli/runner/v0|default|inf.pinf.it/wrappers/test/v0": [
            {
                "anchor": [
                    [
                        {
                            "alias": "deploy",
                            "resolved": "inf.pinf.it/cli/runner/v0"
                        },
                        {
                            "literal": "default"
                        }
                    ],
                    [
                        {
                            "alias": "self",
                            "resolved": "inf.pinf.it/wrappers/test/v0"
                        }
                    ]
                ],
                "implements": [
                    {
                        "alias": "inf.pinf.it",
                        "resolved": "inf.pinf.it"
                    },
                    {
                        "literal": "wrappers/test/v0 "
                    }
                ],
                "api": "[inf.pinf.it/wrappers/test/v0] Hello World (hostname: foobar)"
            }
        ],
        "deploy|inf.pinf.it/cli/runner/v0|default|stdout": [
            {
                "anchor": [
                    [
                        {
                            "alias": "deploy",
                            "resolved": "inf.pinf.it/cli/runner/v0"
                        },
                        {
                            "literal": "default"
                        }
                    ]
                ],
                "implements": [],
                "api": true
            },
            {
                "anchor": [
                    [
                        {
                            "alias": "deploy",
                            "resolved": "inf.pinf.it/cli/runner/v0"
                        },
                        {
                            "literal": "default"
                        }
                    ]
                ],
                "implements": [],
                "api": true
            }
        ]
    });
});
