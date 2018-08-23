#!/usr/bin/env bash.origin.script

[ ! -e .~inf.json~infi.log ] || rm -f .~inf.json~infi.log
[ ! -e lib/.~lib.inf.json~infi.log ] || rm -f lib/.~lib.inf.json~infi.log

inf inf.json

echo "--- 1 ---"

inf .~inf.json~infi.log

echo "--- 2 ---"

cat lib/.~lib.inf.json~infi.log

echo -e "\n--- 3 ---"

cat .~inf.json~infi.log
