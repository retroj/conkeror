// -*- mode: java -*-

// Functions that are called by commands in conkeror.xul and that
// aren't part of a module go here.

var commands = [
    ["beginning-of-line", 		beginning_of_line,		[]],
    ["bookmark-bmenu-list", 		bookmark_bmenu_list, 		[]],
    ["bookmark-current-url", 		bookmark_current_url, 		[]],
    ["bookmark-jump", 			goto_bookmark, 			[]],
    ["browser-next", 			browser_next, 			[]],
    ["browser-previous", 		browser_prev, 			[]],
    ["cmd_beginLine", 			cmd_beginLine, 			[]],
    ["cmd_charNext", 			cmd_charNext, 			[]],
    ["cmd_charPrevious", 		cmd_charPrevious, 		[]],
    ["cmd_copy", 			cmd_copy, 			[]],
    ["cmd_copyOrDelete", 		cmd_copyOrDelete, 		[]],
    ["cmd_cut", 			cmd_cut, 			[]],
    ["cmd_cutOrDelete", 		cmd_cutOrDelete, 		[]],
    ["cmd_deleteCharBackward", 		cmd_deleteCharBackward, 	[]],
    ["cmd_deleteCharForward", 		cmd_deleteCharForward, 		[]],
    ["cmd_deleteToBeginningOfLine", 	cmd_deleteToBeginningOfLine, 	[]],
    ["cmd_deleteToEndOfLine", 		cmd_deleteToEndOfLine, 		[]],
    ["cmd_deleteWordBackward", 		cmd_deleteWordBackward, 	[]],
    ["cmd_endLine", 			cmd_endLine, 			[]],
    ["cmd_lineNext", 			cmd_lineNext, 			[]],
    ["cmd_linePrevious", 		cmd_linePrevious, 		[]],
    ["cmd_moveBottom", 			cmd_moveBottom, 		[]],
    ["cmd_movePageDown", 		cmd_movePageDown, 		[]],
    ["cmd_movePageUp", 			cmd_movePageUp, 		[]],
    ["cmd_moveTop", 			cmd_moveTop, 			[]],
    ["cmd_paste", 			cmd_paste, 			[]],
    ["cmd_redo", 			cmd_redo, 			[]],
    ["cmd_selectAll", 			cmd_selectAll, 			[]],
    ["cmd_selectBeginLine", 		cmd_selectBeginLine, 		[]],
    ["cmd_selectBottom", 		cmd_selectBottom, 		[]],
    ["cmd_selectCharNext", 		cmd_selectCharNext, 		[]],
    ["cmd_selectCharPrevious", 		cmd_selectCharPrevious, 	[]],
    ["cmd_selectEndLine", 		cmd_selectEndLine, 		[]],
    ["cmd_selectLineNext", 		cmd_selectLineNext, 		[]],
    ["cmd_selectLinePrevious", 		cmd_selectLinePrevious, 	[]],
    ["cmd_selectPageDown", 		cmd_selectPageDown, 		[]],
    ["cmd_selectPageUp", 		cmd_selectPageUp, 		[]],
    ["cmd_selectTop", 			cmd_selectTop, 			[]],
    ["cmd_selectWordNext", 		cmd_selectWordNext, 		[]],
    ["cmd_selectWordPrevious", 		cmd_selectWordPrevious, 	[]],
    ["cmd_undo", 			cmd_undo, 			[]],
    ["cmd_wordNext", 			cmd_wordNext, 			[]],
    ["cmd_wordPrevious", 		cmd_wordPrevious, 		[]],
    ["copy-current-url", 		copyCurrentUrl,  		[]],
    ["copy-link-location", 		copyCurrentUrl, 		[]],
    ["delete-frame", 			delete_frame, 			[]],
    ["end-of-line",     		end_of_line,    		[]],
    ["execute-extended-command",        meta_x, 			[]],
    ["find-url", 			find_url, 			[]],
    ["focus-window", 			focus_window, 			[]],
    ["go-back", 			goBack, 			[]],
    ["go-forward", 			goForward, 			[]],
    ["isearch-backward", 		isearch_backward, 		[]],
    ["isearch-forward", 		isearch_forward, 		[]],
    ["keyboard-quit", 			stopLoading, 			[]],
    ["kill-browser", 			kill_browser, 			[]],
    ["next-frame", 		        nextFrame,      		[]],
    ["numberedlinks-1", 		selectNumberedLink_1, 		[]],
    ["numberedlinks-2", 		selectNumberedLink_2, 		[]],
    ["numberedlinks-3", 		selectNumberedLink_3, 		[]],
    ["numberedlinks-4", 		selectNumberedLink_4, 		[]],
    ["numberedlinks-5", 		selectNumberedLink_5, 		[]],
    ["numberedlinks-6", 		selectNumberedLink_6, 		[]],
    ["numberedlinks-7", 		selectNumberedLink_7, 		[]],
    ["numberedlinks-8", 		selectNumberedLink_8, 		[]],
    ["numberedlinks-9", 		selectNumberedLink_9, 		[]],
    ["numberedlinks-toggle", 		toggleNumberedLinks, 		[]],
    ["open-url", 			open_url, 			[]],
    ["quit", 				quit, 				[]],
    ["revert-browser", 			reload, 			[]],
    ["switch-to-browser-other-window",	switch_browser_other_window, 	[]],
    ["stop-loading", 			stopLoading, 			[]],
    ["switch-to-browser-other-frame", 	new_frame, 			[]],
    ["switch-to-browser", 		switch_to_buffer,		[]],
    ["view-source", 			view_source, 			[]],
    ["view-source", 			view_source, 			[]],
    ["split-flip",                      split_flip,                     []],
    ["delete-other-windows",            delete_other_windows,           []],
    ["delete-window",                   delete_window,                  []],
    ["other-window",                    other_window,                   []],
    ["view-source", 			view_source, 			[]],
    ["split-window", 			split_window, 			[]],
    ["yank-to-clipboard",		yankToClipboard,        	[]]];


