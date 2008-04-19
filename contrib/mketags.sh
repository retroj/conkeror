#! /bin/bash

# (C) Copyright 2007 John J. Foerch
#
# Use, modification, and distribution are subject to the terms specified in the
# COPYING file.

function do_target_etags () {
    ETAGSDIR="$1"
    if [[ -z "$ETAGSDIR" ]]; then
        ETAGSDIR=.
    fi
    ETAGSDIR="${ETAGSDIR%/}/TAGS"
    echo -n "Building $ETAGSDIR ..."
    etags -o "$ETAGSDIR" $(find -name \*.js -and \! -name '*[~#]*')
    echo ok
}

do_target_etags "$1"
