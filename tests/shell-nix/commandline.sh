#! /bin/bash

conkeror-running () {
    ## really blunt way to see if conkeror is running
    pidof xulrunner-bin >/dev/null
}

testConkerorNotRunningAtStart () {
    assertFalse conkeror-running
}

testConkerorBatch () {
    got=$(conkeror -q -batch -e 'dumpln("hello");' 2>&1)
    assertEquals hello "$got"
}

testConkerorNotRunningAtEnd () {
    assertFalse conkeror-running
}


if conkeror-running; then
    echo "Conkeror appears to be running.  Cannot continue testing." >&2
    exit 1
fi

if [[ -z $(which shunit2) ]]; then
    echo "shunit2 not found in path.  cannot run tests." >&2
    exit 1
fi
. $(which shunit2)