function exec_command(cmd)
{
    for (var i=0; i<commands.length; i++) {
	if (commands[i][0] == cmd) {
	    return commands[i][1]();
	}
    }
    message("No such command '" + cmd + "'");
}

function add_command(name, fn, args)
{
    commands.push([name,fn,args]);
}

const MOD_CTRL = 0x1;
const MOD_ALT = 0x2;
const MOD_SHIFT = 0x4;

function make_key(charCode, keyCode, mods)
{
    var key = {};
    if (charCode)
	key.charCode = charCode.charCodeAt(0);
    else
	key.keyCode = keyCode;
    key.modifiers = mods;
    return key;
}

// Sorta dirty, bind key to either the keymap or command in the keymap, kmap
function define_key(kmap, key, keymap, cmd)
{
    var obj = {key: key};
    if (cmd)
	obj.command = cmd;
    else 
	obj.keymap = keymap;
    kmap.push(obj);
}

function focus_window()
{
    alert("foo");
    _content.focus();
    document.commandDispatcher.focusedElement = null;
}

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

function beginning_of_line()
{
    scrollHorizComplete(-1);
}

function end_of_line()
{
    scrollHorizComplete(1);
}

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
    readFromMiniBuffer("Find URL in other frame:", null, "url", function(url) { window.open("chrome://conkeror/content", url, "chrome,dialog=no"); });
}

function delete_frame()
{
    window.close();
}

function open_url()
{
    try {
    readFromMiniBuffer("URL:", null, "url", function(url) { getWebNavigation().loadURI(url, nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null); });
    } catch(e) {alert(e);};
}

// Open a new browser with url
function find_url()
{
    readFromMiniBuffer("Find URL: ", null, "url", function(url) { getBrowser().newBrowser(url); });
}


function get_buffer_from_name(buf)
{
    var bs = getBrowser().getBrowserNames();
    for (var i=0; i<bs.length; i++) {
	if (bs[i] == buf) {
	    return getBrowser().getBrowserAtIndex(i);
	}
    }
}

function goto_buffer(buf)
{
    getBrowser().setCurrentBrowser(get_buffer_from_name(buf));
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
    readFromMiniBuffer("Add bookmark", getBrowser().mCurrentBrowser.contentTitle, "add-bookmark",
		       function (title) 
                         {
			     bookmark_doc(getBrowser(), title);
			     message ("Bookmarked " + getWebNavigation().currentURI.spec
				      + " - " + title);
			 });
}

function bookmark_doc(browser, aTitle)
{
    var url = browser.webNavigation.currentURI.spec;
    var title, docCharset = "text/unicode";
    title = aTitle || getBrowser().mCurrentBrowser.contentTitle || url;
    add_bookmark(url, title, docCharset);
}

// This function doesn't work.
function copyLinkLocation()
{
    goDoCommand('cmd_copyLink');
}

function isearch_forward()
{
    readInput('', focusFindBar, 'onFindKeyPress(event);');
}

function isearch_backward()
{
    readInput('', focusFindBarBW, 'onFindKeyPress(event);');
}

function browser_next()
{
    getBrowser().prevBrowser();
}

