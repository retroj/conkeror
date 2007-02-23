#! /bin/bash

source VERSION

## TARGET
##
##   xpi        build the xpi as non-release.  version will get subminor
##              tacked on.
##
##   release    build the xpi as release.  the xpi will be put in
##              ../downloads/
##
##   jar        build the jar only as non-release.  version will get
##              subminor tacked on.
##
##   install-jar   build the jar and attempt shortcut install to $PROFILE
##
##   announce   Edit the web page to announce the new release version.
##
##   etags      build TAGS file, requires directory arg.
##
##
TARGET='help'


## PROFILE
##
##   This variable is used when a shortcut jar-only install is requested.
##
PROFILE="" # arg for install-jar

## ETAGSDIR
##
##   This variable is for target `etags'.  It specifies the destination
##   directory for the TAGS file.
##
ETAGSDIR=""

while [[ "$1" = [-a-z]* ]]; do
    case "$1" in
        install-jar)
            TARGET=install-jar
            PROFILE="$2"
            if [[ -z "$2" ]]; then
                echo "error: install-jar requires an arg.  please read the source."
                exit 1
            fi
            shift ;;
        xpi)
            TARGET=xpi ;;
        jar)
            TARGET=jar ;;
        release)
            TARGET=release ;;
        announce)
            TARGET=announce ;;
        etags)
            TARGET=etags
            ETAGSDIR="$2"
            shift ;;
        notes)
            TARGET=notes ;;
        help|-help|--help)
            TARGET=help ;;
        *)
            echo 'bad usage. please read the source.'
            exit 1
    esac
    shift
done


## if this is not an official release, tag on a build date.
##
## if this is an official release, strip the subminor.
##
MILESTONE="${VERSION##*.}"

case "$TARGET" in
    release|announce)
        VERSION="${VERSION%.*}" ;;
    *)
        VERSION="${VERSION}.$(date +%Y%m%d)"
esac
echo "build target: $TARGET, $VERSION"



function assert_conkeror_src () {
    if  [[ ! -e install.rdf ]] || \
        [[ ! -e conkeror/content/contents.rdf ]];
    then
        echo "This directory does not appear to contain the Conkeror source code."
        exit 1
    fi
}



function do_target_jar () {
    echo -n Building JAR...
    mkdir -p jar-build
    cp -r conkeror jar-build/conkeror
    pushd jar-build > /dev/null
    FILES=($(find conkeror -regex '.*[^~#]' | grep -v CVS))
    ## begin preprocessing
    ##
    perl -pi -e 's/\$CONKEROR_VERSION\$/'$VERSION'/g' conkeror/content/contents.rdf
    perl -pi -e 's/\$CONKEROR_VERSION\$/'$VERSION'/g' conkeror/content/conkeror.js
    ##
    ## end preprocessing
    zip conkeror.jar "${FILES[@]}" > /dev/null
    popd > /dev/null
    mv jar-build/conkeror.jar .
    rm -r jar-build
    echo ok
}


