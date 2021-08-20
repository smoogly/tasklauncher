#!/bin/sh
# Checks presence of .only in tests

files=$(find src -type f -regextype egrep -regex ".*\.spec\.ts" -print0 | xargs -0 fgrep -ln ".only(")

if [ $files ]
then
    echo "Tests contain .only, please remove"
    echo "In files "$files
    exit 100
fi

exit 0
