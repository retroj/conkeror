// -*- mode: java -*-

// Functions that are called by commands in conkeror.xul and that
// aren't part of a module go here.

var gCommands = [];

function init_commands()
{
    try {
    add_command("eval-expression", eval_expression, [["p"]]);
    add_command("link-menu", link_menu, [["p"]]);
    add_command("beginning-of-line", beginning_of_line, []);
    add_command("bookmark-bmenu-list", bookmark_bmenu_list, []);
    add_command("bookmark-current-url", bookmark_current_url, []);
    add_command("bookmark-jump", goto_bookmark, [["P"]]);
    add_command("buffer-next", browser_next, []);
    add_command("buffer-previous", browser_prev, []);
    add_command("cmd_beginLine", cmd_beginLine, []);
    add_command("cmd_charNext", cmd_charNext, [["p"]]);
    add_command("cmd_charPrevious", cmd_charPrevious, [["p"]]);
    add_command("cmd_copy", cmd_copy, []);
    add_command("cmd_copyOrDelete", cmd_copyOrDelete, []);
    add_command("cmd_cut", cmd_cut, []);
    add_command("cmd_cutOrDelete", cmd_cutOrDelete, []);
    add_command("cmd_deleteCharBackward", cmd_deleteCharBackward, [["p"]]);
    add_command("cmd_deleteCharForward", cmd_deleteCharForward, [["p"]]);
    add_command("cmd_deleteToBeginningOfLine", cmd_deleteToBeginningOfLine, []);
    add_command("cmd_deleteToEndOfLine", cmd_deleteToEndOfLine, []);
    add_command("cmd_deleteWordBackward", cmd_deleteWordBackward, [["p"]]);
    add_command("cmd_endLine", cmd_endLine, []);
    add_command("cmd_lineNext", cmd_lineNext, [["p"]]);
    add_command("cmd_linePrevious", cmd_linePrevious, [["p"]]);
    add_command("cmd_moveBottom", cmd_moveBottom, []);
    add_command("cmd_movePageDown", cmd_movePageDown, [["p"]]);
    add_command("cmd_movePageUp", cmd_movePageUp, [["p"]]);
    add_command("cmd_moveTop", cmd_moveTop, []);
    add_command("cmd_paste", cmd_paste, [["p"]]);
    add_command("cmd_redo", cmd_redo, [["p"]]);
    add_command("cmd_scrollPageUp", cmd_scrollPageUp, [["p"]]);
    add_command("cmd_scrollPageDown", cmd_scrollPageDown, [["p"]]);
    add_command("cmd_scrollLineUp", cmd_scrollLineUp, [["p"]]);
    add_command("cmd_scrollLineDown", cmd_scrollLineDown, [["p"]]);
    add_command("cmd_scrollLeft", cmd_scrollLeft, [["p"]]);
    add_command("cmd_scrollRight", cmd_scrollRight, [["p"]]);
    add_command("cmd_scrollBeginLine", cmd_scrollBeginLine, []);
    add_command("cmd_scrollEndLine", cmd_scrollEndLine, []);
    add_command("cmd_scrollTop", cmd_scrollTop, []);
    add_command("cmd_scrollBottom", cmd_scrollBottom, []);
    add_command("cmd_undo", cmd_undo, [["p"]]);
    add_command("cmd_selectAll", cmd_selectAll, []);
    add_command("cmd_selectBeginLine", cmd_selectBeginLine, [["p"]]);
    add_command("cmd_selectBottom", cmd_selectBottom, []);
    add_command("cmd_selectCharNext", cmd_selectCharNext, [["p"]]);
    add_command("cmd_selectCharPrevious", cmd_selectCharPrevious, [["p"]]);
    add_command("cmd_selectEndLine", cmd_selectEndLine, [["p"]]);
    add_command("cmd_selectLineNext", cmd_selectLineNext, [["p"]]);
    add_command("cmd_selectLinePrevious", cmd_selectLinePrevious, [["p"]]);
    add_command("cmd_selectPageDown", cmd_selectPageDown, [["p"]]);
    add_command("cmd_selectPageUp", cmd_selectPageUp, [["p"]]);
    add_command("cmd_selectTop", cmd_selectTop, []);
    add_command("cmd_selectWordNext", cmd_selectWordNext, [["p"]]);
    add_command("cmd_selectWordPrevious", cmd_selectWordPrevious, [["p"]]);
    add_command("cmd_wordNext", cmd_wordNext, [["p"]]);
    add_command("cmd_wordPrevious", cmd_wordPrevious, [["p"]]);
    add_command("copy-current-url", copyCurrentUrl, []);
    add_command("copy-link-location", copy_link_location, []);
    add_command("delete-frame", delete_frame, []);
    add_command("describe-bindings", describe_bindings, []);
    add_command("end-of-line", end_of_line, []);
    add_command("execute-extended-command", meta_x, [["P"]]);
    add_command("find-url", find_url, []);
    add_command("unfocus", unfocus, []);
    add_command("go-back", goBack, [["p"]]);
    add_command("go-forward", goForward, [["p"]]);
    add_command("isearch-backward", isearch_backward, []);
    add_command("isearch-forward", isearch_forward, []);
    add_command("keyboard-quit", stopLoading, []);
    add_command("kill-buffer", kill_browser, []);
    add_command("make-frame-command", makeFrame, []);
    add_command("next-frame", nextFrame, []);
    add_command("numberedlinks-1", selectNumberedLink_1, [["p"]]);
    add_command("numberedlinks-2", selectNumberedLink_2, [["p"]]);
    add_command("numberedlinks-3", selectNumberedLink_3, [["p"]]);
    add_command("numberedlinks-4", selectNumberedLink_4, [["p"]]);
    add_command("numberedlinks-5", selectNumberedLink_5, [["p"]]);
    add_command("numberedlinks-6", selectNumberedLink_6, [["p"]]);
    add_command("numberedlinks-7", selectNumberedLink_7, [["p"]]);
    add_command("numberedlinks-8", selectNumberedLink_8, [["p"]]);
    add_command("numberedlinks-9", selectNumberedLink_9, [["p"]]);
    add_command("goto-numberedlink", goto_numberedlink, [["p"]]);
    add_command("numberedlinks-toggle", toggleNumberedLinks, []);
    add_command("open-url", open_url, [["p"]]);
    add_command("find-alternate-url", find_alt_url, [["p"]]);
    add_command("quit", quit, []);
    add_command("revert-buffer", reload, []);
    add_command("switch-to-buffer-other-window", switch_browser_other_window, []);
    add_command("stop-loading", stopLoading, []);
    add_command("find-url-other-frame", new_frame, []);
    add_command("switch-to-buffer", switch_to_buffer, []);
    add_command("view-source", view_source, []);
    add_command("split-flip", split_flip, []);
    add_command("delete-other-windows", delete_other_windows, []);
    add_command("delete-window", delete_window, []);
    add_command("other-window", other_window, []);
    add_command("split-window", split_window, []);
    add_command("set-mark-command", set_mark_command, []);
    add_command("exchange-point-and-mark", exchange_point_and_mark, []);
    add_command("web-jump", web_jump, [["p"]]);
    add_command("source", source_file, []);
    add_command("help-page", help_page, []);
    add_command("help-with-tutorial", tutorial_page, []);
    add_command("redraw", redraw, []);
    add_command("save-link", save_link, []);
    add_command("yank-to-clipboard", yankToClipboard, []);
    add_command("go-up", go_up, [["p"]]);
    add_command("list-buffers", list_buffers, []);
    add_command("text-reset", text_reset, []);
    add_command("text-enlarge", text_enlarge, [["p"]]);
    add_command("text-reduce", text_reduce, [["p"]]);
    } catch(e) {alert(e);}
}


