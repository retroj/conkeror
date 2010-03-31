#!/bin/sh

# Script for nightly builds of conkeror .debs
#
# Inspired by an idea of Nicholas A. Zigarovich <nick@servo.cc>
# Code by Axel Beckert <abe@deuxchevaux.org>
#
# Copyright (C) 2009, 2010 Axel Beckert <abe@deuxchevaux.org>
#
# Needs the following Debian packages and their dependencies installed
# (besides "required" packages like coreutils and conkeror build
# dependencies) to work: devscripts, git-core
#
# If you want to use all features of this script, you need also the
# following packages: gnupg, openssh-client, dctrl-tools, gzip, bzip2
#
# And on the machine hosting the APT repository, you'll need the
# package reprepro.
#
# If you do only binary rebuilds for other architectures, you do _not_
# need to have the nightly builds APT repository in your
# /etc/apt/sources.list since we fetch the Sources list manually,
# parse it with grep-dctrl and fetch the source package with dget.

#
# How to use:
#
# Create the file ~/.conkeror-nightlybuildrc and write at least two
# lines like the following into it:
#
#  WORKDIR=/path/to/the/directory/where/the/builds/should/happen
#  CONTACT=you@example.com
#
# Example ~/.conkeror-nightlybuildrc similar to the one used for the
# initial builds on http://noone.org/conkeror-nightly-debs/:
#
#  # -*- sh -*-
#  WORKDIR=$HOME/conkeror.nightly
#  CONTACT=abe+conkeror-nightly@noone.org
#  SIGNKEY=373B76B4
#  UPLOAD=yes
#  UPLOAD_SSH_KEY=~/.ssh/id_rsa.conkeror-nightly
#  UPLOAD_SSH_HOST=noone.org
#  UPLOAD_SSH_USER=abe
#  UPLOAD_SSH_DIR=http/htdocs/conkeror-nightly
#  USE_REPREPRO=yes
#
# Example ~/.conkeror-nightlybuildrc similar to the one used for
# binary-only builds of conkeror-spawn-process-helper on
# http://noone.org/conkeror-nightly-debs/:
#
#  # -*- sh -*-
#  WORKDIR=$HOME/conkeror.nightly
#  CONTACT=abe+conkeror-nightly@noone.org
#  SIGNKEY=373B76B4
#  UPLOAD=yes
#  UPLOAD_SSH_KEY=~/.ssh/id_rsa.conkeror-nightly
#  UPLOAD_SSH_HOST=noone.org
#  UPLOAD_SSH_USER=abe
#  UPLOAD_SSH_DIR=http/htdocs/conkeror-nightly
#  USE_REPREPRO=yes
#  BINARY_ONLY_BUILD=yes
#  SOURCES_LIST_URL=http://noone.org/conkeror-nightly-debs/dists/lenny/main/source/Sources.gz
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

# Check if a contact is defined. Set a dummy value if not.
if [ -z "$CONTACT" ]; then
    CONTACT=package-builder-has-not-set-contact-address@example.com
fi

# Check if $WORKDIR exists, otherwise create it.
if [ ! -d "$WORKDIR" ]; then
    mkdir -p "$WORKDIR"
fi

# Define places and version number
MASTERDIR=$WORKDIR/MASTER
BUILDDIR=$WORKDIR/BUILD
UNIXTIME=`date +%s`
DATE=`date -R`

# Create build dir
mkdir -p $BUILDDIR

