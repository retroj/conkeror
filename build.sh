VERSION=0.5
FILES="conkeror conkeror/content conkeror/content/utils.js conkeror/content/url.js conkeror/content/numberedlinks.js conkeror/content/find.js conkeror/content/contents.rdf conkeror/content/conkeror.xul conkeror/content/conkeror.xml conkeror/content/conkeror.js conkeror/content/conkeror.css conkeror/content/commands.js"

zip conkeror-$VERSION.xpi $FILES install.js
mv conkeror-$VERSION.xpi ../downloads
