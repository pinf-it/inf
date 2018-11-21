
'use strict';

exports.inf = async function (inf) {

    return {

        invoke: async function (pointer, value) {

            if (pointer === "out") {

                if (
                    value.contract[0] === "Message" &&
                    value.contract[1].alias === "Message" &&
                    value.contract[1].impl.id === "tests/*/message"
                ) {
                    if (typeof value.value === "function") {
                        value = await value.value();
                    }
                    if (
                        value.contract[0] !== "Message" ||
                        value.contract[1].alias !== "Message" ||
                        value.contract[1].impl.id !== "tests/*/message"
                    ) {
                        throw new Error("Value does not implement interface 'tests/*/stream'");
                    }

                    process.stdout.write(value.value.messages.join("\n") + "\n");

                    return true;
                }
            }
        }
    };
}
