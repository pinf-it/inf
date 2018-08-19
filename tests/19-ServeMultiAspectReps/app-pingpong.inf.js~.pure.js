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

    const serverApi = inf.LIB.Promise.defer();

    return {

        invoke: async function (pointer, value) {

            if (pointer === 'server') {

                serverApi.resolve(value);

            } else
            if (pointer === "app") {

                return function (req, res) {

                    res.writeHead(200, {
                        "Content-Type": "application/javascript"
                    });
                    res.end(JSON.stringify({
                        client: req.url.replace(/^.+?t=/, ""),
                        server: Date.now()
                    }, null, 4));
                    return;
                }
            }
        },

        toJavaScript: async function () {

            return `\n\n                let serverApi = require("${(await serverApi.promise).jsId}");\n                let baseUrl = "${(await (await serverApi.promise).value()).value.baseUrl}";\n\n                exports.ping = function () {\n\n                    return serverApi.get(baseUrl + "/pingpong?t=" + Date.now()).then(function (response) {\n\n                        if (!response.server || !response.client) throw new Error("Invalid response");\n\n                        console.log("pingpong duration (ms):", (response.server - response.client));\n\n                        document.dispatchEvent(new Event("pingpong"));\n                    });\n                }\n            `
        },

        toJSONRep: `exports.main = function (JSONREP, node) {\n\n            return JSONREP.makeRep(\n                (html () >>>\n                    <ul>\n                    </ul>\n                <<<),\n                {\n                    css: (css () >>>\n        \n                        :scope {\n                            border: 1px solid black;\n                            padding: 5px;\n                            padding-left: 25px;\n                        }\n                        :scope LI {\n                            color: green;\n                        }\n\n                    <<<),\n                    on: {\n                        mount: function (el) {\n\n                            window.addEventListener("pingpong", function () {\n\n                                let newEl = document.createElement("LI");\n                                newEl.innerHTML = "Success!";\n\n                                el.appendChild(newEl);\n\n                            }, true);\n                        }\n                    }\n                }\n            );\n        };`
    };
}
