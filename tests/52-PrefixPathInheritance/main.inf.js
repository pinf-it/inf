
'use strict';

exports.inf = async function (inf, alias) {

    const scripts = {};

    return {

        invoke: function (pointer, value) {

            if (/^set\(\)\s/.test(pointer)) {

                scripts[pointer.replace(/^set\(\)\s/, '')] = value.value;

                return true;
            } else
            if (pointer === 'showResult()') {

                console.log('Scripts:', JSON.stringify(scripts, null, 4));

                return true;
            }
        }
    };
}
