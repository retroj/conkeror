// block ads for conkeror

var CICP = Components.interfaces.nsIContentPolicy;
var console         = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
function log(msg) { console.logStringMessage(msg); }

var gAdblockPatterns = [];
var blockSchemes = [];
var blockTypes = [];

function addPattern (str)
{
    gAdblockPatterns.push (new RegExp (str, "i"));
}

function matches_pattern (str)
{
    for (var j=0; j<gAdblockPatterns.length; j++) {
	if (gAdblockPatterns[j].test(str))
	    return true;
    }
    return false;
}

var policy = {
    shouldLoad: function(contentType, contentLocation, requestOrigin, requestingNode, mimeTypeGuess, extra)
    {
	try {
	    if (blockTypes[contentType] && blockSchemes[contentLocation.scheme] && matches_pattern (contentLocation.spec)) {
		//log ("Blocking: " + contentLocation.spec + " type: " + contentType);
		return CICP.REJECT_REQUEST;
	    }
	} catch (e) { }
	return CICP.ACCEPT;
    },
    shouldProcess: function(contentType, contentLocation, requestOrigin, requestingNode, mimeType, extra) {
	return CICP.ACCEPT;
    },
    // nsISupports interface implementation
    QueryInterface: function(iid) {
	return this;
    }
};

var factory = {
    // nsIFactory interface implementation
    createInstance: function(outer, iid) {
	if (outer != null) throw Components.results.NS_ERROR_NO_AGGREGATION;
	return policy;
    },
    observe: function(subject, topic, prefName)
    {
	log("adblock pref change");
	if (prefName == "conkeror.adblock") adblockReload();
    },
    QueryInterface: function(iid) {
	if (!iid.equals(Components.interfaces.nsISupports) &&
	    !iid.equals(Components.interfaces.nsISupportsWeakReference) &&
	    !iid.equals(Components.interfaces.nsIFactory) &&
	    !iid.equals(Components.interfaces.nsIObserver))
	    {
		dump("Adblock content policy factory object: QI unknown interface: " + iid + "\n");
		throw Components.results.NS_ERROR_NO_INTERFACE;
	    }
		
	return this;
    }
};

function adblockReload ()
{
    var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
    var branch = prefs.getBranch("conkeror.");
    
    var list = branch.prefHasUserValue("adblock") ? branch.getCharPref("adblock") : null;
    gAdblockPatterns = [];
    if (list && list != "") {
	list = list.split (" ");
	for (i=0; i<list.length; i++) {
	    if (i != "")
		addPattern (list[i]);
	}
    }
}

adblock_init();

function adblock_init ()
{
    // Listen for preference changes
    try {
	var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranchInternal);
	prefs.addObserver("conkeror", factory, true);
    } catch (e) { log("pref observer: " + e); }

    adblockReload();
    
    blockSchemes = new Array;
    blockTypes = new Array;
    blockSchemes["http"] = true;
    blockSchemes["https"] = true;
//     blockTypes[CICP.IMAGE] = true;
    blockTypes[CICP.TYPE_IMAGE] = true;
//     blockTypes[CICP.SCRIPT] = true;
    blockTypes[CICP.TYPE_SCRIPT] = true;
//     blockTypes[CICP.OBJECT] = true;
    blockTypes[CICP.TYPE_OBJECT] = true;
//     blockTypes[CICP.DOCUMENT] = true;
    blockTypes[CICP.TYPE_DOCUMENT] = true;
//     blockTypes[CICP.SUBDOCUMENT] = true;
    blockTypes[CICP.TYPE_SUBDOCUMENT] = true;

    log("adblock loaded!" + CICP.TYPE_SUBDOCUMENT);
}
