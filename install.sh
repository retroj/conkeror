#! /bin/bash

## BUILD
##
##   Whether to build the xulapp.  This is just a shortcut for developers and hackers.
##
BUILD=""


## PREFIX
##
##   Install prefix.  Conkeror will be installed to $PREFIX/lib/conkeror and a
##   symlink to the stub binary will be placed in $PREFIX/bin/conkeror
##
PREFIX=/usr/local

while [[ "$1" = -* ]]; do
    case "$1" in
        -build) BUILD=1 ;;
        -prefix) PREFIX="${2%/}" ; shift ;;
        *)
            echo "Unrecognized option. Please read the source."
            exit 1
    esac
    shift
done



function assert_conkeror_src () {
    if  [[ ! -e build.sh ]]; then
        echo "The current directory does not appear to contain the Conkeror source code."
        exit 1
    fi
}


if [[ -n "$BUILD" ]]; then
    ## -build has been requested.
    ## assert we are in the conkeror source directory
    assert_conkeror_src
    bash build.sh xulapp
fi

### conkeror.xulapp should be in the current directory
if [[ ! -e conkeror.xulapp ]]; then
    echo "conkeror.xulapp not found.  install cannot continue."
    exit 1
fi





echo -n "Installing conkeror to $PREFIX/lib/conkeror ..."
xulrunner --install-app conkeror.xulapp "$PREFIX/lib/"
echo ok

if [[ -e "$PREFIX/bin/conkeror" ]]; then
    rm "$PREFIX/bin/conkeror"
fi
echo -n "Creating symlink to stub binary in $PREFIX/bin ..."
pushd "$PREFIX/bin" > /dev/null
ln -s ../lib/conkeror/conkeror conkeror
popd > /dev/null
echo ok

echo "Done.  If you get an error that the correct GRE version"
echo "cannot be found, try one of the following commands:"
echo "for system-wide install:   xulrunner --register-global"
echo "for single-user install:   xulrunner --register-user"
