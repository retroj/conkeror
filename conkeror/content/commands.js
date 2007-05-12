/***** BEGIN LICENSE BLOCK *****
Version: MPL 1.1/GPL 2.0/LGPL 2.1

The contents of this file are subject to the Mozilla Public License Version
1.1 (the "License"); you may not use this file except in compliance with
the License. You may obtain a copy of the License at
http://www.mozilla.org/MPL/

Software distributed under the License is distributed on an "AS IS" basis,
WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
for the specific language governing rights and limitations under the
License.

The Initial Developer of the Original Code is Shawn Betts.
Portions created by the Initial Developer are Copyright (C) 2004,2005
by the Initial Developer. All Rights Reserved.

Alternatively, the contents of this file may be used under the terms of
either the GNU General Public License Version 2 or later (the "GPL"), or
the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
in which case the provisions of the GPL or the LGPL are applicable instead
of those above. If you wish to allow use of your version of this file only
under the terms of either the GPL or the LGPL, and not to allow others to
use your version of this file under the terms of the MPL, indicate your
decision by deleting the provisions above and replace them with the notice
and other provisions required by the GPL or the LGPL. If you do not delete
the provisions above, a recipient may use your version of this file under
the terms of any one of the MPL, the GPL or the LGPL.
***** END LICENSE BLOCK *****/

// Functions that are called by commands in conkeror.xul and that
// aren't part of a module go here.

var gCommands = [];
var gCurrentCommand = null;

var interactive_methods = {
a: { func: function (spec) {
            // -- Function name: symbol with a function definition.
            return null;
        }
},

active_document: { func: function (spec) {
            // -- The document currently being browsed.
            return window.content.document;
        }
},

// b: Name of existing buffer.
b: { async: function (spec, iargs, callback, callback_args, given_args) {
            var bufs = getBrowser().getBrowserNames();
            var matches = zip2(bufs,getBrowser().mBrowsers);
            var prompt = (1 in spec && spec[1] ? spec[1] : "Buffer: ");
            var initval = (2 in spec && spec[2] ? spec[2](callback_args) : getBrowser().webNavigation.currentURI.spec);
            readFromMiniBuffer(prompt, initval, "buffer", matches, null, null,
                               function (s) {
                                   callback_args.push (s);
                                   do_interactive (iargs, callback, callback_args, given_args);
                               });
        },
     doc: "Name of existing buffer, defaulting to the current one.\n"+
     "Its optional arguments are:\n"+
     "PROMPT      A string prompt for the minibuffer read.  The default is 'Buffer: '.\n"+
     "INITVAL     A function to get the initial value.  The default is the current URL."
},

// XXX: does it make sense to have an interactive method for non-existent buffers?
B: { func: function (spec) {
            // -- Name of buffer, possibly nonexistent.
            return null;
        }
},

c: { func: function (spec) {
            // -- Character (no input method is used).
            return null;
        }
},

C: { func: function (spec) {
            // -- Command name: symbol with interactive function definition.
            return null;
        }
},

current_command: { func: function (spec) {
            // -- Name of the command being evaluated right now.
            return gCurrentCommand;
        }
},

d: { func: function (spec) {
            // -- Value of point as number.  Does not do I/O.
            return null;
        }
},

D: { func: function (spec) {
            // -- Directory name.
            return null;
        }
},

// e: Event that invoked this command.
e: { func: function (spec) { return gCommandLastEvent; } },

f: { async: function (spec, iargs, callback, callback_args, given_args) {
            // -- Exisiting file object. (nsILocalFile)
            var prompt = (1 in spec && spec[1] ? spec[1] : "File: ");
            var initval = (2 in spec && spec[2] ? spec[2](callback_args) : default_directory.path);
            var hist = (3 in spec ? spec[3] : null);
            readFromMiniBuffer(prompt, initval, hist, null, null, null,
                               function (s) {
                                   var f = Components.classes["@mozilla.org/file/local;1"]
                                       .createInstance(Components.interfaces.nsILocalFile);
                                   f.initWithPath (s);
                                   callback_args.push (f);
                                   do_interactive (iargs, callback, callback_args, given_args);
                               },
                               null);
        }
},

F: { async: function (spec, iargs, callback, callback_args, given_args) {
            // -- Possibly nonexistent file object. (nsILocalFile)
            var prompt = (1 in spec && spec[1] ? spec[1] : "File: ");
            var initval = (2 in spec && spec[2] ? spec[2](callback_args) : default_directory.path);
            var hist = (3 in spec ? spec[3] : null);
            readFromMiniBuffer(prompt, initval, hist, null, null, null,
                               function (s) {
                                   var f = Components.classes["@mozilla.org/file/local;1"]
                                       .createInstance(Components.interfaces.nsILocalFile);
                                   f.initWithPath (s);
                                   callback_args.push (f);
                                   do_interactive (iargs, callback, callback_args, given_args);
                               },
                               null);
        }
},

focused_link_url_o: { func: function (spec) {
            // -- Focused link element
            ///JJF: check for errors or wrong element type.
            return makeURL (get_link_location (document.commandDispatcher.focusedElement));
        }
},


focused_link_url_s: { func: function (spec) {
            // -- Focused link element
            ///JJF: check for errors or wrong element type.
            return get_link_location (document.commandDispatcher.focusedElement);
        }
},


// i: Ignored, i.e. always nil.  Does not do I/O.
i: { func: function (spec) { return null; } },

// image: numbered image.
image: { async: function (spec, iargs, callback, callback_args, given_args) {
            // -- Number read using minibuffer.
            var prompt = (1 in spec ? spec[1] : "Image Number: ");
            var buf_state = getBrowser().numberedImages;
            if (!buf_state) {
                // turn on image numbers
                gTurnOffLinksAfter = true;
                toggleNumberedImages();
            }
            // Setup a context for the context-keymap system.
            readFromMiniBuffer(prompt, null, null, null, null, null,
                               function (s) {
                                   callback_args.push (s);
                                   if (gTurnOffLinksAfter) {
                                       toggleNumberedImages();
                                       gTurnOffLinksAfter = false;
                                   }
                                   do_interactive (iargs, callback, callback_args, given_args);
                               },
                               function () {
                                   if (gTurnOffLinksAfter) {
                                       toggleNumberedImages ();
                                       gTurnOffLinksAfter = false;
                                   }
                               });
        }
},


image_url_o: { async: function (spec, iargs, callback, callback_args, given_args) {

            var prompt = (1 in spec ? spec[1] : "Image Number: ");
            var buf_state = getBrowser().numberedImages;
            if (!buf_state) {
                // turn on image numbers
                gTurnOffLinksAfter = true;
                toggleNumberedImages();
            }
            // Setup a context for the context-keymap system.
            readFromMiniBuffer(prompt, null, null, null, null, null,
                               function (s) {
                                   function fail (number)
                                   {
                                       message ("'"+number+"' is not the number of any image here. ");
                                   }
                                   var nl = get_numberedlink (s);
                                   if (! nl) { fail (s); return; }
                                   var type = nl.nlnode.getAttribute("__conktype");
                                   var loc;
                                   if (type == "image" && nl.node.getAttribute("src")) {
                                       loc = nl.node.getAttribute("src");
                                       loc = makeURLAbsolute(nl.node.baseURI, loc);
                                   } else {
                                       fail (number);
                                   }
                                   callback_args.push (makeURL (loc));

                                   if (gTurnOffLinksAfter) {
                                       toggleNumberedImages();
                                       gTurnOffLinksAfter = false;
                                   }
                                   do_interactive (iargs, callback, callback_args, given_args);
                               },
                               function () {
                                   if (gTurnOffLinksAfter) {
                                       toggleNumberedImages ();
                                       gTurnOffLinksAfter = false;
                                   }
                               });
        }
},


k: { func: function (spec) {
            // -- Key sequence (downcase the last event if needed to get a definition).
            return null;
        }
},

K: { func: function (spec) {
            // -- Key sequence to be redefined (do not downcase the last event).
            return null;
        }
},

// link: numbered link
link: { async: function (spec, iargs, callback, callback_args, given_args) {
            var prompt = (1 in spec && spec[1] ? spec[1] : "Link Number: ");
            var initVal = (2 in spec && spec[2] ? spec[2](callback_args) : "");
            var buf_state = getBrowser().numberedLinks;
            if (!buf_state) {
                gTurnOffLinksAfter = true;
                toggleNumberedLinks();
            }
            // Setup a context for the context-keymap system.
            numberedlinks_minibuffer_active = true;

            readFromMiniBuffer(prompt, initVal, null, null, null, null,
                               function (s) {
                                   callback_args.push (s);
                                   if (gTurnOffLinksAfter) {
                                       toggleNumberedLinks();
                                       gTurnOffLinksAfter = false;
                                   }
                                   // unset keymap context
                                   numberedlinks_minibuffer_active = false;
                                   do_interactive (iargs, callback, callback_args, given_args);
                               },
                               function () {
                                   if (gTurnOffLinksAfter) {
                                       toggleNumberedLinks ();
                                       gTurnOffLinksAfter = false;
                                   }
                                   // unset keymap context
                                   numberedlinks_minibuffer_active = false;
                               });
        }
},

m: { func: function (spec) {
            // -- Value of mark as number.  Does not do I/O.
            return null;
        }
},

M: { func: function (spec) {
            // -- Any string.  Inherits the current input method.
            return null;
        }
},


minibuffer_exit: { func: function (spec) {
            // -- minibuffer.exit
            return minibuffer.exit;
        }
},

// n: Number read using minibuffer.
n: { async: function (spec, iargs, callback, callback_args, given_args) {
            var prompt = "Number: ";
            if (1 in spec)
                prompt = spec[1];
            readFromMiniBuffer(prompt, null, null, null, null, null,
                               function (s) {
                                   callback_args.push (s);
                                   do_interactive (iargs, callback, callback_args, given_args);
                               },
                               null);
        }
},

N: { func: function (spec) {
            // -- Raw prefix arg, or if none, do like code `n'.
            return null;
        }
},

// p: Prefix arg converted to number.  Does not do I/O.
p: { func: function (spec) {
            var prefix = gPrefixArg;
            gPrefixArg = null;
            return univ_arg_to_number(prefix);
        }
},

// P: Prefix arg in raw form.  Does not do I/O.
P: { func: function (spec) {
            var prefix = gPrefixArg;
            gPrefixArg = null;
            return prefix;
        }
},

pref: { func: function (spec) {
            var pref = spec[1];
            var type = gPrefService.getPrefType (pref);
            switch (type) {
                case gPrefService.PREF_BOOL:
                    return gPrefService.getBoolPref (pref);
                case gPrefService.PREF_INT:
                    return gPrefService.getIntPref (pref);
                case gPrefService.PREF_STRING:
                    return gPrefService.getCharPref (pref);
                default:
                    return null;
            }
        }
},

r: { func: function (spec) {
            // -- Region: point and mark as 2 numeric args, smallest first.  Does no I/O.
            return null;
        }
},

s: { func: function (spec) {
            // -- Any string.  Does not inherit the current input method.
            return null;
        }
},

S: { func: function (spec) {
            // -- Any symbol.
            return null;
        }
},

v: { func: function (spec) {
            // -- Variable name: symbol that is user-variable-p.
            return null;
        }
},

x: { func: function (spec) {
            // -- Lisp expression read but not evaluated.
            return null;
        }
},

X: { func: function (spec) {
            // -- Lisp expression read and evaluated.
            return null;
        }
},

z: { func: function (spec) {
            // -- Coding system.
            return null;
        }
},

Z: { func: function (spec) {
            // -- Coding system, nil if no prefix arg.
            return null;
        }
}};


