
'use strict';

exports.inf = async function (inf) {

    const serverApi = inf.LIB.Promise.defer();

    return {

        invoke: async function (pointer, value) {

            if (pointer === 'server') {

                serverApi.resolve(value);

                return true;
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

            return `

                let serverApi = require("${(await serverApi.promise).jsId}");
                let baseUrl = "${(await (await serverApi.promise).value()).value.baseUrl}";

                exports.ping = function () {

                    return serverApi.get(baseUrl + "/pingpong?t=" + Date.now()).then(function (response) {

                        if (!response.server || !response.client) throw new Error("Invalid response");

                        console.log("pingpong duration (ms):", (response.server - response.client));

                        document.dispatchEvent(new Event("pingpong"));
                    });
                }
            `
        },

        toJSONRep: `exports.main = function (JSONREP, node) {

            return JSONREP.makeRep(
                (html () >>>
                    <ul>
                    </ul>
                <<<),
                {
                    css: (css () >>>
        
                        :scope {
                            border: 1px solid black;
                            padding: 5px;
                            padding-left: 25px;
                        }
                        :scope LI {
                            color: green;
                        }

                    <<<),
                    on: {
                        mount: function (el) {

                            window.addEventListener("pingpong", function () {

                                let newEl = document.createElement("LI");
                                newEl.innerHTML = "Success!";

                                el.appendChild(newEl);

                            }, true);
                        }
                    }
                }
            );
        };`
    };
}
