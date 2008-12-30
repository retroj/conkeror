#!/bin/sh

currdir=`dirname $0`/..
cd $currdir
olddir=$(basename $(pwd -P))
echo currdir=$currdir olddir=$olddir
quilt pop -a
git fetch
git log HEAD..origin  #optional, shows you the changes
echo -n "Hit enter to continue and merge changes or hit Ctrl-C to abort."
read line
git merge origin
version=0.9~git`date +%y%m%d`
echo -n "Hit enter to rename directory from $olddir to conkeror-$version\nand generate source tar ball or hit Ctrl-C to abort."
read line
rm -f spawn-process-helper conkeror-spawn-helper
make clean
cd ..
mv -vi $olddir conkeror-$version
tar cvzf conkeror_$version.orig.tar.gz --exclude=debian --exclude=.git --exclude=.pc --exclude=configure-stamp conkeror-$version
cd conkeror-$version
