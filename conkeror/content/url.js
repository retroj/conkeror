// -*- mode: java -*-

function onUrlKeyPress(event)
{
    var field = document.getElementById("url-field");
    var urlbar = document.getElementById("url-toolbox");

    if (event.keyCode == KeyEvent.DOM_VK_RETURN) {
	try{
	closeUrlBar();
	getWebNavigation().loadURI(field.value, nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null);
	} catch (e) {window.alert(e);}
	//    } else if (event.keyCode == KeyEvent.DOM_VK_TAB) {
	// paste current url
    } else if (event.keyCode == KeyEvent.DOM_VK_TAB 
	       || event.keyCode == KeyEvent.DOM_VK_RETURN
	       || event.keyCode == KeyEvent.DOM_VK_TAB 
	       || event.keyCode == KeyEvent.DOM_VK_ESCAPE
	       || (event.ctrlKey && (event.charCode == 103))) {
	closeUrlBar();
	event.preventDefault();
	event.preventBubble();
//     } else if (event.ctrlKey && event.charCode == 121) { // C-y
// 	field.value += gBrowser.currentURI.spec;
// 	event.preventDefault();
    }


}

function closeUrlBar()
{
    try {
	var urlField = document.getElementById("url-field");
	var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
	    .getService(Components.interfaces.nsIWindowWatcher);
	if (window == ww.activeWindow && document.commandDispatcher.focusedElement &&
	    document.commandDispatcher.focusedElement.parentNode.parentNode == urlField) {
	    _content.focus();
	}
    } catch(e) {
	window.alert(e);
    }
    var bar = document.getElementById("url-toolbox");
    if (!bar.hidden) {
	bar.hidden = true;
    }
}

function focusUrlBar()
{
    var url = document.getElementById("url-field");
    var urlbar = document.getElementById("url-toolbox");
    urlbar.hidden = false;
    url.focus();
//     url.value = getWebNavigation().currentURI.spec;
}
