#! /bin/bash

scratch=$(mktemp -d)
mkdir -p "$scratch/lib" "$scratch/bin"
./install.sh -build -prefix "$scratch"
pushd "$scratch"
bin/conkeror "$@"
popd
rm -r "$scratch"