function do_interactive (iargs, callback, callback_args, given_args)
{
    if (! callback_args) callback_args = Array ();

    var iarg, method;
    while (iargs.length > 0)
    {
        // process as many synchronous args as possible
        iarg = iargs.shift ();
        if (given_args && 0 in given_args) {
            var got = given_args.shift ();
            if (got) {
                callback_args.push (got);
                continue;
            }
        }
        if (typeof (iarg) == "string") {
            method = iarg;
            iarg = Array (iarg);
        } else {
            method = iarg[0];
        }

        if (! method in interactive_methods) {
            // prefix should get reset on failed interactive call.
            gPrefixArg = null;
            alert("Failed: invalid interactive specifier: '"+iarg+"'");
            return;
        }

        if ('func' in interactive_methods[method])
        {
            // 'func' denotes that this method can be done synchronously.
            callback_args.push (interactive_methods[method].func (iarg));
            // do_interactive (iargs, callback, callback_args);
        } else {
            // an asynchronous call needs to be made.  break the loop and let
            // the async handler below take over.
            break;
        }
        method = null;
    }

    if (method) {
        if (! 'async' in interactive_methods[method]) {
            // fail.  improperly defined interactive method.
            // prefix should get reset on failed interactive call.
            gPrefixArg = null;
            alert("Failed: improperly defined interactive specifer: '"+iarg+"'");
        }

        // go on a little trip..
        //
        // asynchronous methods get called with their interactive spec and
        // all the information they need to continue the interactive
        // process when their data has been gathered.
        //
        interactive_methods[method].async (iarg, iargs, callback, callback_args, given_args);
    } else {
        callback (callback_args);
    }
}


