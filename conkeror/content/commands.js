// -*- mode: java -*-

// Functions that are called by commands in conkeror.xul and that
// aren't part of a module go here.

var gCommands = [
    ["beginning-of-line", 		beginning_of_line,		[]],
    ["bookmark-bmenu-list", 		bookmark_bmenu_list, 		[]],
    ["bookmark-current-url", 		bookmark_current_url, 		[]],
    ["bookmark-jump", 			goto_bookmark, 			[]],
    ["buffer-next", 			browser_next, 			[]],
    ["buffer-previous", 		browser_prev, 			[]],
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
    ["cmd_scrollPageUp", 		cmd_scrollPageUp, 		[]],
    ["cmd_scrollPageDown", 		cmd_scrollPageDown, 		[]],
    ["cmd_scrollLineUp", 		cmd_scrollLineUp, 		[]],
    ["cmd_scrollLineDown", 		cmd_scrollLineDown, 		[]],
    ["cmd_scrollLeft", 			cmd_scrollLeft, 		[]],
    ["cmd_scrollRight", 		cmd_scrollRight, 		[]],
    ["cmd_scrollBeginLine", 		cmd_scrollBeginLine, 		[]],
    ["cmd_scrollEndLine", 		cmd_scrollEndLine, 		[]],
    ["cmd_scrollTop", 			cmd_scrollTop, 			[]],
    ["cmd_scrollBottom", 		cmd_scrollBottom, 		[]],
    ["cmd_undo", 			cmd_undo, 			[]],
    ["cmd_objectProperties",		cmd_objectProperties,		[]],
    ["cmd_paste", 			cmd_paste, 			[]],
    ["cmd_movePageUp", 			cmd_movePageUp, 		[]],
    ["cmd_movePageDown", 		cmd_movePageDown, 		[]],
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
    ["copy-link-location", 		copy_link_location, 		[]],
    ["delete-frame", 			delete_frame, 			[]],
    ["describe-bindings",               describe_bindings,		[]],
    ["end-of-line",     		end_of_line,    		[]],
    ["execute-extended-command",        meta_x, 			[]],
    ["find-url", 			find_url, 			[]],
    ["unfocus", 			unfocus, 			[]],
    ["go-back", 			goBack, 			[]],
    ["go-forward", 			goForward, 			[]],
    ["isearch-backward", 		isearch_backward, 		[]],
    ["isearch-forward", 		isearch_forward, 		[]],
    ["keyboard-quit", 			stopLoading, 			[]],
    ["kill-buffer", 			kill_browser, 			[]],
    ["make-frame-command", 		makeFrame,      		[]],
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
    ["revert-buffer", 			reload, 			[]],
    ["switch-to-buffer-other-window",	switch_browser_other_window, 	[]],
    ["stop-loading", 			stopLoading, 			[]],
    ["find-url-other-frame", 	        new_frame, 			[]],
    ["switch-to-buffer", 		switch_to_buffer,		[]],
    ["view-source", 			view_source, 			[]],
    ["split-flip",                      split_flip,                     []],
    ["delete-other-windows",            delete_other_windows,           []],
    ["delete-window",                   delete_window,                  []],
    ["other-window",                    other_window,                   []],
    ["split-window", 			split_window, 			[]],
    ["set-mark-command",                set_mark_command,		[]],
    ["exchange-point-and-mark",         exchange_point_and_mark,	[]],
    ["web-jump", 			web_jump, 			[]],
    ["save-link", 			save_link, 			[]],
    ["source",                          source_file, 			[]],
    ["help-page",                       help_page, 			[]],
    ["yank-to-clipboard",		yankToClipboard,        	[]]];

function exec_command(cmd)
{
    for (var i=0; i<gCommands.length; i++) {
	if (gCommands[i][0] == cmd) {
	    return gCommands[i][1]();
	}
    }
    message("No such command '" + cmd + "'");
}

function add_command(name, fn, args)
{
    gCommands.push([name,fn,args]);
}

function unfocus()
{
    var input = document.getElementById("input-field");
    var w = document.commandDispatcher.focusedWindow;
    // Hey, waddya know. It's another sick hack.
    if (w) {
	input.focus();
	w.focus();
    }
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
    var templs =[];
    for (var x in gWebJumpLocations)
	templs.push([x,x]);

    miniBufferComplete("Find URL in other frame:", "url", templs, true, function(match, url) { window.openDialog("chrome://conkeror/content", "_blank", "chrome,all,dialog=no", get_url_or_webjump(url)); });
}

function makeFrame()
{
    window.openDialog("chrome://conkeror/content", "_blank", "chrome,all,dialog=no", "about:blank");
}


function delete_frame()
{
    window.close();
}

function open_url()
{
    var templs =[];
    for (var x in gWebJumpLocations)
	templs.push([x,x]);

    miniBufferComplete("Find Alternate URL:", "url", templs, true, function(match,url) { getWebNavigation().loadURI(get_url_or_webjump(url), nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null); });
}