function interactive(args)
{
    // The prefix arg is reset here
    var prefix = gPrefixArg;
    gPrefixArg = null;

    var output = [];
    for (var i=0; i<args.length; i++) {
	if (args[i][0] == "a") {
	    // -- Function name: symbol with a function definition.
	} else if (args[i][0] == "b") {
	    // -- Name of existing buffer.
	} else if (args[i][0] == "B") {
	    // -- Name of buffer, possibly nonexistent.
	} else if (args[i][0] == "c") {
	    // -- Character (no input method is used).
	} else if (args[i][0] == "C") {
	    // -- Command name: symbol with interactive function definition.
	} else if (args[i][0] == "d") {
	    // -- Value of point as number.  Does not do I/O.
	} else if (args[i][0] == "D") {
	    // -- Directory name.
	} else if (args[i][0] == "e") {
	    // -- Parametrized event (i.e., one that's a list) that
	    // -- invoked this command.  If used more than once, the
	    // -- Nth `e' returns the Nth parameterized event.  This
	    // -- skips events that are integers or symbols.
	} else if (args[i][0] == "f") {
	    // -- Existing file name.
	} else if (args[i][0] == "F") {
	    // -- Possibly nonexistent file name.
	} else if (args[i][0] == "i") {
	    // -- Ignored, i.e. always nil.  Does not do I/O.
	    output.push(null);
	} else if (args[i][0] == "k") {
	    // -- Key sequence (downcase the last event if needed to get a definition).
	} else if (args[i][0] == "K") {
	    // -- Key sequence to be redefined (do not downcase the last event).
	} else if (args[i][0] == "m") {
	    // -- Value of mark as number.  Does not do I/O.
	} else if (args[i][0] == "M") {
	    // -- Any string.  Inherits the current input method.
	} else if (args[i][0] == "n") {
	    // -- Number read using minibuffer.
	} else if (args[i][0] == "N") {
	    // -- Raw prefix arg, or if none, do like code `n'.
	} else if (args[i][0] == "p") {
	    // -- Prefix arg converted to number.  Does not do I/O.
	    output.push(univ_arg_to_number(prefix));
	} else if (args[i][0] == "P") {
	    // -- Prefix arg in raw form.  Does not do I/O.
	    output.push(prefix);
	} else if (args[i][0] == "r") {
	    // -- Region: point and mark as 2 numeric args, smallest first.  Does no I/O.
	} else if (args[i][0] == "s") {
	    // -- Any string.  Does not inherit the current input method.
	} else if (args[i][0] == "S") {
	    // -- Any symbol.
	} else if (args[i][0] == "v") {
	    // -- Variable name: symbol that is user-variable-p.
	} else if (args[i][0] == "x") {
	    // -- Lisp expression read but not evaluated.
	} else if (args[i][0] == "X") {
	    // -- Lisp expression read and evaluated.
	} else if (args[i][0] == "z") {
	    // -- Coding system.
	} else if (args[i][0] == "Z") {
	    // -- Coding system, nil if no prefix arg.
	} else {
	    alert("Failed");
	}
    }

    return output;
}