function call_interactively (cmd, given_args)
{
    try {
        gCurrentCommand = cmd;
        for (var i=0; i<gCommands.length; i++) {
            if (gCommands[i][0] == cmd)
            {
                // Copy the interactive args spec, because do_interactive is
                // destructive to its first argument.
                var iargs = gCommands[i][2].slice (0);
                var given = given_args ? given_args.slice (0) : null;
                do_interactive (iargs,
                                function (args) {
                                    gCommands[i][1].apply (this, args);
                                    updateModeline ();
                                },
                                null,
                                given);
                return;
            }
        }
        message("No such command '" + cmd + "'");
    } catch(e) {alert(e);}
}


function interactive(name, fn, args)
{
    for (var i=0; i <gCommands.length; i++) {
	if (gCommands[i][0] == name) {
	    gCommands[i] = [name,fn,args];
	    return;
	}
    }
    gCommands.push([name,fn,args]);
}
// backward compatibility
var add_command_warned = false;
function add_command (name, fn, args)
{
    if (! add_command_warned)
    {
        add_command_warned = true;
        alert ("`add_command' has been deprecated.\nPlease use `interactive' instead.");
    }
    interactive (name, fn, args);
}


function show_conkeror_version ()
{
    message (conkeror_version);
}
interactive ("conkeror-version", show_conkeror_version, []);


function unfocus()
{
//     var w = document.commandDispatcher.focusedWindow;
//     // Hey, waddya know. It's another sick hack.
//     if (w) {
// 	minibuffer.input.focus();
// 	w.focus();
//     }
    if (document.commandDispatcher.focusedElement)
	document.commandDispatcher.focusedElement.blur();
    else if (document.commandDispatcher.focusedWindow)
	{
	    
	}
    else
	window.content.focus();
}
interactive("unfocus", unfocus, []);


function quit()
{
    // Using app-startup to quit? Not very intuitive.
    var appStartup = Components.classes["@mozilla.org/toolkit/app-startup;1"]
	.getService(Components.interfaces.nsIAppStartup);
    appStartup.quit(appStartup.eAttemptQuit);
}
interactive("quit", quit, []);


function goBack(prefix)
{
    if (getWebNavigation().canGoBack) {
	var hist = getWebNavigation().sessionHistory;
	var idx = hist.index - prefix;
	if (idx < 0) idx = 0;
	getWebNavigation().gotoIndex(idx);
    }
}
interactive("go-back", goBack, ["p"]);


function goForward(prefix)
{
    if (getWebNavigation().canGoForward) {
	var hist = getWebNavigation().sessionHistory;
	var idx = hist.index + prefix;
	if (idx >= hist.count) idx = hist.count-1;
	getWebNavigation().gotoIndex(idx);
    }
}
interactive("go-forward", goForward, ["p"]);


function stopLoading()
{
    getWebNavigation().stop(nsIWebNavigation.STOP_NETWORK);
}
interactive("stop-loading", stopLoading, []);
interactive("keyboard-quit", stopLoading, []);


function reload ()
{
    return getBrowser().webNavigation.reload(nsIWebNavigation.LOAD_FLAGS_NONE);
}
interactive("revert-buffer", reload, []);


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
interactive("next-frame", nextFrame, []);

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
interactive("beginning-of-line", beginning_of_line, []);


function end_of_line()
{
    scrollHorizComplete(1);
}
interactive("end-of-line", end_of_line, []);


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
interactive("view-source", view_source, []);


function new_frame()
{
    open_url(16);
}
interactive("find-url-other-frame", new_frame, []);


function makeFrame()
{
    window.openDialog("chrome://conkeror/content", "_blank", "chrome,all,dialog=no", "about:blank");
}
interactive("make-frame-command", makeFrame, []);


function delete_frame()
{
    window.close();
}
interactive("delete-frame", delete_frame, []);


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
	return getBrowser();
    } else if (prefix <= 4) {
	// Open in new buffer
	return getBrowser().newBrowser(url);
    } else {
	// Open in new frame
	return window.openDialog("chrome://conkeror/content", "_blank", "chrome,all,dialog=no", url);
    }
}

function find_alt_url(prefix)
{
    open_url(prefix, true);
}
interactive("find-alternate-url", find_alt_url, ["p"]);


function open_url(prefix, fillInput)
{
    var templs =[];
    for (var x in gWebJumpLocations)
	templs.push([x,x]);
    var input = fillInput ? getWebNavigation().currentURI.spec : null;

    readFromMiniBuffer(open_url_in_prompt(prefix), input, "url", templs, true, null,
		       function(match,url) {open_url_in(prefix, get_url_or_webjump(url));});
}
interactive("open-url", open_url, ["p"]);


// Open a new browser with url
function find_url()
{
    open_url(4);
}
interactive("find-url", find_url, []);


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


function switch_to_buffer (buffer)
{
    go_to_buffer (buffer);
}
interactive("switch-to-buffer", switch_to_buffer,
            [["b", "Switch to buffer: ",
              function (a) { return getBrowser().lastBrowser().webNavigation.currentURI.spec; } ]]);


function kill_buffer (buffer)
{
    getBrowser().killBrowser(buffer);
}
interactive("kill-buffer", kill_buffer, [["b", "Kill buffer: "]]);


function copyCurrentUrl()
{
    writeToClipboard(getWebNavigation().currentURI.spec);
    message("Copied current URL");
}
interactive("copy-current-url", copyCurrentUrl, []);


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
interactive("yank-to-clipboard", yankToClipboard, []);


function goto_bookmark(prefix)
{
    readFromMiniBuffer(open_url_in_prompt(prefix,"Go to bookmark"), null, "bookmark", 
		       get_bm_strings(), false, null, function(url) { open_url_in(prefix,url); });
}
interactive("bookmark-jump", goto_bookmark, ["p"]);


function bookmark_current_url()
{
    readFromMiniBuffer("Add bookmark:", getBrowser().mCurrentBrowser.contentTitle, "add-bookmark",
                       null, null, null,
		       function (title) 
                         {
			     bookmark_doc(getBrowser(), title);
			     message ("Bookmarked " + getWebNavigation().currentURI.spec
				      + " - " + title);
			 });
}
interactive("bookmark-current-url", bookmark_current_url, []);


// FIXME: This code pops up a dialog box which sorta sucks. But it
// works.
function bookmark_doc(browser, aTitle)
{
    var url = browser.webNavigation.currentURI.spec;
    var title, docCharset = "text/unicode";
    title = aTitle || getBrowser().mCurrentBrowser.contentTitle || url;
    BookmarksUtils.addBookmark(url, title, docCharset);
}

function isearch_forward()
{
    if (isearch_active) {
        if (gFindState.length == 1) {
            minibuffer.input.value = gLastSearch;
            find(gLastSearch, true, lastFindState()["point"]);
        } else {
            find(lastFindState()["search-str"], true, lastFindState()["range"]);
        }
        resumeFindState(lastFindState());
    } else {
        focusFindBar();
        readFromMiniBuffer('I-Search:');
    }
}
interactive("isearch-forward", isearch_forward, []);


