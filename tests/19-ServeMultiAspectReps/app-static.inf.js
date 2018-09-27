
'use strict';

exports.inf = async function (inf) {

    let routes = {};

    return {

        invoke: async function (pointer, value) {

            if (/^\//.test(pointer)) {

                if (
                    typeof value.value === "string" &&
                    require.resolve(value.value)
                ) {
                    value = inf.wrapValue(await inf.LIB.FS.readFileAsync(require.resolve(value.value), "utf8"));
                } else
                if (typeof value.value === 'function') {
                    value = await value.value();
                }

                routes[pointer] = value;

                return true;
            } else
            if (pointer === 'app') {
                return function (req, res) {

                    if (!routes[req.url]) {
                        res.writeHead(404);
                        res.end("Not Found");
                        return;
                    }

                    let contentType = "text/plain";
                    if (/\.html$/.test(req.url)) {
                        contentType = "text/html";
                    } else
                    if (/\.js$/.test(req.url)) {
                        contentType = "application/javascript";
                    }

                    res.writeHead(200, {
                        "Content-Type": contentType
                    });
                    res.end(routes[req.url].toString());
                    return;
                }
            }
        }
    };
}
