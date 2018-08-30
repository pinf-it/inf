#!/usr/bin/env bash.origin.script

inf inf.json

echo '--- 1 ---'

cat .NOTES.md

echo '--- 2 ---'

echo ">>>TEST_IGNORE_LINE:\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}<<<"

cat .ui.js
cp -f .ui.js .ui.js~before
perl -i -pe 's/Count: 1/Count: 2/g' .ui.js

echo '--- 3 ---'

cat .ui.js

cp -f bundle.inf.js bundle.inf.js~before
inf {
    "bundle ##": "inf.pinf.it/plugins/node-aspect-utils.",
    "bundle ##": "./reflector.",
    "bundle #": "./bundle.",
    "bundle # reflect": "contract"
}

echo '--- 4 ---'

diff -u .ui.js .ui.js~before || true

echo '--- 5 ---'

diff -u bundle.inf.js bundle.inf.js~before || true

echo '--- 6 ---'

rm -f .ui.js .ui.js~before

rm -f bundle.inf.js
mv -f bundle.inf.js~before bundle.inf.js