function do_target_install_jar () {
    do_target_jar
    echo -n Performing JAR-only install for profile "$PROFILE"...
    # find the salted profile dir
    salted=$(ls -d ~/.mozilla/firefox/*."$PROFILE")'/extensions/{a79fe89b-6662-4ff4-8e88-09950ad4dfde}/chrome/'
    if [[ ! -e "$salted" ]]; then
        echo failed
        echo "error (not found): $salted"
        exit 1
    fi
    mv conkeror.jar "$salted"
    echo ok
}


function do_target_xpi () {
    do_target_jar
    echo -n Building XPI...
    mkdir -p xpi-build/chrome
    mv conkeror.jar xpi-build/chrome/
    cp install.rdf xpi-build/
    cp -r components xpi-build/components
    pushd xpi-build > /dev/null
    ## begin preprocessing
    ##
    perl -pi -e 's/\$CONKEROR_VERSION\$/'$VERSION'/g' install.rdf
    ##
    ## end preprocessing
    zip -r ../conkeror-firefox-$VERSION.xpi chrome install.rdf components/nsCrank.js > /dev/null
    popd > /dev/null
    rm -r xpi-build
    echo ok
}


function do_check_milestone_for_release ()
{
    if [[ "$MILESTONE" = "0" ]]; then
        return
    fi

    dest=VERSION
    proposed="${VERSION%.*}".$(( ${VERSION#*.} + 1 )).0

    echo "The version given in the file $dest does not have 0 as its last component."
    echo -n "Shall I rewrite \`VERSION=$VERSION.$MILESTONE' to \`VERSION=$proposed'? [yN] "
    read
    if [[ "$REPLY" = [Yy]* ]]; then
        perl -pi -e 's/^VERSION='$VERSION'\.'$MILESTONE'$/VERSION='$proposed'/' "$dest"
        echo "Version changed in $dest.  Please run this build program again."
        exit
    else
        echo "Leaving $dest untouched.  Continuing with build."
    fi
}


function do_target_release () {
    do_check_milestone_for_release
    do_target_xpi
    echo -n Putting conkeror-firefox-$VERSION.xpi in downloads directory ...
    mv conkeror-firefox-$VERSION.xpi ../downloads
    echo ok
}



function diff_wrapper () {
    scratch="$1"
    dest="$2"
    perlexp="$3"

    scratchfile="${scratch}/$dest"
    patchfile="${scratch}/$dest.patch"

    echo -n "Processing $dest ..."
    perl -0777 -p -e "$perlexp" "$dest" > "$scratchfile"
    echo ok

    if cmp "$dest" "$scratchfile" ; then
        echo "$dest does not need to be updated"
    else
        diff -u "$dest" "$scratchfile" | tee "$patchfile"
        echo -n "Apply this patch to $dest? [yN] "
        read
        if [[ "$REPLY" = [Yy]* ]]; then
            patch < "$patchfile"
        else
            echo "Leaving $dest untouched"
        fi
    fi
}


function do_target_announce () {
    do_check_milestone_for_release
    echo Entering ../www/ ... ok
    pushd ../www/ > /dev/null
    scratch=$(mktemp -d)

    perlexp='s/(?<=<!--\scontrolled\scontent\sinsertion\spoint::whatsnew\s-->\n) ()(?!.*'$VERSION'.*$)/<li>'$VERSION' released! \('"$(date '+%b %d, %Y')"'\)<\/li>\n/mxg'
    diff_wrapper "$scratch" index.html "$perlexp"

    perlexp='s/(?<=<!-- begin controlled content. do not edit manually. id:newestlink -->).*?(?=<!-- end controlled content. -->)/<a href="http:\/\/downloads.mozdev.org\/conkeror\/conkeror-firefox-'$VERSION'.xpi">conkeror-firefox-'$VERSION'.xpi<\/a>/g'
    diff_wrapper "$scratch" installation.html "$perlexp"

    rm -r "$scratch"
    popd > /dev/null
}


function do_target_etags () {
    if [[ -z "$ETAGSDIR" ]]; then
        ETAGSDIR=.
    fi
    ETAGSDIR="${ETAGSDIR%/}/TAGS"
    echo -n "Building $ETAGSDIR ..."
    etags -o "$ETAGSDIR" conkeror/content/*.js
    echo ok
}


function do_target_notes () {
    FILES=($(find conkeror -name \*.js))
    for file in "${FILES[@]}"; do
        fileo="${file//\//\/}"
        perl -0777 -ne 's/## BLOCK COMMENTS
                           (.*\/\*\s*[A-Z][A-Z].*:.*$
                            (\n.*$)*?
                            (\n.*\*\/)
                            (?{ $p = pos(); })) |
                          ## LINE COMMENTS
                           (.*\/\/\s*[A-Z][A-Z].*:.*$
                            ((\n.*\/\/.*$)*)
                            (?{ $p = pos(); }))
                         /print "'$fileo':$p\n" . $& . "\n\n"/mexg' < "$file"
    done
}


function do_target_help () {
    echo "For this script to work, your current working directory must"
    echo "be \`<CONKEROR>/src' where <CONKEROR> is the project root."
    echo "This script expects to find the subdirectory structure,"
    echo "\`conkeror/content', VERSION and install.rdf in the current"
    echo "directory, \`downloads' and \`www' in the parent directory,"
    echo "and possibly other files."
    echo
    echo 'Usage:  ./build.sh <TARGET>'
    echo 'where <TARGET> is one of:'
    echo
    echo ' jar                    Builds a non-release jar in the current directory.'
    echo
    echo ' install-jar <PROFILE>  Builds a non-release jar, attempts to find the'
    echo '                        location of an installed Conkeror for <PROFILE>'
    echo '                        and puts the jar there.  <PROFILE> is the human-'
    echo '                        readable name, not the salted name.'
    echo
    echo ' xpi                    Builds a non-release xpi in the current directory.'
    echo
    echo ' release                Builds a release xpi and puts it in ../downloads.'
    echo
    echo ' announce               Modify the website in ../www to announce a release.'
    echo
    echo ' etags [DIR]            Build TAGS file in etags format.  If a'
    echo '                        directory is given, TAGS will be made in'
    echo '                        that directory.'
    echo
    echo ' notes                  Shows specially formatted comments in'
    echo "                        \`conkeror/content/*.js'  Modifies no files."
    echo
    echo ' help                   Shows this help message.  Modifies no files.'
    echo
}


assert_conkeror_src

case "$TARGET" in
    jar) do_target_jar ;;
    install-jar) do_target_install_jar ;;
    xpi) do_target_xpi ;;
    release) do_target_release ;;
    announce) do_target_announce ;;
    etags) do_target_etags ;;
    notes) do_target_notes ;;
    help) do_target_help ;;
esac

