
'use strict';

exports.inf = async function (INF, ALIAS) {

    const HTTP = require('http');
    INF.LIB.Promise.promisifyAll(HTTP);

    let server = null;
    const middlewareApps = [];

    return {

        invoke: async function (pointer, value) {

            if (/^GET\(\)\s/.test(pointer)) {

                const route = pointer.replace(/^GET\(\)\s/, '');
                const routeRe = new RegExp(`^${route.replace(/\//, '\\/')}`);

                // Handles instructions:
                //   "Server # GET() /.well-known/list-endpoints": "middleware-1 # getApp()"
                //   "Server # GET() /get-random-greeting": "middleware-2 # getApp()"
                if (typeof value.value === 'function') {
                    // Register middleware app

                    const app = (await value.value({
                        middlewareApps: middlewareApps
                    })).value;

                    middlewareApps.push([route, routeRe, app]);
    
                } else
                if (INF.LIB.CODEBLOCK.isCodeblock(value.value)) {
                    // Register inline handlers

                    const codeblock = INF.LIB.CODEBLOCK.thawFromJSON(value.value);

                    // Handles instructions:
                    //   "Server # GET() /favicon.ico": (javascript () >>>
                    if (codeblock.getFormat() === 'javascript') {
                        // Middleware app

                        const app = codeblock.run();

                        middlewareApps.push([route, routeRe, app]);

                    } else
                    // Handles instructions:
                    //   "Server # GET() /": (html () >>>
                    if (codeblock.getFormat() === 'html') {
                        // Static payload

                        const payload = codeblock.getCode();

                        middlewareApps.push([route, routeRe, function (req, res) {
                            res.writeHead(200, {
                                'Content-Type': 'text/html'
                            });
                            res.end(payload);
                        }]);
                    }
                }

                return true;
            } else
            if (pointer === 'start()') {

                const port = process.env.PORT || 8080;

                server = HTTP.createServer(function (req, res) {

                    let app = null;
                    for (let middleware of middlewareApps) {

                        if (middleware[1].test(req.url)) {

                            req.url = req.url.replace(middleware[1], '');
                            app = middleware[2];
                            break;
                        }
                    }

                    if (!app) {
                        res.writeHead(404);
                        res.end('Page Not Found!');
                        return;
                    }

                    app(req, res);
                });
                await server.listenAsync(port);

                console.log(`Server running at: http://localhost:${port}/`);

                return true;
            } else
            if (pointer === 'stop()') {

                server.close();
                server = null;

                return true;
            }
        }
    };
}
