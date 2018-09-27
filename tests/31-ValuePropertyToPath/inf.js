
'use strict';

exports.inf = async function (inf) {

    let message = null;

    return {

        invoke: async function (pointer, value) {

            if (pointer === "resolve") {

                if (typeof value.value === "object") {

                    console.log(value.propertyToPath('path1'));
                    console.log(value.propertyToPath('sub.path2'));

                } else {

                    console.log(value.toPath());

                }

                return true;
            }
        }
    };
}