# Remove old builds
rm -rf $BUILDDIR/*

# If we just rebuild a nightly snapshot for a new architecture, we
# fetch the list of source packages, extract the file name of the
# conkeror package out of it and download the appropriate conkeror
# source package with dget.
if [ "$BINARY_ONLY_BUILD" = "yes" ]; then
    SOURCESTMP=`mktemp`

    # Download Sources file
    SOURCEENC="${SOURCES_LIST_URL##*.}"
    if [ -n "$SOURCEENC" ]; then
	SOURCESTMPENC=`mktemp`
	wget -O $SOURCESTMPENC "$SOURCES_LIST_URL";
	if [ "$SOURCEENC" = "gz" ]; then
	    zcat $SOURCESTMPENC > $SOURCESTMP
	elif [ "$SOURCEENC" = "bz2" ]; then
	    bzcat $SOURCESTMPENC > $SOURCESTMP
	else
	    echo Unsupported suffix $SOURCEENC in "$SOURCES_LIST_URL" 1>&2
	    exit 1;
	fi
	rm -vf $SOURCESTMPENC
    else
	wget -O $SOURCESTMP "$SOURCES_LIST_URL";
    fi

    # Find package in Sources file
    INFOTMP=`mktemp`
    grep-dctrl -S conkeror $SOURCESTMP | sort-dctrl -k Version:v - | \
	grep-dctrl -s Checksums-Sha256,Directory conkeror - > $INFOTMP
    rm -vf $SOURCESTMP

    # Calculate source package URL
    BASE_URL="`echo \"$SOURCES_LIST_URL\" | sed -e 's:/dists/.*$::'`"
    POOL_DIR="`grep '^Directory:' $INFOTMP | awk '{print $2}'`"
    DSC="${BASE_URL}/${POOL_DIR}/`grep '\.dsc$' $INFOTMP | awk '{print $3}'`"

    # Download source package
    cd "$BUILDDIR"
    dget -u "$DSC"

    # Determine the correct version
    RELEASE="`gpg < \"${DSC##*/}\" 2>&1 | grep-dctrl -s Version conkeror - | \
        awk '{print $2}'`"
    VERSION="`echo \"$RELEASE\" | sed -e 's/-.*$//'`"
    DATEDIR="$BUILDDIR/conkeror-$VERSION"

    WHATTOBUILD=-B
else
    # Check if MASTER directory exists, if not, create it (untested code!)
    cd $WORKDIR
    if [ ! -d $MASTERDIR ]; then
	git clone git://repo.or.cz/conkeror.git $MASTERDIR
    fi

    # Update master copy
    cd $MASTERDIR
    git pull

    # Determine the correct version
    VERSION=`grep ^Version= $MASTERDIR/application.ini | \
        sed -e 's/^Version=//'`+git`date +%y%m%d`
    RELEASE="$VERSION-~nightlybuild$UNIXTIME"
    DATEDIR="$BUILDDIR/conkeror-$VERSION"

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

 -- Conkeror Nightly Build <$CONTACT>  $DATE
" > changelog
    cat changelog.tmp >> changelog
    rm changelog.tmp
fi

# Set the right options for debuild (signed vs unsigned packages)
DEBUILDOPTIONS='-uc -us'
if [ ! -z "$SIGNKEY" ]; then
    DEBUILDOPTIONS="-k$SIGNKEY"
fi

# Build the package
cd $DATEDIR
debuild $DEBUILDOPTIONS $WHATTOBUILD -i'(?:^|/).*~$|(?:^|/)\.#.*$|(?:^|/)\..*\.swp$|(?:^|/),,.*(?:$|/.*$)|(?:^|/)(?:DEADJOE|\.cvsignore|\.arch-inventory|\.bzrignore|\.gitignore|\.hgignore)$|(?:^|/)(?:CVS|RCS|\.deps|\{arch\}|\.arch-ids|\.svn|\.hg|_darcs|\.git|\.shelf|_MTN|\.bzr(?:\.backup|tags)|update\.sh)(?:$|/.*$)'

# Upload the files
cd ..

if [ "$UPLOAD" = "yes" ]; then
    if [ "$BINARY_ONLY_BUILD" = "yes" ]; then
	scp -i $UPLOAD_SSH_KEY -p *build *deb *changes \
	    $UPLOAD_SSH_USER@$UPLOAD_SSH_HOST:$UPLOAD_SSH_DIR
	if [ "$USE_REPREPRO" = "yes" ]; then
	    ssh -i $UPLOAD_SSH_KEY $UPLOAD_SSH_USER@$UPLOAD_SSH_HOST \
		"cd $UPLOAD_SSH_DIR; reprepro -v includedeb lenny" *.deb "; reprepro -v includedeb sid" *.deb ";"
	fi
    else
	scp -i $UPLOAD_SSH_KEY -p *build *deb *changes *dsc *gz \
	    $UPLOAD_SSH_USER@$UPLOAD_SSH_HOST:$UPLOAD_SSH_DIR

	if [ "$USE_REPREPRO" = "yes" ]; then
	    ssh -i $UPLOAD_SSH_KEY $UPLOAD_SSH_USER@$UPLOAD_SSH_HOST \
		"cd $UPLOAD_SSH_DIR; reprepro -v includedeb lenny" *.deb "; reprepro -v includedeb sid" *.deb "; reprepro -v includedsc lenny " *.dsc "; reprepro -v includedsc sid " *.dsc ";"
	fi
    fi
fi