function isearch_backward()
{
    if (isearch_active) {
        if (gFindState.length == 1) {
            minibuffer.input.value = gLastSearch;
            find(gLastSearch, false, lastFindState()["point"]);
        } else {
            find(lastFindState()["search-str"], false, lastFindState()["range"]);
        }
        resumeFindState(lastFindState());
    } else {
        focusFindBarBW();
        readFromMiniBuffer('I-Search backward:');
    }
}
interactive("isearch-backward", isearch_backward, []);


function isearch_backspace ()
{
    if (gFindState.length > 1) {
        var state = gFindState.pop();
        resumeFindState(lastFindState());
    }
}
interactive("isearch-backspace", isearch_backspace, []);


function isearch_abort ()
{
    closeFindBar();
    gWin.scrollTo(gFindState[0]["screenx"], gFindState[0]["screeny"]);
    clearSelection();
    clearHighlight();
}
interactive("isearch-abort", isearch_abort, []);


function isearch_add_character (event)
{
    var str;
    str = lastFindState()["search-str"];
    str += String.fromCharCode(event.charCode);
    find(str, lastFindState()["direction"], lastFindState()["point"]);
    resumeFindState(lastFindState());
}
interactive("isearch-add-character", isearch_add_character, ["e"]);


function isearch_done ()
{
    closeFindBar();
    gLastSearch = lastFindState()["search-str"];
    clearHighlight();
    focusLink();
}
interactive("isearch-done", isearch_done, []);


function browser_next()
{
    getBrowser().nextBrowser();
}
interactive("buffer-next", browser_next, []);


function browser_prev()
{
    getBrowser().prevBrowser();
}
interactive("buffer-previous", browser_prev, []);


function meta_x(prefix)
{
    // setup the prefix arg which will be reset in call_interactively
    gPrefixArg = prefix;
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

    readFromMiniBuffer(prompt + "M-x", null, "commands", matches, false, null,
		       function(c) {call_interactively(c)}, abort);
}
interactive("execute-extended-command", meta_x, ["P"]);


function inject_css()
{
    var doc = _content.content.document;
    doc.createLinkNode;
}

/*
//// Split windows

// function switch_browser_other_window()
// {
//     var bufs = getBrowser().getBrowserNames();
//     var defBrowser = getBrowser().lastBrowser().webNavigation.currentURI.spec;
//     var matches = zip2(bufs,getBrowser().mBrowsers);
//     miniBufferComplete("Switch to buffer in other window: (default " + defBrowser + ") ", null, "buffer", matches, true, function(m,b) 
//               {
// 		  if (getBrowser().isSplit()) {
// 		      var last = getBrowser().lastBrowser();
// 		      getBrowser().focusOther();
// 		      if (b == "")
// 			  getBrowser().setCurrentBrowser(last);
// 		      else
// 			  getBrowser().setCurrentBrowser(m);
// 		  } else {
// 		      if (b=="")
// 			  getBrowser().split(getBrowser().lastBrowser());
// 		      else
// 			  getBrowser().split(b);
// 		      getBrowser().focusOther();
// 		  }
// 	      });
// }

// function split_window()
// {
//     try {
//     var c = getBrowser().mBrowserContainer;
//     var b = getBrowser().mCurrentBrowser;
//     var ob;
//     if (c.length <= 1) {
// 	return;
//     }
//     if (b == c.lastChild.firstChild)
// 	ob = c.firstChild.firstChild;
//     else
// 	ob = b.parentNode.nextSibling.firstChild;
//     getBrowser().split(ob);
//     } catch(e) {alert(e);}
// }


// function split_flip()
// {
//     getBrowser().flip();
// }

// function delete_other_windows()
// {
//     getBrowser().removeSplit();
// }

// function delete_window()
// {
//     getBrowser().focusOther();
//     getBrowser().removeSplit();
// }

// function other_window()
// {
//     getBrowser().focusOther();
// }
*/

function bookmark_bmenu_list(prefix)
{
    open_url_in (prefix, "chrome://conkeror/content/bookmarks.html");
}
interactive("bookmark-bmenu-list", bookmark_bmenu_list, ["p"]);


/// built in commands
function doCommandNTimes(n,cmd)
{
    for(i=0;i<n;i++)
	goDoCommand(cmd);
}

function cmd_beginLine() { goDoCommand("cmd_beginLine"); }
interactive("cmd_beginLine", cmd_beginLine, []);

function cmd_charNext(prefix) { doCommandNTimes(prefix,"cmd_charNext"); }
interactive("cmd_charNext", cmd_charNext, ["p"]);

function cmd_charPrevious(prefix) { doCommandNTimes(prefix,"cmd_charPrevious"); }
interactive("cmd_charPrevious", cmd_charPrevious, ["p"]);

function cmd_copy() { goDoCommand("cmd_copy"); }
interactive("cmd_copy", cmd_copy, []);

function cmd_copyOrDelete() { goDoCommand("cmd_copyOrDelete"); }
interactive("cmd_copyOrDelete", cmd_copyOrDelete, []);

function cmd_cut() { goDoCommand("cmd_cut"); }
interactive("cmd_cut", cmd_cut, []);

function cmd_cutOrDelete() { goDoCommand("cmd_cutOrDelete"); }
interactive("cmd_cutOrDelete", cmd_cutOrDelete, []);

function cmd_deleteCharBackward(prefix) { doCommandNTimes(prefix,"cmd_deleteCharBackward"); }
interactive("cmd_deleteCharBackward", cmd_deleteCharBackward, ["p"]);

function cmd_deleteCharForward(prefix) { doCommandNTimes(prefix,"cmd_deleteCharForward"); }
interactive("cmd_deleteCharForward", cmd_deleteCharForward, ["p"]);

function cmd_deleteToBeginningOfLine() { goDoCommand("cmd_deleteToBeginningOfLine"); }
interactive("cmd_deleteToBeginningOfLine", cmd_deleteToBeginningOfLine, []);

function cmd_deleteToEndOfLine() { goDoCommand("cmd_deleteToEndOfLine"); }
interactive("cmd_deleteToEndOfLine", cmd_deleteToEndOfLine, []);

function cmd_deleteWordBackward(prefix) { doCommandNTimes(prefix,"cmd_deleteWordBackward"); }
interactive("cmd_deleteWordBackward", cmd_deleteWordBackward, ["p"]);

function cmd_deleteWordForward(prefix) { doCommandNTimes(prefix,"cmd_deleteWordForward"); }
interactive("cmd_deleteWordForward", cmd_deleteWordForward, ["p"]);

function cmd_endLine() { goDoCommand("cmd_endLine"); }
interactive("cmd_endLine", cmd_endLine, []);

