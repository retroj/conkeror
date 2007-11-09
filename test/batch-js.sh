#! /bin/bash

if [[ ! -e build.sh || ! -e install.sh ]]; then
    echo "This test suite must be run from Conkeror's src root."
    exit 1
fi

. test/test.sh
setup

## copy the javascript batch suite to the scratch directory.
cp test/batch-suite.js "$scratch/"
BATCHSUITEJS="$scratch/batch-suite.js"

enter_scratch_directory

### Tests
###

## batch-suite.js
##
##  Now we run javascript suites by batch-loading a test script into
##  conkeror, and reading its output.  This is fragile because there
##  has to be agreement between this script and the js script
##  concerning how test results are reported.
##
UNEXPECTEDOUT=0
while read LINE; do
    echo "$LINE"
    let "TESTSRUN = $TESTSRUN + 1"
    case "$LINE" in
        *\ ...\ fail)
            let "TESTSFAILED = $TESTSFAILED + 1" ;;
        *\ ...\ pass) ;;
        *) let "UNEXPECTEDOUT = $UNEXPEXECTEDOUT + 1" ;;
    esac
done < <(./bin/conkeror -q -batch -l "$BATCHSUITEJS" 2>&1)


## gui-xephyr
##
# Xephyr :1 &
# export DISPLAY=:1


teardown

