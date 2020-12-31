#!/usr/bin/env bash.origin.script

echo ">>>TEST_IGNORE_LINE:\\ds$<<<"

echo "-- node --"

time node --eval 'console.log("Hello World!");'

echo "-- inf -- (first) --"
rm -Rf .~*~infi.log

time inf ./hello.inf.json

echo "-- inf -- (second) --"

time inf ./hello.inf.json

echo "-- inf-dist -- (first) --"
rm -Rf .~*~infi.log

time ../../dist/inf.bundle.es5.min.js ./hello.inf.json

echo "-- inf-dist -- (second) --"

time ../../dist/inf.bundle.es5.min.js ./hello.inf.json

echo "---"
