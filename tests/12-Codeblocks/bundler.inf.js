
'use strict';

exports.inf = async function (inf) {

console.log("INIT BUNDLER");

    return {

        invoke: function (pointer, value) {

console.log("BUNDLER INVOKE:", pointer, value);

        }
    };
}