function cmd_lineNext(prefix) { doCommandNTimes(prefix,"cmd_lineNext"); }
interactive("cmd_lineNext", cmd_lineNext, ["p"]);

function cmd_linePrevious(prefix) { doCommandNTimes(prefix,"cmd_linePrevious"); }
interactive("cmd_linePrevious", cmd_linePrevious, ["p"]);

function cmd_moveBottom() { goDoCommand("cmd_moveBottom"); }
interactive("cmd_moveBottom", cmd_moveBottom, []);

function cmd_movePageDown(prefix) { doCommandNTimes(prefix,"cmd_movePageDown"); }
interactive("cmd_movePageDown", cmd_movePageDown, ["p"]);

function cmd_movePageUp(prefix) { doCommandNTimes(prefix,"cmd_movePageUp"); }
interactive("cmd_movePageUp", cmd_movePageUp, ["p"]);

function cmd_moveTop() { goDoCommand("cmd_moveTop"); }
interactive("cmd_moveTop", cmd_moveTop, []);

function cmd_redo(prefix) { doCommandNTimes(prefix,"cmd_redo"); }
interactive("cmd_redo", cmd_redo, ["p"]);

function cmd_selectAll() { goDoCommand("cmd_selectAll"); }
interactive("cmd_selectAll", cmd_selectAll, []);

function cmd_selectBeginLine() { goDoCommand("cmd_selectBeginLine"); }
interactive("cmd_selectBeginLine", cmd_selectBeginLine, ["p"]);

function cmd_selectBottom() { goDoCommand("cmd_selectBottom"); }
interactive("cmd_selectBottom", cmd_selectBottom, []);

function cmd_selectCharNext(prefix) { doCommandNTimes(prefix,"cmd_selectCharNext"); }
interactive("cmd_selectCharNext", cmd_selectCharNext, ["p"]);

function cmd_selectCharPrevious(prefix) { doCommandNTimes(prefix,"cmd_selectCharPrevious"); }
interactive("cmd_selectCharPrevious", cmd_selectCharPrevious, ["p"]);

function cmd_selectEndLine() { goDoCommand("cmd_selectEndLine"); }
interactive("cmd_selectEndLine", cmd_selectEndLine, ["p"]);

function cmd_selectLineNext(prefix) { doCommandNTimes(prefix,"cmd_selectLineNext"); }
interactive("cmd_selectLineNext", cmd_selectLineNext, ["p"]);

function cmd_selectLinePrevious(prefix) { doCommandNTimes(prefix,"cmd_selectLinePrevious"); }
interactive("cmd_selectLinePrevious", cmd_selectLinePrevious, ["p"]);

function cmd_selectPageDown(prefix) { doCommandNTimes(prefix,"cmd_selectPageDown"); }
interactive("cmd_selectPageDown", cmd_selectPageDown, ["p"]);

function cmd_selectPageUp(prefix) { doCommandNTimes(prefix,"cmd_selectPageUp"); }
interactive("cmd_selectPageUp", cmd_selectPageUp, ["p"]);

function cmd_selectTop() { goDoCommand("cmd_selectTop"); }
interactive("cmd_selectTop", cmd_selectTop, []);

function cmd_selectWordNext(prefix) { doCommandNTimes(prefix,"cmd_selectWordNext"); }
interactive("cmd_selectWordNext", cmd_selectWordNext, ["p"]);

function cmd_selectWordPrevious(prefix) { doCommandNTimes(prefix,"cmd_selectWordPrevious"); }
interactive("cmd_selectWordPrevious", cmd_selectWordPrevious, ["p"]);

function cmd_undo(prefix) { doCommandNTimes(prefix,"cmd_undo"); }
interactive("cmd_undo", cmd_undo, ["p"]);

function cmd_wordNext(prefix) { doCommandNTimes(prefix,"cmd_wordNext"); }
interactive("cmd_wordNext", cmd_wordNext, ["p"]);

function cmd_wordPrevious(prefix) { doCommandNTimes(prefix,"cmd_wordPrevious"); }
interactive("cmd_wordPrevious", cmd_wordPrevious, ["p"]);

function cmd_scrollPageUp(prefix) {doCommandNTimes(prefix,"cmd_scrollPageUp"); }
interactive("cmd_scrollPageUp", cmd_scrollPageUp, ["p"]);

function cmd_scrollPageDown(prefix) {doCommandNTimes(prefix,"cmd_scrollPageDown"); }
interactive("cmd_scrollPageDown", cmd_scrollPageDown, ["p"]);

function cmd_scrollLineUp(prefix) {doCommandNTimes(prefix,"cmd_scrollLineUp"); }
interactive("cmd_scrollLineUp", cmd_scrollLineUp, ["p"]);

function cmd_scrollLineDown(prefix) {doCommandNTimes(prefix,"cmd_scrollLineDown"); }
interactive("cmd_scrollLineDown", cmd_scrollLineDown, ["p"]);

function cmd_scrollLeft(prefix) {doCommandNTimes(prefix,"cmd_scrollLeft"); }
interactive("cmd_scrollLeft", cmd_scrollLeft, ["p"]);

function cmd_scrollRight(prefix) {doCommandNTimes(prefix,"cmd_scrollRight"); }
interactive("cmd_scrollRight", cmd_scrollRight, ["p"]);

function cmd_scrollBeginLine() {goDoCommand("cmd_scrollBeginLine"); }
interactive("cmd_scrollBeginLine", cmd_scrollBeginLine, []);

function cmd_scrollEndLine() {goDoCommand("cmd_scrollEndLine"); }
interactive("cmd_scrollEndLine", cmd_scrollEndLine, []);

function cmd_scrollTop() { set_mark_command(); goDoCommand("cmd_scrollTop"); }
interactive("cmd_scrollTop", cmd_scrollTop, []);

function cmd_scrollBottom() { set_mark_command(); goDoCommand("cmd_scrollBottom"); }
interactive("cmd_scrollBottom", cmd_scrollBottom, []);

function cmd_paste(prefix) {doCommandNTimes(prefix,"cmd_paste"); }
interactive("cmd_paste", cmd_paste, ["p"]);


//// web jump stuff

var gWebJumpLocations = [];
function add_webjump(key, loc)
{
    gWebJumpLocations[key] = loc;
}

function add_delicious_webjumps (username)
{
    add_webjump("delicious", " http://del.icio.us/" + username);
    add_webjump("adelicious", "javascript:location.href='http://del.icio.us/" + username + "?v=2&url='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title);");
    add_webjump("sdelicious", " http://del.icio.us/search/?search=%s");
    add_webjump("sadelicious", " http://del.icio.us/search/all?search=%s");
}

