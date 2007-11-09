#! /bin/bash

if [[ ! -e build.sh || ! -e install.sh ]]; then
    echo "This test suite must be run from Conkeror's src root."
    exit 1
fi

. test/test.sh
setup

## produce a javascript file that just dumpln's "Hello, World!"
TESTSCRIPT1="$scratch/test1.js"
TESTSCRIPT1OUT="Hello, World"\!
echo -e "\nconkeror.dumpln (\"$TESTSCRIPT1OUT\");\n" > "$TESTSCRIPT1"

enter_scratch_directory

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


teardown

