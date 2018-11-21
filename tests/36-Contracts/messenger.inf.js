
'use strict';

exports.inf = async function (inf) {

    const queue = [];

    return {

        invoke: function (pointer, value) {

            if (pointer === "enqueue") {

                if (
                    (
                        (
                            value.contract[0] === "Message" &&
                            value.contract[1].alias === "Message"
                        ) ||
                        (
                            value.contract[0] === "MessageAlso" &&
                            value.contract[1].alias === "MessageAlso"
                        )
                    ) &&
                    value.contract[1].impl.id === "tests/*/message"
                ) {

                    queue.push(value.value);

                    return true;
                }
            } else
            if (pointer === "queue") {

                return queue;
            }
        }
    };
}
