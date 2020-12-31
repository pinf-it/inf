
'use strict';

exports.inf = async function (inf) {

    return {

        invoke: function (pointer, value) {

            if (pointer === 'getApp()') {

                return function (req, res, next) {

                    const routes = value.value.middlewareApps.map(function (middleware) {
                        return middleware[0];
                    });

                    res.writeHead(200, {
                        'Content-Type': 'application/json'
                    });
                    res.end(JSON.stringify(routes, null, 4));
                };
            }
        }
    };
}