// Open a new browser with url
function find_url()
{
    var templs =[];
    for (var x in gWebJumpLocations)
	templs.push([x,x]);

    miniBufferComplete("Find URL: ", "url", templs, true, function(match,url) { getBrowser().newBrowser(get_url_or_webjump(url)); });
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
    miniBufferComplete("Switch to buffer: (default " + defBrowser + ") ", "buffer", matches, false,
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
    miniBufferComplete("Goto bookmark:", "bookmark", get_bm_strings(), false,
		       function(url) { getWebNavigation().loadURI(url, nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null); });
}

function bookmark_current_url()
{
    readFromMiniBuffer("Add bookmark:", getBrowser().mCurrentBrowser.contentTitle, "add-bookmark",
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
    getBrowser().nextBrowser();
}

function browser_prev()
{
    getBrowser().prevBrowser();
}

function meta_x()
{
    miniBufferComplete("M-x", "commands", gCommands, false, function(fn) {fn();});
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
    miniBufferComplete("Switch to buffer in other window: (default " + defBrowser + ") ", "buffer", matches, false, function(b) {getBrowser().split(get_buffer_from_name(b));getBrowser().focusOther();});
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

function cmd_scrollPageUp() {goDoCommand("cmd_scrollPageUp"); }
function cmd_scrollPageDown() {goDoCommand("cmd_scrollPageDown"); }
function cmd_scrollLineUp() {goDoCommand("cmd_scrollLineUp"); }
function cmd_scrollLineDown() {goDoCommand("cmd_scrollLineDown"); }
function cmd_scrollLeft() {goDoCommand("cmd_scrollLeft"); }
function cmd_scrollRight() {goDoCommand("cmd_scrollRight"); }
function cmd_scrollBeginLine() {goDoCommand("cmd_scrollBeginLine"); }
function cmd_scrollEndLine() {goDoCommand("cmd_scrollEndLine"); }
function cmd_scrollTop() { set_mark_command(); goDoCommand("cmd_scrollTop"); }
function cmd_scrollBottom() { set_mark_command(); goDoCommand("cmd_scrollBottom"); }
function cmd_undo() {goDoCommand("cmd_undo"); }
function cmd_paste() {goDoCommand("cmd_paste"); }
function cmd_movePageUp() {goDoCommand("cmd_movePageUp"); }
function cmd_movePageDown() {goDoCommand("cmd_movePageDown"); }
function cmd_objectProperties() {goDoCommand("cmd_properties"); }

//// web jump stuff

var gWebJumpLocations = [];
function add_webjump(key, loc)
{
    gWebJumpLocations[key] = loc;
}

// Some built in web jumps
add_webjump("google", "http://www.google.com/search?q=%s");
add_webjump("wikipedia", "http://en.wikipedia.org/wiki/Special:Search?search=%s");
add_webjump("slang", "http://www.urbandictionary.com/define.php?term=%s");
add_webjump("dictionary", "http://dictionary.reference.com/search?q=%s");

function webjump_build_url(template, subs)
{
    var b = template.indexOf('%s');
    var a = b + 2;
    return template.substr(0,b) + subs + template.substring(a);
}

function get_partial_match(hash, part)
{
    var matches = [];
    for (x in hash) {
	if (part == x.substr(0, part.length))
	    matches.push(x);
    }
    if (matches.length == 1)
	return matches[0];
    else
	return null;
}

function getWebJump(value)
{
    try {
    var start = value.indexOf(' ');
    var jump = gWebJumpLocations[value.substr(0,start)];
    // Try to find a web jump match
    if (!jump) {
	var match = get_partial_match(gWebJumpLocations, value.substr(0,start));
	if (match)
	    jump = gWebJumpLocations[match];
	else
	    return null;
    }
    return webjump_build_url(jump, value.substring(start + 1));
    } catch(e) {alert(e);}
}

function doWebJump(match, value)
{
    var url = getWebJump(value);
    getWebNavigation().loadURI(url, nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null);
}

function web_jump()
{
    var templs =[];
    for (var x in gWebJumpLocations)
	templs.push([x,x]);
    miniBufferComplete("Web Jump:", "webjump", templs, true, doWebJump);
}

function get_url_or_webjump(input)
{
    if (input.indexOf(' ') != -1) {
	var url = getWebJump(input);
	// return url || getWebJump("google " + input);
	return url;
    } else {
	return input;
    }
}

function describe_bindings()
{
    getWebNavigation().loadURI("about:blank", 
			       nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null);
    // Oh man. this is SO gross.
    setTimeout(genAllBindings, 0);
}

/// Hacky mark stuff
/// IDEA: Maybe this should be done with a selection?

function set_mark_command()
{
    var w = document.commandDispatcher.focusedWindow;
    if (!w)
	return;
    w.__conkeror__markX = w.scrollX;
    w.__conkeror__markY = w.scrollY;
    message("Mark set");
}

function exchange_point_and_mark()
{
    try {
    var w = document.commandDispatcher.focusedWindow;
    if (!w)
	return;
    var x = w.__conkeror__markX || 0;
    var y = w.__conkeror__markY || 0;
    set_mark_command();
    w.scrollTo(x, y);
    } catch(e) {alert(e);}
}

// This is cheap.
function get_link_location()
{
    var e = document.commandDispatcher.focusedElement;   
    if (e && e.getAttribute("href")) {
	var loc = e.getAttribute("href");
	return loc;
    }
}

function copy_link_location()
{
    var loc = get_link_location();
    writeToClipboard(loc);
    message("Copied '" + loc + "'");
}

function save_link()
{
    var loc = get_link_location();
    saveURL(loc, null, "SaveLinkTitle", true);
}

function source_file()
{
    readFromMiniBuffer("Source File:", null, "source", load_rc_file);
}

function load_rc_file(file)
{
    var fd = fopen(file, "<");
    var s = fd.read();
    fd.close();

    try {
    eval(s);
    } catch(e) {alert(e);}
}

function help_page()
{
    getWebNavigation().loadURI("chrome://conkeror/content/help.html", 
			       nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null);
}
