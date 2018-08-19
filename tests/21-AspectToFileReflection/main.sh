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
    "bundle #": "./bundle.",

    "bundle # do": "contract"
}

echo '--- 4 ---'

diff -u .ui.js .ui.js~before

echo '--- 5 ---'

diff -u bundle.inf.js bundle.inf.js~before

echo '--- 6 ---'

mv -f .ui.js~before .ui.js
mv -f bundle.inf.js~before bundle.inf.js
