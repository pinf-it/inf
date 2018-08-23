
'use strict';

exports.inf = async function (inf) {

    return {

        "/.ui.js": (javascript () >>>

            console.log("Count: 1");

        <<<),

        "/.NOTES.md": (markdown (code, size) >>>

            Files
            =====

            ## /NOTES.md (size: %%%size['/.NOTES.md']%%% bytes)

            ```javascript
                %%%code['/.NOTES.md']%%%
            ```

            ## /main.sh (size: %%%size['/main.sh']%%% bytes)

            ```javascript
            %%%code['/main.sh']%%%
            ```

            ## /inf.json (size: %%%size['/inf.json']%%% bytes)

            ```javascript
            %%%code['/inf.json']%%%
            ```

            ## /reflector.inf.js (size: %%%size['/reflector.inf.js']%%% bytes)

            ```javascript
            %%%code['/reflector.inf.js']%%%
            ```

            ## /bundle.inf.js (size: %%%size['/bundle.inf.js']%%% bytes)

            ```javascript
            %%%code['/bundle.inf.js']%%%
            ```

            ## /.~inf.json~infi.log (size: %%%size['/.~inf.json~infi.log']%%% bytes)

            ```javascript
            %%%code['/.~inf.json~infi.log']%%%
            ```

            ## /ui.js (size: %%%size['/.ui.js']%%% bytes)

            ```javascript
            %%%code['/.ui.js']%%%
            ```

        <<<)
    };
}
