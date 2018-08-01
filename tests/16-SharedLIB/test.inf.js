
'use strict';

exports.inf = async function (inf) {

    if (inf.LIB.foo !== "bar") {
        throw new Error("'inf.LIB' not shared!");
    }

    if (inf.baseDir !== __dirname) {
        throw new Error("'inf.baseDir' not correct!");
    }

    console.log("inf", JSON.stringify(Object.keys(inf)));
    console.log("inf.LIB", JSON.stringify(Object.keys(inf.LIB)));

    return {};
}
