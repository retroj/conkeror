#! /bin/bash

# (C) Copyright 2007 John J. Foerch
#
# Use, modification, and distribution are subject to the terms specified in the
# COPYING file.

scratch=$(mktemp -d)
mkdir -p "$scratch/lib" "$scratch/bin"
./install.sh -build -prefix "$scratch"
pushd "$scratch"
bin/conkeror "$@"
popd
rm -r "$scratch"
