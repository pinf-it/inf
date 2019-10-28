
'use strict';

const ASSERT = require("assert");

class Formatter {

    constructor () {
        this._mode = null;
    }

    async invoke (pointer, value) {

        ASSERT.deepEqual(Object.keys(this), ['_mode', '_infComponent']);
        ASSERT.deepEqual(Object.keys(this._infComponent), ['alias', 'impl', 'invoke', 'invokeContractAliasMethod']);

        if (/^set\(\)\s/.test(pointer)) {
            if (pointer.replace(/^set\(\)\s/, '') === 'mode') {
                this._mode = value.value;
                return true;
            }
        }
    }

    getFormatter () {

        ASSERT.deepEqual(Object.keys(this), ['_mode', '_infComponent']);
        ASSERT.deepEqual(Object.keys(this._infComponent), ['alias', 'impl', 'invoke', 'invokeContractAliasMethod']);

        const mode = this._mode;

        return function (value) {
            if (mode === "UPPERCASE") {
                value = value.toUpperCase();
            }
            return value;
        }
    }

}

exports.inf = async function (inf) {
    return new Formatter();
}
