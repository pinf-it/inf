#!/usr/bin/env bash.origin.script

echo ">>>TEST_IGNORE_LINE:^Request: /pingpong<<<"

inf {
    "bundle #": "../12-PINFBundle-MountFiles/bundler.",
    "bundle # /jsonrep.js": "jsonrep/dist/jsonrep",
    "bundle # /ui.rep.js": (javascript () >>>

        exports.main = function (JSONREP, node) {

            return JSONREP.markupNode(node.server).then(function (server) {
                return JSONREP.markupNode(node.pingpong).then(function (pingpong) {

                    return [
                        '<h1>Server</h1>',
                        server,
                        '<h1>Pingpong</h1>',
                        pingpong
                    ].join("\n");
                });
            });
        };

    <<<),
    "bundle # /main.js": (javascript () >>>

        window.jsonrep_options = {
            markupDocument: false
        };

        const JSONREP = require("./jsonrep");

        return new Promise(function (resolve, reject) {
            require("./inf").then(function (inf) {

                return require("./reps").then(function (reps) {

                    reps["ui"] = require("./ui.rep.js");

                    JSONREP.loadRenderer = function (uri) {

                        let alias = uri.replace(/\.rep$/, "");

                        if (!reps[alias]) {
                            throw new Error("Rep '" + alias + "' not found!");
                        }
                        return Promise.resolve(reps[alias]);
                    };

                    JSONREP.markupDocument().then(function () {

                        resolve({
                            JSONREP: JSONREP,
                            inf: inf,
                            reps: reps
                        });
                    }, reject);
                });
            }).catch(reject);
        });
    <<<),

    "server #": "./server.",

    "pingpong #": "./app-pingpong.",
    "pingpong # server": "server # api",

    "server # use /pingpong": "pingpong # app",

    "static #": "./app-static.",
    "static # /loader.js": "pinf-loader-js",
    "static # /index.html": (text () >>>
        <html>
            <head>
                <script src="/loader.js"></script>
                <script>
                    PINF.sandbox("/ui.js", function (sandbox) {

                        sandbox.main().then(function (api) {

                            return Promise.all([
                                api.inf.pingpong.ping(),
                                api.inf.pingpong.ping(),
                                api.inf.pingpong.ping()
                            ]);

                        }).then(function () {

                            document.dispatchEvent(new Event("done"));

                        }).catch(console.error);

                    }, console.error);
                </script>
            </head>
            <body renderer="jsonrep" style="visibility: hidden;">{
                "@ui": {
                    "server": {
                        "@server": {}
                    },
                    "pingpong": {
                        "@pingpong": {}
                    }
                }
            }</body>
        </html>
    <<<),
    "server # use /": "static # app",

    "bundle # /inf.js": "# js",
    "bundle # /reps.js": "# reps",
    "static # /ui.js": "bundle # bundle",

    "puppeteer #": "./puppeteer.",
    "puppeteer # server": "server # api",
    "puppeteer # run": (javascript () >>>

        exports.run = async function (inf, page, baseUrl) {

            let done = inf.LIB.Promise.defer();
            function wait () {
                return done.promise;
            }
            await page.exposeFunction('onDone', function (e) {
                done.resolve();
            });

            await page.evaluateOnNewDocument(function () {
                document.addEventListener("done", function () {
                    window.onDone();
                });
            });

            await page.goto(baseUrl);

            await wait();

            const html = await page[String.fromCharCode(36) + "eval"]("BODY", function (element) {
                return element.innerHTML;
            });

            console.log("---");

            console.log(html);
        }
    <<<),

    "server # stop": ""
}
