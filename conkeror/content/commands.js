// -*- mode: java -*-

// Functions that are called by commands in conkeror.xul and that
// aren't part of a module go here.

function quit()
{
    // globalOverlay.js has all this silly error checking and useless
    // junk. Here, we just get the job done.
    var appShell = Components.classes['@mozilla.org/appshell/appShellService;1'].getService();
    appShell = appShell.QueryInterface( Components.interfaces.nsIAppShellService );
    appShell.quit(Components.interfaces.nsIAppShellService.eAttemptQuit);
}

function goBack()
{
    if (getWebNavigation().canGoBack)
	getWebNavigation().goBack();
}

function goForward()
{
    if (getWebNavigation().canGoForward)
	getWebNavigation().goForward();
}

function stopLoading()
{
    getWebNavigation().stop(nsIWebNavigation.STOP_NETWORK);
}

function reload ()
{
    return getBrowser().webNavigation.reload(nsIWebNavigation.LOAD_FLAGS_NONE);
}

// frame navigation

function nextFrame()
{
    try {
    var frames = window._content.frames;

    if (frames.length == 0)
	return;

    var w = document.commandDispatcher.focusedWindow;
    var next = 0;

    // Find the next frame to focus
    for (var i=0; i<frames.length; i++) {
	if (w == frames[i]) {
	    next = i+1;
	    break;
	}
    }
    // Focus the next one, 0 if we're at the last one
    if (next >= frames.length)
	next = 0;
    frames[next].focus();
    var oldbg = frames[next].document.bgColor;
    frames[next].document.bgColor = "red";
    setTimeout(function(doc, bgcolor) { doc.bgColor = bgcolor }, 100, frames[next].document, oldbg);

    } catch(e) {alert(e);}
}

//     alert(frames.length);

//     alert(window.document.getElementsByTagName('iframe'));
//     alert(frames[0].top.parent.document);
//     var foo = frames[0].parent.document.createElement("toolbox");
//     frames[0].parent.childNodes;

//     frames[0].focus();

//     var popup = frames[0].document.createElement("popup");
//     var txt = frames[0].document.createElement("label");
//     txt.value = "blah";
//     popup.appendChild(txt);
//     popup.id = "framepopup";
// //     popup.showPopup(frames[0], 0, 0);

//     var w = document.commandDispatcher.focusedWindow;
//     var elem = document.commandDispatcher.focusedElement;
// //     alert(elem);
// //     alert(w);
// //     frames[0].document.write("hey you");
// //     alert(window.content);
// //     alert(frames[0]);
// //     alert(frames[0].window.firstChild);
// //     for (var i=0; i<frames[0].attributes.length; i++) {
// // 	alert(frames[0].attributes[i]);
// //     }
// //     frames[1].window.focus();

function scrollHorizComplete(n)
{
    var w = document.commandDispatcher.focusedWindow;
    w.scrollTo(n>0?w.scrollMaxX:0, w.scrollY);
}

function view_source()
{
    try {
	var loadFlags = Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE;
	var viewSrcUrl = "view-source:" + getWebNavigation().currentURI.spec;
	getWebNavigation().loadURI(viewSrcUrl, loadFlags, null, null, null);
    } catch(e) {alert(e);}
}

function new_frame()
{
    readFromMiniBuffer("Find URL in other frame:", "url", function(url) { window.open("chrome://conkeror/content", url, "chrome,dialog=no"); });
}

function delete_frame()
{
    window.close();
}

function open_url()
{
    try {
    readFromMiniBuffer("URL:", "url", function(url) { getWebNavigation().loadURI(url, nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null); });
    } catch(e) {alert(e);};
}

// Open a new browser with url
function find_url()
{
    readFromMiniBuffer("Find URL: ", "url", function(url) { getBrowser().newBrowser(url); });
}


function goto_buffer(buf)
{
    var bs = getBrowser().getBrowserNames();
    for (var i=0; i<bs.length; i++) {
	if (bs[i] == buf) {
	    getBrowser().setCurrentBrowser(getBrowser().getBrowserAtIndex(i));
	    return;
	}
    }
}

function switch_to_buffer()
{
//     var defBrowser = getBrowser().lastBrowser();
    var defBrowser = "FIXME";
    var bufs = getBrowser().getBrowserNames();
    var matches = zip2(bufs,bufs);
    miniBufferComplete("Switch to buffer: (default " + defBrowser + ") ", "buffer", matches,
		       goto_buffer);

}

function kill_browser()
{
    getBrowser().killCurrentBrowser();
}

function copyCurrentUrl()
{
    writeToClipboard(getWebNavigation().currentURI.spec);
    message("Copied current URL");
}

// Copy the contents of the X11 clipboard to ours. This is a cheap
// hack because it seems impossible to just always yank from the X11
// clipboard. So you have to manually pull it.
function yankToClipboard()
{
    var str = readFromClipboard();
    var clipid = Components.interfaces.nsIClipboard;
    const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
	.getService(Components.interfaces.nsIClipboardHelper);
    gClipboardHelper.copyString(str);
    message("Pulled '" + str + "'");
}

function goto_bookmark()
{
    miniBufferComplete("Goto bookmark:", "bookmark", get_bm_strings(), 
		       function(url) { getWebNavigation().loadURI(url, nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null); });
}

function bookmark_current_url()
{
    try{
	bookmark_doc(getBrowser());
	message ("Bookmarked " + getWebNavigation().currentURI.spec
		 + " - " + getBrowser().mCurrentBrowser.contentTitle);
    } catch(e) {alert(e);}
}

function bookmark_doc(browser)
{
    var url = browser.webNavigation.currentURI.spec;;
    var title, docCharset = "text/unicode";
    title = getBrowser().mCurrentBrowser.contentTitle || url;
    add_bookmark(url, title, docCharset);
}

// This function doesn't work.
function copyLinkLocation()
{
    try {
	const shell = Components.classes["@mozilla.org/webshell;1"]
	    .getService(Components.interfaces.nsIClipboardCommands);
	if (shell.canCopyLinkLocation()) {
	    shell.copyLinkLocation();
	    message("Copied link location");
	}
    } catch(e) {alert(e);}
}
