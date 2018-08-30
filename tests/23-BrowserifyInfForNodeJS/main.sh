#!/usr/bin/env bash.origin.script

PATH="$__DIRNAME__/../../node_modules/.bin:$PATH"

browserify --node --ignore-missing ../../inf.js -o .inf.bundle.js

echo "--- 1 ---"

node .inf.bundle.js {
    "# echo": "OK"
}

echo "--- 2 ---"

cp -f ../../inf.js .inf.js
node .inf.bundle.js --vocabularies ../../vocabularies {
    "#": "it.pinf.inf/bo/",

    "bundle # nodejs-script": ".inf.js"
}

node .inf.js --vocabularies ../../vocabularies ../01-RunFile/inf.json

echo "--- 3 ---"

node .inf.bundle.js --vocabularies ../../vocabularies ../01-RunFile/inf.json

echo "--- 4 ---"

node .inf.bundle.es5.js --vocabularies ../../vocabularies ../01-RunFile/inf.json

echo "--- 5 ---"

node .inf.bundle.es5.min.js --vocabularies ../../vocabularies ../01-RunFile/inf.json

rm -f .inf.*
