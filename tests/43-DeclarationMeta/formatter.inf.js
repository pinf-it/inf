
'use strict';

exports.inf = async function (inf) {

    return {

        getFormatter: function () {

            return function (value) {

                return `${value.value} [line: ${value.meta.line}, column: ${value.meta.column}, pos: ${value.meta.pos}, file: ${value.meta.file}]`;
            }
        }
    };
}
