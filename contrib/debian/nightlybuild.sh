#!/bin/sh

# Script for nightly builds of conkeror .debs
#
# Inspired by an idea of Nicholas A. Zigarovich <nick@servo.cc>
# Code by Axel Beckert <abe@deuxchevaux.org>
#
# Copyright (C) 2009 Axel Beckert <abe@deuxchevaux.org>
#
# Needs the following Debian packages and their dependencies installed
# (besides "required" packages like coreutils and conkeror build
# dependencies) to work: devscripts, git-core
#
# If you want to use all features of this script, you need also the
# following packages: gnupg, openssh-client
#
# And on the machine hosting the APT repository, you'll need the
# package reprepro.
#
# How to use:
#
# Create the file ~/.conkeror-nightlybuildrc and write at least a line
# like the following into it:
#
#   WORKDIR=/path/to/the/directory/where/the/builds/should/happen
#
# Example ~/.conkeror-nightlybuildrc similar to the one used for
# http://noone.org/conkeror-nightly-debs/:
#
#  # -*- sh -*-
#  WORKDIR=$HOME/conkeror.nightly
#  SIGNKEY=373B76B4
#  UPLOAD=yes
#  UPLOAD_SSH_KEY=~/.ssh/id_rsa.conkeror-nightly
#  UPLOAD_SSH_HOST=noone.org
#  UPLOAD_SSH_USER=abe
#  UPLOAD_SSH_DIR=http/htdocs/conkeror-nightly
#  USE_REPREPRO=yes
#
# I think the remaining variable names are quite self-explaining. If
# not, look at this script's source code (you're doing that already
# ;-) and see where they're used. It's not too hard, the script is
# fairly small and straight forward. ;-)

# Bail out on any error.
set -e

# Check for the the config file and read it
RCFILE=$HOME/.conkeror-nightlybuildrc
if [ ! -s $RCFILE ]; then
    echo "$RCFILE does not exist or is empty"
    exit 1
fi
. $RCFILE

# Check if a working directory is defined. Bail out if not.
if [ -z "$WORKDIR" ]; then
    echo '$WORKDIR must be defined in '$RCFILE
    exit 2
fi

# Check if $WORKDIR exists, otherwise create it.
if [ ! -d "$WORKDIR" ]; then
    mkdir -p "$WORKDIR"
fi

# Define places and version number
MASTERDIR=$WORKDIR/MASTER
BUILDDIR=$WORKDIR/BUILD
UNIXTIME=`date +%s`
VERSION=0.9.1+git`date +%y%m%d`
RELEASE=$VERSION-~nightlybuild$UNIXTIME
DATEDIR=$BUILDDIR/conkeror-$VERSION
DATE=`date -R`

# Check if MASTER directory exists, if not, create it (untested code!)
cd $WORKDIR
if [ ! -d $MASTERDIR ]; then
    git clone git://repo.or.cz/conkeror.git $MASTERDIR
fi

# Set the right options for debuild (signed vs unsigned packages)
DEBUILDOPTIONS='-uc -us'
if [ ! -z "$SIGNKEY" ]; then
    DEBUILDOPTIONS="-k$SIGNKEY"
fi

# Create build dir
mkdir -p $BUILDDIR

# Remove old builds
rm -rf $BUILDDIR/*

# Update master copy
cd $MASTERDIR
git pull

# Copy tree into build environment
cp -priv $MASTERDIR $DATEDIR

# Build orig.tar.gz
cd $BUILDDIR
tar cvzf conkeror_$VERSION.orig.tar.gz --exclude=.git conkeror-$VERSION

# Add an appropriate changelog entry
cd $DATEDIR/debian
mv changelog changelog.tmp
echo "conkeror ($RELEASE) UNRELEASED; urgency=low

  * Automatically built package based on the state of
    http://repo.or.cz/w/conkeror.git at $DATE

 -- Conkeror Nightly Build <abe+conkeror-nightly@deuxchevaux.org>  $DATE
" > changelog
cat changelog.tmp >> changelog
rm changelog.tmp

# Build the package
cd ..
debuild $DEBUILDOPTIONS -i'(?:^|/).*~$|(?:^|/)\.#.*$|(?:^|/)\..*\.swp$|(?:^|/),,.*(?:$|/.*$)|(?:^|/)(?:DEADJOE|\.cvsignore|\.arch-inventory|\.bzrignore|\.gitignore|\.hgignore)$|(?:^|/)(?:CVS|RCS|\.deps|\{arch\}|\.arch-ids|\.svn|\.hg|_darcs|\.git|\.shelf|_MTN|\.bzr(?:\.backup|tags)|update\.sh)(?:$|/.*$)'

# Upload the files
cd ..

if [ "$UPLOAD" = "yes" ]; then
    scp -i $UPLOAD_SSH_KEY -p *build *deb *changes *dsc *gz \
	$UPLOAD_SSH_USER@$UPLOAD_SSH_HOST:$UPLOAD_SSH_DIR

    if [ "$USE_REPREPRO" = "yes" ]; then
	ssh -i $UPLOAD_SSH_KEY $UPLOAD_SSH_USER@$UPLOAD_SSH_HOST \
	    "cd $UPLOAD_SSH_DIR; reprepro -v includedeb lenny" *.deb "; reprepro -v includedeb sid" *.deb "; reprepro -v includedsc lenny " *.dsc "; reprepro -v includedsc sid " *.dsc ";"
    fi
fi
