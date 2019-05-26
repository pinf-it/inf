
'use strict';

exports.inf = async function (inf) {

    return {

        invoke: async function (pointer, value) {

            if (pointer === "runSandboxed") {

                // No entities are inherited.
                // Options can be passed including arguments just as from a CLI.
                return inf.run(value.value + "inf.json", {});
            } else
            if (pointer === "runInline") {

                // All entities are inherited.
                // Treated as if the file was inherited.
                return inf.load(value.value + "inf.json");
            }
        }
    };
}
