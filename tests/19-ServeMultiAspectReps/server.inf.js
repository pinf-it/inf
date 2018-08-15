
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
            return `

                let baseUrl = "${baseUrl}";

                exports.get = function (url) {

                    if (url.substring(0, baseUrl.length) !== baseUrl) throw new Error("'baseUrl' mismatch!");

                    return window.fetch(url).then(function (response) {

                        document.dispatchEvent(new Event("server-request"));

                        return response.json();
                    });
                }
            `
        },

        toJSONRep: `exports.main = function (JSONREP, node) {

            return JSONREP.makeRep(
                (html () >>>
                    <div>
                        Request count: <span class="count">0</span>
                    </div>
                <<<),
                {
                    css: (css () >>>
        
                        :scope {
                            border: 1px solid black;
                            padding: 5px;
                        }
                        :scope .count {
                            font-weight: bold;
                        }

                    <<<),
                    on: {
                        mount: function (el) {

                            var count = 0;

                            window.addEventListener("server-request", function () {

                                count++;

                                el.querySelector(".count").innerHTML = ("" + count);

                            }, true);
                        }
                    }
                }
            );
        };`
    };
}