function browser_prev()
{
    getBrowser().prevBrowser();
}

function meta_x()
{
    miniBufferComplete("M-x", "commands", commands, function(fn) {fn();});
}

function inject_css()
{
    var doc = _content.content.document;
    doc.createLinkNode;
}

//// Split windows

function switch_browser_other_window()
{
    var defBrowser = "FIXME";
    var bufs = getBrowser().getBrowserNames();
    var matches = zip2(bufs,bufs);
    miniBufferComplete("Switch to buffer in other window: (default " + defBrowser + ") ", "buffer", matches, function(b) {getBrowser().split(get_buffer_from_name(b));getBrowser().focusOther();});
}

function split_window()
{
    try {
    var c = getBrowser().mBrowserContainer;
    var b = getBrowser().mCurrentBrowser;
    var ob;
    if (c.length <= 1) {
	return;
    }
    if (b == c.lastChild.firstChild)
	ob = c.firstChild.firstChild;
    else
	ob = b.parentNode.nextSibling.firstChild;
    getBrowser().split(ob);
    } catch(e) {alert(e);}
}


function split_flip()
{
    getBrowser().flip();
}

function delete_other_windows()
{
    getBrowser().removeSplit();
}

function delete_window()
{
    getBrowser().focusOther();
    getBrowser().removeSplit();
}

function other_window()
{
    getBrowser().focusOther();
}

function bookmark_bmenu_list()
{
    getWebNavigation().loadURI("chrome://conkeror/content/bookmarks.html",
			       nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null);
}


/// built in commands
function cmd_beginLine() { goDoCommand("cmd_beginLine"); }
function cmd_charNext() { goDoCommand("cmd_charNext"); }
function cmd_charPrevious() { goDoCommand("cmd_charPrevious"); }
function cmd_copy() { goDoCommand("cmd_copy"); }
function cmd_copyOrDelete() { goDoCommand("cmd_copyOrDelete"); }
function cmd_cut() { goDoCommand("cmd_cut"); }
function cmd_cutOrDelete() { goDoCommand("cmd_cutOrDelete"); }
function cmd_deleteCharBackward() { goDoCommand("cmd_deleteCharBackward"); }
function cmd_deleteCharForward() { goDoCommand("cmd_deleteCharForward"); }
function cmd_deleteToBeginningOfLine() { goDoCommand("cmd_deleteToBeginningOfLine"); }
function cmd_deleteToEndOfLine() { goDoCommand("cmd_deleteToEndOfLine"); }
function cmd_deleteWordBackward() { goDoCommand("cmd_deleteWordBackward"); }
function cmd_endLine() { goDoCommand("cmd_endLine"); }
function cmd_lineNext() { goDoCommand("cmd_lineNext"); }
function cmd_linePrevious() { goDoCommand("cmd_linePrevious"); }
function cmd_moveBottom() { goDoCommand("cmd_moveBottom"); }
function cmd_movePageDown() { goDoCommand("cmd_movePageDown"); }
function cmd_movePageUp() { goDoCommand("cmd_movePageUp"); }
function cmd_moveTop() { goDoCommand("cmd_moveTop"); }
function cmd_paste() { goDoCommand("cmd_paste"); }
function cmd_redo() { goDoCommand("cmd_redo"); }
function cmd_selectAll() { goDoCommand("cmd_selectAll"); }
function cmd_selectBeginLine() { goDoCommand("cmd_selectBeginLine"); }
function cmd_selectBottom() { goDoCommand("cmd_selectBottom"); }
function cmd_selectCharNext() { goDoCommand("cmd_selectCharNext"); }
function cmd_selectCharPrevious() { goDoCommand("cmd_selectCharPrevious"); }
function cmd_selectEndLine() { goDoCommand("cmd_selectEndLine"); }
function cmd_selectLineNext() { goDoCommand("cmd_selectLineNext"); }
function cmd_selectLinePrevious() { goDoCommand("cmd_selectLinePrevious"); }
function cmd_selectPageDown() { goDoCommand("cmd_selectPageDown"); }
function cmd_selectPageUp() { goDoCommand("cmd_selectPageUp"); }
function cmd_selectTop() { goDoCommand("cmd_selectTop"); }
function cmd_selectWordNext() { goDoCommand("cmd_selectWordNext"); }
function cmd_selectWordPrevious() { goDoCommand("cmd_selectWordPrevious"); }
function cmd_undo() { goDoCommand("cmd_undo"); }
function cmd_wordNext() { goDoCommand("cmd_wordNext"); }
function cmd_wordPrevious() { goDoCommand("cmd_wordPrevious"); }

