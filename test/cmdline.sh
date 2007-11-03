#! /bin/bash

if [[ ! -e build.sh || ! -e install.sh ]]; then
    echo "This test suite must be run from Conkeror's src root."
    exit 1
fi

TESTSRUN=0
TESTSFAILED=0

# suite desc &rest testargs
function assert-z () {
    suite="$1"
    shift
    desc="$1"
    shift
    echo -n "test: $desc ... "
    let "TESTSRUN = $TESTSRUN + 1"
    if test -z "$(eval $@)" ; then
        echo pass
    else
        echo fail
        let "TESTSFAILED = $TESTSFAILED + 1"
    fi
}

# suite desc expected &rest testargs
function assert-equal () {
    suite="$1" ; shift
    desc="$1" ; shift
    expected="$1" ; shift
    echo -n "test: $desc ... "
    let "TESTSRUN = $TESTSRUN + 1"
    if test "$expected" = "$(eval $@)" ; then
        echo pass
    else
        echo fail
        let "TESTSFAILED = $TESTSFAILED + 1"
    fi
}


### Setup
###
scratch=$(mktemp -d)
mkdir -p "$scratch/lib" "$scratch/bin"
./install.sh -build -prefix "$scratch"

## copy the javascript batch suite to the scratch directory.
cp test/batch-suite.js "$scratch/"
BATCHSUITEJS="$scratch/batch-suite.js"

## enter the scratch directory
pushd "$scratch" > /dev/null

## produce a javascript file that just dumpln's "Hello, World!"
TESTSCRIPT1="$scratch/test1.js"
TESTSCRIPT1OUT="Hello, World"\!
echo -e "\nconkeror.dumpln (\"$TESTSCRIPT1OUT\");\n" > "$TESTSCRIPT1"



### Tests
###

assert-z \
    "cmdline" \
    "\`conkeror -q -batch' produces no output" \
    "./bin/conkeror -q -batch 2>&1"

assert-equal \
    "cmdline" \
    "dumpln a pref, and browser.chromeURL is as expected" \
    "chrome://conkeror/content/conkeror.xul" \
    "./bin/conkeror -q -batch \
                    -e 'conkeror.dumpln(\
                            conkeror.preferences.getCharPref(\
                                \"browser.chromeURL\"))'\
                    2>&1"

assert-equal \
    "cmdline" \
    "load js file with \`conkeror -l'" \
    "$TESTSCRIPT1OUT" \
    "./bin/conkeror -q -batch -l \"$TESTSCRIPT1\" 2>&1"

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


### Teardown
###
popd > /dev/null
rm -r "$scratch"

echo -n "Summary: $TESTSRUN run, $TESTSFAILED failed"

if [[ "$UNEXPECTEDOUT" -gt 0 ]]; then
    echo ", $UNEXPECTEDOUT lines of unexpected output"
fi

echo

