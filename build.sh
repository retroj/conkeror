VERSION=0.21
FILES="conkeror conkeror/content conkeror/content/utils.js conkeror/content/bm.js conkeror/content/bindings.js conkeror/content/url.js conkeror/content/numberedlinks.js conkeror/content/find.js conkeror/content/contents.rdf conkeror/content/conkeror.xul conkeror/content/conkeror.xml conkeror/content/conkeror.js conkeror/content/conkeror.css conkeror/content/commands.js conkeror/content/adblock.js conkeror/content/help.html conkeror/content/bookmarks.html conkeror/content/tutorial.html conkeror/content/pixel.png"

# echo Building XPI...
# zip conkeror-$VERSION.xpi $FILES install.js
# mv conkeror-$VERSION.xpi ../downloads

zip conkeror.jar $FILES
cp conkeror.jar chrome
# put it in our firefox install
mv conkeror.jar /home/sabetts/.mozilla/firefox/gx9at69t.default/extensions/{a79fe89b-6662-4ff4-8e88-09950ad4dfde}/chrome
# Build an xpi
if [ x$1 = xxpi ]; then
    echo Building XPI...
    zip -r conkeror-firefox-$VERSION.xpi chrome install.rdf components/nsCrank.js
    mv conkeror-firefox-$VERSION.xpi ../downloads
fi
