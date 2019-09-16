#!/usr/bin/env bash.origin.script

echo ">>>TEST_IGNORE_LINE:^\s+at\s+<<<"
echo ">>>TEST_IGNORE_LINE:Error: Pointer<<<"

set -e

inf {
    "# __non_existent_pointer__": "OK"
}
