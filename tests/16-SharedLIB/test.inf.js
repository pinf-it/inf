
'use strict';

exports.inf = async function (inf) {

    if (inf.LIB.foo !== "bar") {
        throw new Error("'inf.LIB' not shared!");
    }

    if (inf.baseDir !== __dirname) {
        throw new Error("'inf.baseDir' not correct!");
    }

    function logKeys (label, obj) {
        var keys = Object.keys(obj);
        keys.sort();
        keys = keys.filter(function (name) {
            return (name !== "domain");
        });
        console.log(label, JSON.stringify(keys));
    }
    
    logKeys("inf", inf);
    logKeys("inf (proto)", inf.__proto__);
    logKeys("inf.LIB", inf.LIB);

    return {};
}
