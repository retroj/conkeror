#! /bin/bash


scratch=""
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

function setup () {
    ### Setup
    ###
    scratch=$(mktemp -d /tmp/conkeror-XXXXXX)
    mkdir -p "$scratch/lib" "$scratch/bin"
    ./install.sh -build -prefix "$scratch"
}

function enter_scratch_directory () {
    ## enter the scratch directory
    pushd "$scratch" > /dev/null
}


function teardown () {
    ### Teardown
    ###
    popd > /dev/null
    rm -r "$scratch"

    echo -n "Summary: $TESTSRUN run, $TESTSFAILED failed"

    if [[ "$UNEXPECTEDOUT" -gt 0 ]]; then
        echo ", $UNEXPECTEDOUT lines of unexpected output"
    fi

    echo
}

