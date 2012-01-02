#!/bin/sh

# Script to prepare Debian packages of conkeror including the creation
# of the so called source package. Do not move away from its current
# location -- it depends on it.
#
# It accepts one optional parameter: an upstream version number,
# e.g. "0.9.1". If a parameter is given, no date based snapshot
# version number is generated.
#
# Copyright (C) 2008-2009, 2012 Axel Beckert <abe@deuxchevaux.org>

# Find the full path of the current packaging directory and cd to it
currdir=`dirname $0`/../..
cd $currdir
olddir=$(basename $(pwd -P))
echo currdir=$currdir olddir=$olddir

# Unapply all patches if there are any
quilt pop -a

# Update the code from the git repository
git fetch

# Display the changes and ask if we should continue
git log HEAD..origin
echo -n "Hit enter to continue and merge changes or hit Ctrl-C to abort."
read line

# Merge in the fetched changes
git rebase origin/master

# Rename the packaging directory to reflect the new version number
if [ -n "$1" ]; then
    version="$1"
else
    version=`grep ^Version= application.ini | \
             sed -e 's/^Version=//;
                     s/\([0-9]\)pre/\1~~pre/;
                     s/\([0-9]\)\([ab][0-9]\|rc\|beta\|alpha\)/\1~\2/' \
            `+git`date +%y%m%d`
fi
echo -n "Hit enter to rename directory from $olddir to conkeror-$version
and generate source tar ball or hit Ctrl-C to abort."
read line

# Clean up before renaming
rm -f spawn-process-helper conkeror-spawn-helper
make clean

# Do the rename
cd ..
mv -vi $olddir conkeror-$version

# Create source package out of the git working copy
tar cvzf conkeror_$version.orig.tar.gz \
	--exclude=conkeror-$version/debian \
	--exclude=.git \
        --exclude=.gitignore \
	--exclude=.pc \
	--exclude=configure-stamp \
	conkeror-$version

# Change back to the packaging directory
cd conkeror-$version
