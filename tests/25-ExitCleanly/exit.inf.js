
'use strict';

exports.inf = async function (inf) {

    return {

        invoke: function (pointer, value) {

            if (pointer === "exit") {

                // NOTE: There should be NO active handlers nor requests!

                let handles = process._getActiveHandles().filter(function (handle) {
                    return (!handle._isStdio);
                });
                if (handles.length) {
                    console.error("handles", handles);
                }
                let requests = process._getActiveRequests();
                if (requests.length) {
                    console.error("requests", requests);
                }
            }
        }
    };
}
