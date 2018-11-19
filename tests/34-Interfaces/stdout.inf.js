
'use strict';

exports.inf = async function (inf) {

    return {

        invoke: function (pointer, value) {

            if (pointer === "out") {

                if (
                    value.interface[0] !== "pattern.stream" ||
                    value.interface[1].alias !== "pattern.stream" ||
                    value.interface[1].impl.id !== "tests/*/stream"
                ) {
                    throw new Error("Value does not implement interface 'tests/*/stream'");
                }

                process.stdout.write(value.value.messages.join("\n") + "\n");

                return true;
            }
        }
    };
}
