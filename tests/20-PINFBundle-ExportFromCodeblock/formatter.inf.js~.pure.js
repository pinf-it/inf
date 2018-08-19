function ___WrApCoDe___(format, args, _code) {
    return function WrappedCodeblock (variables, Codeblock) {
        var code = _code;
        function linesForEscapedNewline (rawCode) {
            var lines = [];
            var segments = rawCode.split(/([\\]*\\n)/);
            for (var i=0; i<segments.length ; i++) {
                if (i % 2 === 0) {
                    lines.push(segments[i]);
                } else
                if (segments[i] !== "\n") {
                    lines[lines.length - 1] += segments[i] + segments[i + 1];
                    i++;
                }
            }
            return lines;
        }
        var cleanedCode = linesForEscapedNewline(code);
        cleanedCode = cleanedCode.join("\n");
        return new (Codeblock || require("/dl/source/github.com~0ink~codeblock.js").Codeblock)({raw: cleanedCode}, format, args);
    };
};

'use strict';

exports.inf = async function (inf) {

    return {

        invoke: async function (pointer, value) {

            value = value.value;

            if (pointer === "format") {

                return value.toUpperCase();
            }
        },

        toJavaScript: (___WrApCoDe___("javascript", [], "\\nexports.format = function (value) {\\n\\n    return value.toUpperCase();\\n}", "___WrApCoDe___END"))
    };
}