function exec_command(cmd)
{
    try {
    for (var i=0; i<gCommands.length; i++) {
	if (gCommands[i][0] == cmd) {
	    var args = interactive(gCommands[i][2]);
	    return gCommands[i][1](args);
	}
    }
    message("No such command '" + cmd + "'");

    } catch(e) {alert(e);}
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

function goBack(args)
{
    if (getWebNavigation().canGoBack) {
	var hist = getWebNavigation().sessionHistory;
	var idx = hist.index - args[0];
	if (idx < 0) idx = 0;
	getWebNavigation().gotoIndex(idx);
    }
}

function goForward(args)
{
    if (getWebNavigation().canGoForward) {
	var hist = getWebNavigation().sessionHistory;
	var idx = hist.index + args[0];
	if (idx >= hist.count) idx = hist.count-1;
	getWebNavigation().gotoIndex(idx);
    }
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
    open_url([16]);
}

function makeFrame()
{
    window.openDialog("chrome://conkeror/content", "_blank", "chrome,all,dialog=no", "about:blank");
}


function delete_frame()
{
    window.close();
}


function open_url_in_prompt(prefix, str)
{
    if (str == null)
	str = "Find URL";
    if (prefix == 1) {
	return str + ":";
    } else if (prefix <= 4) {
	return str + " in new buffer:";
    } else {
	return str + " in new frame:";
    }
}

function open_url_in(prefix, url)
{
    if (prefix == 1) {
	// Open in current buffer
	getWebNavigation().loadURI(url, nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null);
    } else if (prefix <= 4) {
	// Open in new buffer
	getBrowser().newBrowser(url);
    } else {
	// Open in new frame
	window.openDialog("chrome://conkeror/content", "_blank", "chrome,all,dialog=no", url);
    }
}

function find_alt_url(args)
{
    open_url(args, true);
}

function open_url(args, fillInput)
{
    var prefix = args[0];
    var templs =[];
    for (var x in gWebJumpLocations)
	templs.push([x,x]);
    var input = fillInput ? getWebNavigation().currentURI.spec : null;

    miniBufferComplete(open_url_in_prompt(prefix), input, "url", templs, true, 
		       function(match,url) {open_url_in(prefix, get_url_or_webjump(url));});
}

// Open a new browser with url
function find_url()
{
    open_url([4]);
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

function go_to_buffer(match)
{
    getBrowser().setCurrentBrowser(match);
}

function switch_to_buffer()
{
    var bufs = getBrowser().getBrowserNames();
    var defBrowser = getBrowser().lastBrowser().webNavigation.currentURI.spec;
    var matches = zip2(bufs,getBrowser().mBrowsers);
    miniBufferComplete("Switch to buffer: (default " + defBrowser + ") ", null, "buffer", matches, false, go_to_buffer, null, defBrowser);

}

function kill_browser()
{
    var defBrowser = getBrowser().webNavigation.currentURI.spec;
    var bufs = getBrowser().getBrowserNames();
    var matches = zip2(bufs,getBrowser().mBrowsers);
    miniBufferComplete("Kill buffer: (default " + defBrowser + ") ", null, "buffer", matches, true,
		       function(m,b) {if (b=="") {getBrowser().killCurrentBrowser();} else {getBrowser().killBrowser(m);}});

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

function goto_bookmark(args)
{
    var prefix = args[0];
    miniBufferComplete(open_url_in_prompt(prefix,"Go to bookmark"), null, "bookmark", 
		       get_bm_strings(), false, function(url) { open_url_in(prefix,url); });
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

function meta_x(args)
{
    // setup the prefix arg which will be reset in exec_command
    gPrefixArg = args[0];
    var prompt = "";
    if (gPrefixArg == null)
	prompt = "";
    else if (typeof gPrefixArg == "object")
	prompt = gPrefixArg[0] == 4 ? "C-u " : gPrefixArg[0] + " ";
    else
	prompt = gPrefixArg + " ";

    var matches = [];
    for (i in gCommands)
	matches.push([gCommands[i][0],gCommands[i][0]]);

    miniBufferComplete(prompt + "M-x", null, "commands", matches, false, 
		       function(c) {exec_command(c)}, abort);
}

function inject_css()
{
    var doc = _content.content.document;
    doc.createLinkNode;
}

//// Split windows

function switch_browser_other_window()
{
    var bufs = getBrowser().getBrowserNames();
    var defBrowser = getBrowser().lastBrowser().webNavigation.currentURI.spec;
    var matches = zip2(bufs,getBrowser().mBrowsers);
    miniBufferComplete("Switch to buffer in other window: (default " + defBrowser + ") ", null, "buffer", matches, true, function(m,b) 
              {
		  if (getBrowser().isSplit()) {
		      var last = getBrowser().lastBrowser();
		      getBrowser().focusOther();
		      if (b == "")
			  getBrowser().setCurrentBrowser(last);
		      else
			  getBrowser().setCurrentBrowser(m);
		  } else {
		      if (b=="")
			  getBrowser().split(getBrowser().lastBrowser());
		      else
			  getBrowser().split(b);
		      getBrowser().focusOther();
		  }
	      });
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
function doCommandNTimes(n,cmd)
{
    for(i=0;i<n;i++)
	goDoCommand(cmd);
}

function cmd_beginLine() { goDoCommand("cmd_beginLine"); }
function cmd_charNext(args) { doCommandNTimes(args[0],"cmd_charNext"); }
function cmd_charPrevious(args) { doCommandNTimes(args[0],"cmd_charPrevious"); }
function cmd_copy() { goDoCommand("cmd_copy"); }
function cmd_copyOrDelete() { goDoCommand("cmd_copyOrDelete"); }
function cmd_cut() { goDoCommand("cmd_cut"); }
function cmd_cutOrDelete() { goDoCommand("cmd_cutOrDelete"); }
function cmd_deleteCharBackward(args) { doCommandNTimes(args[0],"cmd_deleteCharBackward"); }
function cmd_deleteCharForward(args) { doCommandNTimes(args[0],"cmd_deleteCharForward"); }
function cmd_deleteToBeginningOfLine() { goDoCommand("cmd_deleteToBeginningOfLine"); }
function cmd_deleteToEndOfLine() { goDoCommand("cmd_deleteToEndOfLine"); }
function cmd_deleteWordBackward(args) { doCommandNTimes(args[0],"cmd_deleteWordBackward"); }
function cmd_endLine() { goDoCommand("cmd_endLine"); }
function cmd_lineNext(args) { doCommandNTimes(args[0],"cmd_lineNext"); }
function cmd_linePrevious(args) { doCommandNTimes(args[0],"cmd_linePrevious"); }
function cmd_moveBottom() { goDoCommand("cmd_moveBottom"); }
function cmd_movePageDown(args) { doCommandNTimes(args[0],"cmd_movePageDown"); }
function cmd_movePageUp(args) { doCommandNTimes(args[0],"cmd_movePageUp"); }
function cmd_moveTop() { goDoCommand("cmd_moveTop"); }
function cmd_paste() { goDoCommand("cmd_paste"); }
function cmd_redo(args) { doCommandNTimes(args[0],"cmd_redo"); }
function cmd_selectAll() { goDoCommand("cmd_selectAll"); }
function cmd_selectBeginLine() { goDoCommand("cmd_selectBeginLine"); }
function cmd_selectBottom() { goDoCommand("cmd_selectBottom"); }
function cmd_selectCharNext(args) { doCommandNTimes(args[0],"cmd_selectCharNext"); }
function cmd_selectCharPrevious(args) { doCommandNTimes(args[0],"cmd_selectCharPrevious"); }
function cmd_selectEndLine() { goDoCommand("cmd_selectEndLine"); }
function cmd_selectLineNext(args) { doCommandNTimes(args[0],"cmd_selectLineNext"); }
function cmd_selectLinePrevious(args) { doCommandNTimes(args[0],"cmd_selectLinePrevious"); }
function cmd_selectPageDown(args) { doCommandNTimes(args[0],"cmd_selectPageDown"); }
function cmd_selectPageUp(args) { doCommandNTimes(args[0],"cmd_selectPageUp"); }
function cmd_selectTop() { goDoCommand("cmd_selectTop"); }
function cmd_selectWordNext(args) { doCommandNTimes(args[0],"cmd_selectWordNext"); }
function cmd_selectWordPrevious(args) { doCommandNTimes(args[0],"cmd_selectWordPrevious"); }
function cmd_undo(args) { doCommandNTimes(args[0],"cmd_undo"); }
function cmd_wordNext(args) { doCommandNTimes(args[0],"cmd_wordNext"); }
function cmd_wordPrevious(args) { doCommandNTimes(args[0],"cmd_wordPrevious"); }

function cmd_scrollPageUp(args) {doCommandNTimes(args[0],"cmd_scrollPageUp"); }
function cmd_scrollPageDown(args) {doCommandNTimes(args[0],"cmd_scrollPageDown"); }
function cmd_scrollLineUp(args) {doCommandNTimes(args[0],"cmd_scrollLineUp"); }
function cmd_scrollLineDown(args) {doCommandNTimes(args[0],"cmd_scrollLineDown"); }
function cmd_scrollLeft(args) {doCommandNTimes(args[0],"cmd_scrollLeft"); }
function cmd_scrollRight(args) {doCommandNTimes(args[0],"cmd_scrollRight"); }
function cmd_scrollBeginLine() {goDoCommand("cmd_scrollBeginLine"); }
function cmd_scrollEndLine() {goDoCommand("cmd_scrollEndLine"); }
function cmd_scrollTop() { set_mark_command(); goDoCommand("cmd_scrollTop"); }
function cmd_scrollBottom() { set_mark_command(); goDoCommand("cmd_scrollBottom"); }
function cmd_paste(args) {doCommandNTimes(args[0],"cmd_paste"); }

//// web jump stuff

var gWebJumpLocations = [];
function add_webjump(key, loc)
{
    gWebJumpLocations[key] = loc;
}

var delicious_username = "";

// Some built in web jumps
function init_webjumps()
{
    add_webjump("google",     "http://www.google.com/search?q=%s");
    add_webjump("wikipedia",  "http://en.wikipedia.org/wiki/Special:Search?search=%s");
    add_webjump("slang",      "http://www.urbandictionary.com/define.php?term=%s");
    add_webjump("dictionary", "http://dictionary.reference.com/search?q=%s");
    add_webjump("xulplanet",  "http://xulplanet.com/cgi-bin/search/search.cgi?terms=%s");
    add_webjump("image",      "http://images.google.com/images?q=%s");
    add_webjump("bugzilla",   "https://bugzilla.mozilla.org/show_bug.cgi?id=%s");
    add_webjump("clhs",       "http://www.xach.com/clhs?q=%s");
    add_webjump("emacswiki",  "http://www.emacswiki.org/cgi-bin/wiki?search=%s");
    add_webjump("cliki",      "http://www.cliki.net/admin/search?words=%s");
    add_webjump("ratpoisonwiki", "http://ratpoison.elektrubadur.se/?search=%s");
    add_webjump("stumpwmwiki", "http://stumpwm.elektrubadur.se/?search=%s");
    add_webjump("savannah", "http://savannah.gnu.org/search/?words=%s&type_of_search=soft&Search=Search&exact=1");
    add_webjump("sourceforge", "http://sourceforge.net/search/?words=%s");
    add_webjump("freshmeat", "http://freshmeat.net/search/?q=%s");
    add_webjump("slashdot", "http://slashdot.org/search.pl?query=%s");
    add_webjump("kuro5hin", "http://www.kuro5hin.org/?op=search&string=%s");
    add_webjump("delicious", " http://del.icio.us/" + delicious_username);
    add_webjump("adelicious", "javascript:location.href='http://del.icio.us/" + delicious_username + "?v=2&url='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title);");
    add_webjump("sdelicious", " http://del.icio.us/search/?search=%s");
    add_webjump("sadelicious", " http://del.icio.us/search/all?search=%s");
    add_webjump("sheldonbrown",     "http://www.google.com/search?q=site:sheldonbrown.com %s");
}

function webjump_build_url(template, subs)
{
    var b = template.indexOf('%s');
    var a = b + 2;
    // Just return the same string if it doesn't contain a %s
    if (b == -1)
	return template;
    else
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

function doWebJump(prefix, match, value)
{
    var url = getWebJump(value);
    open_url_in(prefix,url);
}

function web_jump(args)
{
    prefix = args[0];
    var templs =[];
    for (var x in gWebJumpLocations)
	templs.push([x,x]);
    miniBufferComplete(open_url_in_prompt(prefix, "Web Jump"), null, "webjump", templs, 
		       true, function(m,v) {doWebJump(prefix,m,v);});
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
	return makeURLAbsolute(e.baseURI, loc);
    }
}

function get_link_text()
{
    var e = document.commandDispatcher.focusedElement;   
    if (e && e.getAttribute("href")) {
	return e.getAttribute("href");
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
    try {
    var loc = get_link_location();
    // A cheapish hack. chop off the path so only the file remains.
    var fname = loc.replace(/^.*\//, "");

    readFromMiniBuffer("Save File As:", fname, "save",
		       function (dest) {
	                 download_uri(loc, dest);
                       });
    } catch(e) {alert(e);}
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

function tutorial_page()
{
    getWebNavigation().loadURI("chrome://conkeror/content/tutorial.html", 
			       nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null);
}


function redraw()
{
    message("FIXME: unimplemented");
}

// universal argument code

var gPrefixArg = null;

var universal_kmap = [];

function init_universal_arg()
{
    add_command("universal-argument", universal_argument,[]);
    add_command("universal-argument-more", universal_argument_more,[["P"]]);
    add_command("universal-digit", universal_digit,[["P"]]);
    add_command("universal-argument-other-key", universal_argument_other_key,[["P"]]);

    define_key(top_kmap, make_key("u", MOD_CTRL), "universal-argument");

    define_key(universal_kmap, make_key("u", MOD_CTRL), "universal-argument-more");
    define_key(universal_kmap, make_key("1", 0), "universal-digit");
    define_key(universal_kmap, make_key("2", 0), "universal-digit");
    define_key(universal_kmap, make_key("3", 0), "universal-digit");
    define_key(universal_kmap, make_key("4", 0), "universal-digit");
    define_key(universal_kmap, make_key("5", 0), "universal-digit");
    define_key(universal_kmap, make_key("6", 0), "universal-digit");
    define_key(universal_kmap, make_key("7", 0), "universal-digit");
    define_key(universal_kmap, make_key("8", 0), "universal-digit");
    define_key(universal_kmap, make_key("9", 0), "universal-digit");
    define_key(universal_kmap, make_key("0", 0), "universal-digit");
    // This must be at the end so it's matched last.
    define_key(universal_kmap, make_match_any_key(), "universal-argument-other-key");
}

function universal_digit(args)
{
    var prefix = args[0];
    var ch = gCommandLastEvent.charCode;
    var digit = ch - 48;
    // Array means they typed only C-u's. Otherwise, add another digit
    // to our accumulating prefix arg.
    if (typeof prefix == "object") {
	gPrefixArg = digit;
    } else {
	gPrefixArg = prefix * 10 + digit;
    }
}

function universal_argument()
{
    gPrefixArg = [4];
    overlay_kmap = universal_kmap;
}

function universal_argument_more(args)
{
    var prefix = args[0];
    if (typeof prefix == "object")
	gPrefixArg = [prefix[0] * 4];
    else {
	// terminate the prefix arg
	gPrefixArg = prefix;
	overlay_kmap = null;
    }
}

function universal_argument_other_key(args)
{
    // Set up the prefix arg
    var prefix = args[0];
    gPrefixArg = prefix;
    // clear our overlay map...
    overlay_kmap = null;
    // ...and process the key again.
    setTimeout(readKeyPress, 0, gCommandLastEvent);
}

function univ_arg_to_number(prefix)
{
    try {
    if (prefix == null)
	return 1;
    if (typeof prefix == "object") 
	return prefix[0];
    else if (typeof prefix == "number")
	return prefix;

    } catch(e) {alert("univ: " + e);}
}

function go_up(args)
{
    var loc = getWebNavigation().currentURI.spec;
    var up = loc.replace(/(.*\/)[^\/]+\/?$/, "$1");
    open_url_in(args[0], up);
}

function list_all_buffers()
{
    var doc = _content.content.document;
    var browsers = getBrowser().mBrowsers;
    for (var i=0;i<browsers.length; i++) {
	doc.write(browsers[i].webNavigation.currentURI.spec + "<HR>");
    }
}

function list_buffers()
{
    getWebNavigation().loadURI("about:blank", 
			       nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null);
    // There should be a better way, but I don't know what it is.
    setTimeout(list_all_buffers,0);
}

function link_menu(args)
{
    var prefix = args[0];
    // Find the frame that's focused
    var w = document.commandDispatcher.focusedWindow;
    var strs = [];

    var links = _content.content.document.getElementsByTagName('a');
    for (var i=0;i<links.length; i++) {
	if (!links[i].hasAttribute("href")) continue;
	var name;
	// This reall should be cleaner
	if (getBrowser().numberedLinks) {
	    name = links[i].firstChild.nextSibling.nodeValue;
	} else {
	    name = links[i].firstChild.nodeValue;
	}
	// Don't add links with no name
	if (name && name.length)
	    strs.push([name, links[i].getAttribute("href")]);
    }

    miniBufferComplete(open_url_in_prompt(prefix,"Menu"), null, "link-menu", strs, 
		       false, function(v) {open_url_in(prefix,v);});
}

function text_reset() 
{
    try {
 	getBrowser().markupDocumentViewer.textZoom = 1.0;
    } catch(e) { alert(e); }
}

function text_reduce(args) 
{
    try {
 	getBrowser().markupDocumentViewer.textZoom -= 0.25 * args[0];
    } catch(e) { alert(e); }
}

function text_enlarge(args) 
{
    try {
 	getBrowser().markupDocumentViewer.textZoom += 0.25 * args[0];
    } catch(e) { alert(e); }
}

function eval_expression()
{
    readFromMiniBuffer("Eval:", null, "eval-expression", eval);
}