// Some built in web jumps
function init_webjumps()
{
    add_webjump("google",     "http://www.google.com/search?q=%s");
    add_webjump("lucky",      "http://www.google.com/search?q=%s&btnI=I'm Feeling Lucky");
    add_webjump("maps",       "http://maps.google.com/?q=%s");
    add_webjump("scholar",    "http://scholar.google.com/scholar?q=%s");
    add_webjump("clusty",     "http://www.clusty.com/search?query=%s");
    add_webjump("wikipedia",  "http://en.wikipedia.org/wiki/Special:Search?search=%s");
    add_webjump("slang",      "http://www.urbandictionary.com/define.php?term=%s");
    add_webjump("dictionary", "http://dictionary.reference.com/search?q=%s");
    add_webjump("xulplanet",  "http://www.google.com/custom?q=%s&cof=S%3A"+
                "http%3A%2F%2Fwww.xulplanet.com%3BAH%3Aleft%3BLH%3A65%3BLC"+
                "%3A4682B4%3BL%3Ahttp%3A%2F%2Fwww.xulplanet.com%2Fimages%2F"+
                "xulplanet.png%3BALC%3Ablue%3BLW%3A215%3BAWFID%3A0979f384d5"+
                "181409%3B&domains=xulplanet.com&sitesearch=xulplanet.com&sa=Go");
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
    var jump;
    if (start == -1)
	jump = gWebJumpLocations[value];
    else
	jump = gWebJumpLocations[value.substr(0,start)];
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

function web_jump(prefix)
{
    var templs =[];
    for (var x in gWebJumpLocations)
	templs.push([x,x]);
    readFromMiniBuffer(open_url_in_prompt(prefix, "Web Jump"), null, "webjump", templs, 
		       true, null, function(m,v) {doWebJump(prefix,m,v);});
}
interactive("web-jump", web_jump, ["p"]);


function get_url_or_webjump(input)
{
    var url = getWebJump(input);

    if (url) {
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
interactive("describe-bindings", describe_bindings, []);


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
interactive("set-mark-command", set_mark_command, []);


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
interactive("exchange-point-and-mark", exchange_point_and_mark, []);


function get_link_location (element)
{
    if (element && element.getAttribute("href")) {
	var loc = element.getAttribute("href");
	return makeURLAbsolute(element.baseURI, loc);
    }
}

function get_link_text()
{
    var e = document.commandDispatcher.focusedElement;   
    if (e && e.getAttribute("href")) {
	return e.getAttribute("href");
    }
}


function copy_link_location (loc)
{
    writeToClipboard(loc);
    message("Copied '" + loc + "'");
}
interactive("copy-link-location", copy_link_location, ['focused_link_url_s']);


function save_focused_link (url_o, dest_file_o)
{
    download_uri_internal (url_o,
                           null,        // document_o
                           dest_file_o,
                           null,        // dest_data_dir_o
                           null,        // referrer_o
                           null,        // content_type_s
                           true,        // should_bypass_cache_p
                           false,       // save_as_text_p
                           false);      // save_as_complete_p
}
interactive ("save-focused-link", save_focused_link,
             ['focused_link_url_o',
              ['F', "Save Link As: ",
               function (args) {
                   return make_default_file_name_to_save_url (args[0]).path;
               },
               "save"]]);


function save_image (url_o, dest_file_o)
{
    download_uri_internal (url_o,
                           null,        // document_o
                           dest_file_o,
                           null,        // dest_data_dir_o
                           null,        // referrer_o
                           null,        // content_type_s
                           true,        // should_bypass_cache_p
                           false,       // save_as_text_p
                           false);      // save_as_complete_p
}
interactive ("save-image", save_image,
             ['image_url_o',
              ['F', "Save Image As: ",
               function (args) {
                   return make_default_file_name_to_save_url (args[0]).path;
               },
               "save"]]);


function save_page (document_o, dest_file_o)
{
    var url_o = makeURL (document_o.documentURI);
    var content_type_s = document_o.contentType;
    var should_bypass_cache_p = true;//not sure...
    download_uri_internal (url_o,
                           document_o,
                           dest_file_o,
                           null,   // dest_data_dir_o
                           null,   // referrer_o
                           content_type_s,
                           should_bypass_cache_p,
                           false,  // save_as_text_p
                           false); // save_as_complete_p
}
interactive("save-page", save_page,
            ['active_document',
             ['F', "Save Page As: ",
              function (args) {
                  var document_o = args[0];
                  var url_o = makeURL (document_o.documentURI);
                  var content_type_s = document_o.contentType;
                  var content_disposition = get_document_content_disposition (document_o);
                  return make_default_file_name_to_save_url (
                      url_o,
                      document_o,
                      content_type_s,
                      content_disposition).path;
              },
              "save"]]);


function save_page_as_text (document_o, dest_file_o)
{
    var url_o = makeURL (document_o.documentURI);
    var content_type_s = document_o.contentType;
    var should_bypass_cache_p = true;//not sure...
    download_uri_internal (url_o,
                           document_o,
                           dest_file_o,
                           null,   // dest_data_dir_o
                           null,   // referrer_o
                           content_type_s,
                           should_bypass_cache_p,
                           true,  // save_as_text_p
                           false); // save_as_complete_p
}
interactive("save-page-as-text", save_page_as_text,
            ['active_document',
             ['F', "Save Page As: ",
              function (args) {
                  var document_o = args[0];
                  var url_o = makeURL (document_o.documentURI);
                  var content_type_s = document_o.contentType;
                  var content_disposition = get_document_content_disposition (document_o);
                  return make_default_file_name_to_save_url (
                      url_o,
                      document_o,
                      content_type_s,
                      content_disposition,
                      'txt').path;
              },
              "save"]]);


function save_page_complete (document_o, dest_file_o, dest_data_dir_o)
{
    var url_o = makeURL (document_o.documentURI);
    var content_type_s = document_o.contentType;
    var should_bypass_cache_p = true;//not sure...
    download_uri_internal (url_o,
                           document_o,
                           dest_file_o,
                           dest_data_dir_o,
                           null,   // referrer_o
                           content_type_s,
                           should_bypass_cache_p,
                           false,  // save_as_text_p
                           true); // save_as_complete_p
}
interactive("save-page-complete", save_page_complete,
            ['active_document',
             ['F', "Save Page As: ",
              function (args) {
                  var document_o = args[0];
                  var url_o = makeURL (document_o.documentURI);
                  var content_type_s = document_o.contentType;
                  var content_disposition = get_document_content_disposition (document_o);
                  return make_default_file_name_to_save_url (
                      url_o,
                      document_o,
                      content_type_s,
                      content_disposition).path;
              },
              "save"],
             ['F', "Data Directory: ",
              function (args) { return args[1].path + ".support"; },
              "save"]]);


interactive("source", function (fo) { load_rc (fo.path); }, [['f',"Source File: ",null,"source"]]);

interactive ("reinit",
             function (fn) {
                 try {
                     load_rc (fn);
                     message ("loaded \""+fn+"\"");
                 } catch (e) {
                     message ("failed to load \""+fn+"\"");
                 }
             },
             [['pref', 'conkeror.rcfile']]);

function help_page()
{
    getWebNavigation().loadURI("chrome://conkeror/content/help.html", 
			       nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null);
}
interactive("help-page", help_page, []);


function tutorial_page()
{
    getWebNavigation().loadURI("chrome://conkeror/content/tutorial.html", 
			       nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null);
}
interactive("help-with-tutorial", tutorial_page, []);


function redraw()
{
    message("FIXME: unimplemented");
}
interactive("redraw", redraw, []);


// universal argument code

var gPrefixArg = null;

function universal_digit(prefix)
{
    //XXX RetroJ: we should use an interactive code like "e" instead of
    //            gCommandLastEvent
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
interactive("universal-digit", universal_digit,["P"]);


function universal_argument()
{
    gPrefixArg = [4];
    overlay_kmap = universal_kmap;
}
interactive("universal-argument", universal_argument,[]);


function universal_argument_more(prefix)
{
    if (typeof prefix == "object")
	gPrefixArg = [prefix[0] * 4];
    else {
	// terminate the prefix arg
        ///XXX: is this reachable?
	gPrefixArg = prefix;
	overlay_kmap = null;
    }
}
interactive("universal-argument-more", universal_argument_more,["P"]);


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

function go_up(prefix)
{
    var loc = getWebNavigation().currentURI.spec;
    var up = loc.replace(/(.*\/)[^\/]+\/?$/, "$1");
    open_url_in(prefix, up);
}
interactive("go-up", go_up, ["p"]);


function list_buffers()
{
    getWebNavigation().loadURI("about:blank", 
                               nsIWebNavigation.LOAD_FLAGS_NONE, null,
			       null, null);

    // There should be a better way, but I don't know what it is.
    setTimeout(list_all_buffers,0);
}
interactive("list-buffers", list_buffers, []);


function list_all_buffers()
{
    var doc = _content.content.document;
    var browsers = getBrowser().mBrowsers;
    for (var i=0;i<browsers.length; i++) {
	doc.write(browsers[i].webNavigation.currentURI.spec + "<HR>");
    }
    stopLoading();
}

function link_menu(prefix)
{
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

    readFromMiniBuffer(open_url_in_prompt(prefix,"Menu"), null, "link-menu", strs,
		       false, null, function(v) {open_url_in(prefix,v);});
}
interactive("link-menu", link_menu, ["p"]);


function text_reset() 
{
    try {
 	getBrowser().markupDocumentViewer.textZoom = 1.0;
	// We need to update the floaters
	numberedlinks_resize(window._content);
    } catch(e) { alert(e); }
}
interactive("text-reset", text_reset, []);


function text_reduce(prefix) 
{
    try {
 	getBrowser().markupDocumentViewer.textZoom -= 0.25 * prefix;
	// We need to update the floaters
	numberedlinks_resize(window._content);
    } catch(e) { alert(e); }
}
interactive("text-reduce", text_reduce, ["p"]);


function text_enlarge(prefix) 
{
    try {
 	getBrowser().markupDocumentViewer.textZoom += 0.25 * prefix;
	// We need to update the floaters
	numberedlinks_resize(window._content);
    } catch(e) { alert(e); }
}
interactive("text-enlarge", text_enlarge, ["p"]);


function eval_expression()
{
    readFromMiniBuffer("Eval:", null, "eval-expression", null, null, null, eval);
}
interactive("eval-expression", eval_expression, []);


// our little hack. Add a big blank chunk to the bottom of the
// page
const scrolly_document_observer = {

    enabled : false,

    observe: function(subject, topic, url)
    {
	// We asume the focused window is the one loading. Not always
	// the case..tho pretty safe since conkeror is only one window.
	try {
	    var win = document.commandDispatcher.focusedWindow;
	    var doc;
	    if (win) 
		doc = win.content.document;
	    else
		doc = content.document;

	    // Make sure we haven't already added the image
	    if (!doc.__conkeror_scrolly_hack__) {
		doc.__conkeror_scrolly_hack__ = true;
		var spc = doc.createElement("img");
		spc.setAttribute("width", "1");
		spc.setAttribute("height", getBrowser().mCurrentBrowser.boxObject.height);
		spc.setAttribute("src", "chrome://conkeror/content/pixel.png");
		doc.lastChild.appendChild(spc);
	    }
	} catch(e) {alert(e);}
    }
};

function toggle_eod_space()
{
    var observerService = Components.classes["@mozilla.org/observer-service;1"]
	.getService(Components.interfaces.nsIObserverService);
    if (scrolly_document_observer.enabled) {
	observerService.removeObserver(scrolly_document_observer, "page-end-load", false);
	scrolly_document_observer.enabled = false;
    } else {
	observerService.addObserver(scrolly_document_observer, "page-end-load", false);
	scrolly_document_observer.enabled = true;
    }
}
interactive("toggle-eod-space", toggle_eod_space, []);


// Enable Vi keybindings
function use_vi_keys()
{
    initViKmaps();
}
interactive("use-vi-keys", use_vi_keys, []);


// Enable Emacs keybindings
function use_emacs_keys()
{
    initKmaps();
}
interactive("use-emacs-keys", use_emacs_keys, []);


function mode_line_mode(arg)
{
    var win = document.commandDispatcher.focusedWindow;
    if (typeof arg == "number")
	gModeLineMode = (arg > 0)? true: false;
    else if (typeof arg == "object")
	gModeLineMode = !gModeLineMode;

    if (win) {
        updateModeline();
    }
}
interactive("mode-line-mode", mode_line_mode, ["P"]);


// Open the familiar preferences window.
// contributed by Steve Youngs
function customize ()
{
    window.openDialog("chrome://browser/content/preferences/preferences.xul", "PrefWindow",
		      "chrome,titlebar,toolbar,centerscreen,modal", "catFeaturesbutton");
}
interactive("customize", customize, []);
interactive("preferences", customize, []);


function extensions ()
{
    window.openDialog("chrome://mozapps/content/extensions/extensions.xul?type=extensions", "ExtensionsWindow",
		      "chrome,dialog=no,resizable");
}
interactive("extensions", extensions, []);


function adblock_add_pattern ()
{
    var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
    var branch = prefs.getBranch("conkeror.");

    readFromMiniBuffer("Add Adblock Filter: ", null, "adblock",
                       null, null, null,
		       function (str) {
			   var block = branch.prefHasUserValue("adblock") ? branch.getCharPref("adblock") : "";
			   branch.setCharPref("adblock", block + " " + str);
		       });
}
interactive("adblock-add-pattern", adblock_add_pattern, []);


function adblock_list_patterns ()
{
    var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
    var branch = prefs.getBranch("conkeror.");
    var block = branch.prefHasUserValue("adblock") ? branch.getCharPref("adblock") : "";

    message ("Patterns:" + block);
}
interactive("adblock-list-patterns", adblock_list_patterns, []);


function print_buffer()
{
    window._content.print();
}
interactive("print-buffer", print_buffer, []);


function renumber_links ()
{
    removeExistingNLs(window._content);
    window._content.__conk_start_num = null;
    createNumberedLinks(window._content);
}
interactive("renumber-links", renumber_links, []);


/* Open javascript console */
function jsconsole(prefix)
{
    open_url_in (prefix, "chrome://global/content/console.xul");
}
interactive("jsconsole", jsconsole, ["p"]);


// Open a regular firefox browser
function firefox ()
{
    window.openDialog("chrome://browser/content/", "_blank", "dialog=no,resizable,all");
}
interactive("firefox", firefox, []);


// minibuffer stuff
//
function exit_minibuffer (exit)
{
    //XXX: minibuffer.completions defaults to a 0 element array.  possible bug here.
    var completion_mode_p = (minibuffer.completions != null);
    var match = null;
    try {
        var val = removeWhiteSpace (minibuffer.input.value);
        if (completion_mode_p) {
            if (val.length == 0 && minibuffer.default_match != null)
                val = minibuffer.default_match;
            match = findCompleteMatch(minibuffer.completions, val);
        }
        addHistory(val);
        var callback = minibuffer.callback;
        minibuffer.callback = null;
        minibuffer.abort_callback = null;
        minibuffer.exit = exit;
        closeInput(true);
        if (callback) {
            if (completion_mode_p) {
                if (minibuffer.allow_nonmatches) {
                    callback (match, val);
                } else if (match) {
                    callback (match);
                }
            } else {
                callback(val);
            }
        }
    } catch (e) {message ("exit_minibuffer: "+e);}
}
interactive("exit-minibuffer", exit_minibuffer, ['current_command']);


function minibuffer_history_next ()
{
    if (minibuffer.history != null) {
        minibuffer.history_index++;
        if (minibuffer.history_index < minibuffer.history.length) {
            minibuffer.input.value = minibuffer.history[minibuffer.history_index];
        } else {
            minibuffer.history_index = minibuffer.history.length - 1;
        }
    }
}
interactive("minibuffer-history-next", minibuffer_history_next, []);


function minibuffer_history_previous ()
{
    if (minibuffer.history != null) {
        minibuffer.history_index--;
        if (minibuffer.history_index >= 0) {
            minibuffer.input.value = minibuffer.history[minibuffer.history_index];
        } else {
            minibuffer.history_index = 0;
        }
    }
}
interactive("minibuffer-history-previous", minibuffer_history_previous, []);


function minibuffer_abort ()
{
    if (minibuffer.abort_callback)
        minibuffer.abort_callback();
    minibuffer.abort_callback = null;
    minibuffer.callback = null;
    closeInput(true);
}
interactive("minibuffer-abort", minibuffer_abort, []);


function minibuffer_complete(direction)
{
    function wrap(val, max)
    {
        if (val < 0)
            return max;
        if (val > max)
            return 0;
        return val;
    }

    var field = minibuffer.input;
    var str = field.value;
    var enteredText = str.substring(0, field.selectionStart);
    var initialSelectionStart = field.selectionStart;
    //    if (typeof(direction) == 'undefined')
    direction = 1;

    if(! minibuffer.completions || minibuffer.completions.length == 0) return;

    minibuffer.current_completions = miniBufferCompleteStr(enteredText, minibuffer.completions);
    minibuffer.current_completion = minibuffer.current_completion || 0; // TODO: set this based on contents of field?

    // deselect unambiguous part
    while (minibuffer.current_completions.length ==
	   miniBufferCompleteStr(str.substring(0, field.selectionStart + 1),
				 minibuffer.completions).length &&
	   field.selectionStart != field.value.length) {
	field.setSelectionRange(field.selectionStart + 1, field.value.length);
    }

    // if the above had no effect, cycle through options
    if (initialSelectionStart == field.selectionStart) {
	minibuffer.current_completion = wrap(minibuffer.current_completion + direction, minibuffer.current_completions.length - 1);
	//minibuffer.current_completion = minibuffer.current_completion + direction;
	if(!minibuffer.current_completions[minibuffer.current_completion]) return;
	field.value = minibuffer.current_completions[minibuffer.current_completion][0];
	field.setSelectionRange(enteredText.length, field.value.length);
    }
}
interactive("minibuffer-complete", minibuffer_complete, []);


function minibuffer_accept_match ()
{
    var field = minibuffer.input;

    if (field.selectionStart == field.selectionEnd) {
        var start = field.selectionStart;
        // bleh
        field.value = field.value.substr(0, field.selectionStart) + " " + field.value.substr(field.selectionStart);
	field.setSelectionRange(start + 1, start + 1);
    } else {
        // When we allow non-matches it generally means the
        // completion takes an argument. So add a space.
        if (minibuffer.allow_nonmatches && minibuffer.input.value[minibuffer.input.length-1] != " ")
            minibuffer.input.value += " ";
	field.setSelectionRange(field.value.length, field.value.length);
    }
}
interactive("minibuffer-accept-match", minibuffer_accept_match, []);


function minibuffer_complete_reverse ()
{
    minibuffer_complete(-1);
}
interactive("minibuffer-complete-reverse", minibuffer_complete_reverse, []);


function minibuffer_change (event)
{
    // this command gets called by minibuffer.oninput, so the current value of
    // the field is whatever the user typed.
    //
    var enteredText = minibuffer.input.value;
    var len = minibuffer.input.value.length;
    

    // are there other viable options?
    if (minibuffer.completions)
    {
        // here we check a flag set by minibuffer-backspace.  this is sort of
        // an inflexable solution, chaining us to this one particular
        // behavior.  perhaps instead of a flag, we could have a callback that
        // handles how to select the text.
        if (! minibuffer.do_not_complete)
        {
            minibuffer.current_completions = miniBufferCompleteStr (minibuffer.input.value, minibuffer.completions);

            if (minibuffer.current_completions.length != 0)
            {
                minibuffer.input.value = minibuffer.current_completions[0][0];
                minibuffer.input.setSelectionRange(len, minibuffer.input.value.length);
            }
        } else {
            minibuffer.do_not_complete = false;
        }
    }
    // XXX: what is current_completion used for?
    minibuffer.current_completion = null;
}
interactive ("minibuffer-change", minibuffer_change, ['e']);


function minibuffer_backspace (prefix) {
    minibuffer.do_not_complete = true;
    cmd_deleteCharBackward (prefix);
}
interactive ("minibuffer-backspace", minibuffer_backspace, ['p']);
