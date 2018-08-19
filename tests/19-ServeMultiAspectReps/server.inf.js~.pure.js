function ___WrApCoDe___(format, args, _code) {
    return function WrappedCodeblock (variables, Codeblock) {
        var code = _code;
        function linesForEscapedNewline (rawCode) {
            var lines = [];
            var segments = rawCode.split(/([\\]*\\n)/);
            for (var i=0; i<segments.length ; i++) {
                if (i % 2 === 0) {
                    lines.push(segments[i]);
                } else
                if (segments[i] !== "\n") {
                    lines[lines.length - 1] += segments[i] + segments[i + 1];
                    i++;
                }
            }
            return lines;
        }
        var cleanedCode = linesForEscapedNewline(code);
        cleanedCode = cleanedCode.join("\n");
        return new (Codeblock || require("/dl/source/github.com~0ink~codeblock.js").Codeblock)({raw: cleanedCode}, format, args);
    };
};

'use strict';

exports.inf = async function (inf) {

    const HTTP = require("http");

    const hostname = "127.0.0.1";
    const serverAddressPath = inf.LIB.PATH.join(inf.rootDir, ".~server-address");

    const apps = [];

    const port = inf.LIB.Promise.defer();

    const server = HTTP.createServer(async function (req, res) {

        req.url = (req.url === '/') ? '/index.html' : req.url;

        console.log("Request:", req.url);

        for (let i=0, c=apps.length; i<c; i++) {
            if (apps[i].match(req.url)) {
                return apps[i].app(req, res);
            }
        }

    }).listen(8080, async function () {

        let address = server.address();

        port.resolve(address.port);

        await inf.LIB.FS.writeFileAsync(serverAddressPath, `${hostname}:${address.port}`);

        console.log(`Server running at: http://${hostname}:${address.port}`);
    });

    const baseUrl = `http://${hostname}:${(await (port.promise))}`;

    return {

        invoke: async function (pointer, value) {

            if (pointer === 'stop') {

                server.close();

            } else
            if (pointer === 'api') {

                return {
                    baseUrl: baseUrl
                };

            } else
            if (/^use /.test(pointer)) {

                let app = (await value.value()).value;

                let re = new RegExp(pointer.replace(/^use /, "").replace(/\//g, '\\/'));
                apps.push({
                    match: function (url) {
                        return re.test(url);
                    },
                    app: app
                });
            }
        },

        toJavaScript: function () {
            return `\n\n                let baseUrl = "${baseUrl}";\n\n                exports.get = function (url) {\n\n                    if (url.substring(0, baseUrl.length) !== baseUrl) throw new Error("'baseUrl' mismatch!");\n\n                    return window.fetch(url).then(function (response) {\n\n                        document.dispatchEvent(new Event("server-request"));\n\n                        return response.json();\n                    });\n                }\n            `
        },

        toJSONRep: `exports.main = function (JSONREP, node) {\n\n            return JSONREP.makeRep(\n                (html () >>>\n                    <div>\n                        Request count: <span class="count">0</span>\n                    </div>\n                <<<),\n                {\n                    css: (css () >>>\n        \n                        :scope {\n                            border: 1px solid black;\n                            padding: 5px;\n                        }\n                        :scope .count {\n                            font-weight: bold;\n                        }\n\n                    <<<),\n                    on: {\n                        mount: function (el) {\n\n                            var count = 0;\n\n                            window.addEventListener("server-request", function () {\n\n                                count++;\n\n                                el.querySelector(".count").innerHTML = ("" + count);\n\n                            }, true);\n                        }\n                    }\n                }\n            );\n        };`
    };
}
