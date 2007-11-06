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

var gBrowser = null;
var current_kmap = null;
var overlay_kmap = null;
var gPrefixArg = null;

var isearch_active = false;
var numberedlinks_minibuffer_active = false;


/* Isearch-related frame-local variables */

// The point we search from
var gLastSearch = "";

// The window to search in (which frame)
var gWin = null;
var gSelCtrl = null;

// The find engine
var gFastFind = null;

// A list of find states
var gFindState = [];


///////// Begin surgery from conkeror.xml



function newBrowser (aUrl) {
    dumpln ('dbg: newBrowser '+aUrl);
    try {
        if (!aUrl)
            aUrl = "about:blank";
        var b = getBrowser().makeBrowser();
        getBrowser().mBrowserContainer.appendChild(b);
        getBrowser().setBrowserProgressListener(b.firstChild);
        b.firstChild.loadURIWithFlags(aUrl, Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null);
        getBrowser().setCurrentBrowser(b.firstChild);
        return b.firstChild;
    } catch(e) {window.alert(e); return null; }
}


function nextBrowser () {
    dumpln ('dbg: nextBrowser');
    try {
        if (this.getBrowser().mCurrentBrowser == null || this.getBrowser().mBrowsers.length <= 1)
            return;
        if (this.getBrowser().mCurrentBrowser.parentNode == this.getBrowser().mBrowserContainer.lastChild)
            this.getBrowser().setCurrentBrowser(this.getBrowser().mBrowserContainer.firstChild.firstChild);
        else
            this.getBrowser().setCurrentBrowser(this.getBrowser().mCurrentBrowser.parentNode.nextSibling.firstChild);
    } catch(e) {window.alert(e);}
}

function prevBrowser () {
    dumpln ('dbg: prevBrowser');
    try {
        if (this.getBrowser().mCurrentBrowser == null || this.getBrowser().mBrowsers.length <= 1)
            return;

        if (this.getBrowser().mCurrentBrowser.parentNode == this.getBrowser().mBrowserContainer.firstChild)
            this.getBrowser().setCurrentBrowser(this.getBrowser().mBrowserContainer.lastChild.firstChild);
        else
            this.getBrowser().setCurrentBrowser(this.getBrowser().mCurrentBrowser.parentNode.previousSibling.firstChild);
    } catch(e) {alert(e); }
}

function setProgressListener (aListener, aMask) {
    dumpln ('dbg: setProgressListener ('+aListener+', '+aMask+')');
    try {
        if (this.getBrowser().mProgressListener)
            this.getBrowser().mProgressFilter.removeProgressListener(this.getBrowser().mProgressListener);
        this.getBrowser().mProgressListener = aListener;
        if (this.getBrowser().mProgressListener) {
            this.getBrowser().mProgressFilter.addProgressListener(this.getBrowser().mProgressListener, aMask);
        }
    } catch(e) {window.alert(e);}
}

function getBrowserNames () {
    try {
        var bs = this.getBrowser().mBrowsers;
        var names = [];
        for (var i=0; i<bs.length; i++) {
            names.push(bs[i].webNavigation.currentURI.spec);
        }
        return names;
    } catch(e) {dumpln ("getBrowserNames: " + e); return null; }
}


///////// End surgery from conkeror.xml










function abs_point (node)
{
    var orig = node;
    var pt = {};
    try {
    pt.x = node.offsetLeft;
    pt.y = node.offsetTop;
    // find imagemap's coordinates
    if (node.tagName == "AREA") {
	var coords = node.getAttribute("coords").split(",");
	pt.x += Number(coords[0]);
	pt.y += Number(coords[1]);
    }

    node = node.offsetParent;
    // Sometimes this fails, so just return what we got.

	while (node.tagName != "BODY") {
	    pt.x += node.offsetLeft;
	    pt.y += node.offsetTop;
	    node = node.offsetParent;
	}
    } catch(e) {
// 	node = orig;
// 	while (node.tagName != "BODY") {
// 	    alert("okay: " + node + " " + node.tagName + " " + pt.x + " " + pt.y);
// 	    node = node.offsetParent;
// 	}
    }
    return pt;
}

function getAccessibility(node)
{
    // This is wrapped in a try-catch block because firefox fails when
    // retrieving a link's accessible.
    var acc_ret = Components.classes["@mozilla.org/accessibilityService;1"]
	.createInstance(Components.interfaces.nsIAccessibilityService);
    var foo = acc_ret.getAccessibleFor(node);
    return foo;
}

function getBrowser()
{
    if (gBrowser == null)
        gBrowser = document.getElementById("content");
    return gBrowser;
}

function getWebNavigation ()
{
    try {
        return getBrowser().webNavigation;
    } catch (e) {
        dumpln ('getWebNavigation: '+e);
        return null;
    }
}

function getMarkupDocumentViewer ()
{
  try {
      return getBrowser().markupDocumentViewer;
  } catch (e) {
      window.alert(e);
    return null;
  }    
}

// A function to setup reading input in the minibuffer
function read_from_minibuffer_internal (prompt)
{
//     var messageWindow = document.getElementById("message-bar");
    var label = document.getElementById("input-prompt");
    var output = document.getElementById("minibuffer-output");

    output.value = "";
    output.collapsed = true;
    label.collapsed = false;
    minibuffer.input.value = "";
    minibuffer.input.collapsed = false;

    minibuffer.focused_window = document.commandDispatcher.focusedWindow;
    minibuffer.focused_element = document.commandDispatcher.focusedElement;

    label.value = prompt;

    // If this isn't given a timeout it doesn't focus in ff1.5. I
    // don't know why.
//     setTimeout (function (){field.focus();}, 0);

    window.focus();
    minibuffer.input.focus();
//     document.commandDispatcher.focusedWindow = window;
//     document.commandDispatcher.focusedElement = field;
}

// Keeps track of history
var gHistory = [];
var minibuffer_history_max_items = 100;

function getHistory(id)
{
    if (gHistory[id] == null)
	gHistory[id] = [];

    return gHistory[id];
}

function initHistory(id)
{
    if (id != null) {
	minibuffer.history = getHistory(id);
	minibuffer.history_index = minibuffer.history.length;
    } else {
	minibuffer.history_index = null;
	minibuffer.history = null;
    }    
}

function addHistory(str)
{
    if (minibuffer.history != null) {
        if (minibuffer.history.length >= minibuffer_history_max_items)
            minibuffer.history.splice(0, 1);
        minibuffer.history.push(str);
    }
}

var minibuffer = {
input: null,

// The focus before we read from the minibuffer
focused_element: null,
focused_window: null,

// The callback setup to be called when readFromMiniBuffer is done
callback: null,
abort_callback: null,

// The completions for the user to choose
completions: [],

// The current completion
current_completion: null,
current_completions: null,

default_match: null,
allow_nonmatches: false,

// The current idx into the history
history_index: null,
// The arry we're using for history
history: null,

// hooks
oninput: function () { conkeror.call_interactively.call (this, "minibuffer-change"); },

// flag for backspace
do_not_complete: false,

// exit: a field corresponding to the interactive method `minibuffer_exit'.
// It is meant to be set by commands that call `exit_minibuffer', as a way to
// pass additional information to the command for which the minibuffer was
// being read, such as what keystroke caused exit_minibuffer to be called.
exit: null

};



function init_minibuffer () {
    minibuffer.input = document.getElementById("input-field");
}



// Cheap completion
function miniBufferCompleteStr(str, matches)
{
    var ret = [];
    for (var i=0; i<matches.length; i++)
	{
	    if (str.length == 0 || str == matches[i][0].substr(0, str.length)) {
		ret.push(matches[i]);
	    }
	}

    return ret;
}

// remove whitespace from the beginning and end
function removeWhiteSpace (str)
{
    var tmp = new String (str);
    return tmp.replace (/^\s+/, "").replace (/\s+$/, "");
}

function findCompleteMatch(matches, val)
{
    for (var i=0; i<matches.length; i++) {
	if (matches[i][0] == val)
	    return matches[i][1];
    }
    return null;
}

function setInputValue(str)
{
    minibuffer.input.value = str;
}

// Read a string from the minibuffer and call callBack with the string
// as an argument.
function readFromMiniBuffer(prompt, initVal, history, completions, allowNonMatches, defaultMatch, callBack, abortCallback)
{
    minibuffer.callback = callBack;
    minibuffer.abort_callback = abortCallback;
    minibuffer.completions = completions;
    minibuffer.current_completion = null;
    minibuffer.default_match = defaultMatch;
    minibuffer.allow_nonmatches = allowNonMatches;
    initHistory(history);
    ///// dumpln (dump_obj (minibuffer));
    read_from_minibuffer_internal (prompt);
    if (initVal) {
        setInputValue(initVal);
	if (initVal.length > 1) minibuffer.input.setSelectionRange(0, minibuffer.input.value.length);
    }
}

function setFocus(element) {
    Components.lookupMethod(element, "focus").call(element);
}

function closeInput(restoreFocus)
{
    try {
	var prompt = document.getElementById("input-prompt");
	var output = document.getElementById("minibuffer-output");
	if (minibuffer.focused_element && restoreFocus) {
	    try {
		// Focusing the element will scroll the window to the focused
		// element, but we want to restore focus without moving the
		// window. So scroll back after we've focused.
		var screenx = minibuffer.focused_window.scrollX;
		var screeny = minibuffer.focused_window.scrollY;
		setFocus(minibuffer.focused_element);
		minibuffer.focused_window.scrollTo(screenx,screeny);
	    } catch (e) {
		setFocus(minibuffer.focused_window);
	    }
	} else if (minibuffer.focused_window) {
	    content.focus();
// 	    setFocus(minibuffer.focused_window);
	} else {
	    // Last resort
	    content.focus();
	}

// 	if (clearInput)
	output.collapsed = false;
	prompt.collapsed = true;


	// alert ("message: " + output.value);

	// minibuffer.input.removeAttribute("flex");
	minibuffer.input.collapsed = true;
	//minibuffer.input.hidden = true;
	// minibuffer.input.value = "";
        minibuffer.input.onchange = "";
    } catch(e) { alert(e); }
}



// clipboard

function readFromClipboard()
{
  var url;

  try {
    // Get clipboard.
    var clipboard = Components.classes["@mozilla.org/widget/clipboard;1"]
                              .getService(Components.interfaces.nsIClipboard);

    // Create tranferable that will transfer the text.
    var trans = Components.classes["@mozilla.org/widget/transferable;1"]
                          .createInstance(Components.interfaces.nsITransferable);

    trans.addDataFlavor("text/unicode");
    // If available, use selection clipboard, otherwise global one
    if (clipboard.supportsSelectionClipboard())
      clipboard.getData(trans, clipboard.kSelectionClipboard);
    else
      clipboard.getData(trans, clipboard.kGlobalClipboard);

    var data = {};
    var dataLen = {};
    trans.getTransferData("text/unicode", data, dataLen);

    if (data) {
      data = data.value.QueryInterface(Components.interfaces.nsISupportsString);
      url = data.data.substring(0, dataLen.value / 2);
    }
  } catch (ex) {
  }

  return url;
}


// Show the message in the minibuffer
function message (str)
{
    var minibuf = document.getElementById("minibuffer-output");
    minibuf.value = str;
}

function clearMessage() 
{
    message("");
}

// gKeySeq is a list of keys the user has pressed to execute a
// command. If the user waits this list will be printed at the bottom
// of the screen, just like Emacs.
var gKeySeq = [];

// If the user waits for an amount of time then conkeror will display
// the key sequence they've typed thus far and ever key
// thereafter. This keeps track of whether the timeout has occurred.
var gKeyTimeout = false;

// The event for the last command
var gCommandLastEvent = null;


function addKeyPressHelpTimeout() {
    setTimeout(function () {if (gKeySeq.length>0) {message(gKeySeq.join(" ")); gKeyTimeout = true; }}, 2500);
}

// function addKeyBinding(kmap, key, control, alt, keymap, command)
// {
//     var obj = {key: key, control: control, alt: alt};
//     if (command)
// 	obj.command = command;
//     else 
// 	obj.keymap = keymap;
//     kmap.push(obj);
// }

function formatMods(mods)
{
    return (mods& conkeror.MOD_META ? "A-":"") 
	+ (mods&conkeror.MOD_CTRL ? "C-":"") 
	+ (mods&conkeror.MOD_SHIFT ? "S-":"");
}

function formatKey(key, mods)
{
    var s = key == 32 ? "SPC":String.fromCharCode(key);
    return formatMods(mods) + s;
}

function copyEvent(event)
{
    var ev = {};
    ev.keyCode = event.keyCode;
    ev.charCode = event.charCode;
    ev.ctrlKey = event.ctrlKey;
    ev.metaKey = event.metaKey;
    ev.altKey = event.altKey;
    ev.shiftKey = event.shiftKey;
    return ev;
}

function readKeyPress(event)
{
    try {
	// kmap contains the keys and commands we're looking for.

      /* The current key map is a per-frame property; there is no
         reason to try to duplicate Emacs behavior here, since it is
         counter-intuitive. */
	var kmap = window.current_kmap;
    if (!kmap) kmap = conkeror.top_kmap;
    
	var binding = null;
	var done = true;

	clearMessage();

	// Make a fake event
	gCommandLastEvent = copyEvent(event);

	// First check if there's an overlay kmap
	if (window.overlay_kmap != null) {
	    binding = conkeror.getKeyBinding (window.overlay_kmap, event);
            if (binding == null) {
                // disengage the universal keymap.
              /* The overlay kmap is also per-frame */
              window.overlay_kmap = null;
                //alert (gPrefixArg);
            }
	}

        ///XXX: context can override overlay.  is this right?
        ///
        /// consider: you hit C-u, thus enabling an overlay map.  then you hit `1'.
        ///           There is a good case to be made that this character key should
        ///           go to the gui control, not the overlay map.
        ///           
        ///
        if (kmap == conkeror.top_kmap) {
            // If we are not in the middle of a key sequence, context keymaps
            // get a chance to take the key.
            // 
            // Try the predicate of each context keymap until we find one that
            // matches.
            //
//             if (document.commandDispatcher.focusedElement)
//                 dumpln (conkeror.dump_obj (document.commandDispatcher.focusedElement));
            for (var i = 0; i < conkeror.context_kmaps.length; i++) {
              /* Predicates are passed the top-level frame on which
                 the event occurred, since all key handling is
                 per-frame. */
              if (conkeror.context_kmaps[i].predicate (window, document.commandDispatcher.focusedElement)) {
                    binding = conkeror.getKeyBinding (conkeror.context_kmaps[i], event);
                    //alert (window.dump_obj (binding));
                    break;
                }
            }
	}

	// Finally, top_kmap and friends get dibs.
	//
	if (binding == null) {
	    binding = conkeror.getKeyBinding (kmap, event);
	}

        // Should we stop this event from being processed by the gui?
        //
        // 1) we have a binding, and the binding's fallthrough property is not
        //    true.
        //
        // 2) we are in the middle of a key sequence, and we need to say that
        //    the key sequence given has no command.
        //
        if ((binding && ! binding.fallthrough) ||
            kmap != conkeror.top_kmap)
        {
            event.preventDefault();
            event.stopPropagation();
        }

	// Finally, process the binding.
	if (binding) {
	    if (binding.keymap) {
          window.current_kmap = binding.keymap;
		if (!gKeyTimeout)
		    addKeyPressHelpTimeout();
		// We're going for another round
		done = false;
	    } else if (binding.command) {
                conkeror.call_interactively.call (window, binding.command);
	    }
	} else {
	    // No binding was found.  If this is the universal abort_key, then
	    // abort().
            if (conkeror.keyMatch (conkeror.abort_key, event))
                abort();
	}

	// Clean up if we're done
	if (done) {
	    gKeySeq = [];
	    window.current_kmap = null;
	}

    } catch(e){alert(e);}
}


function zip2(array1, array2)
{
    len = array1.length < array2.length ? array2.length:array1.length;
    acc = [];
    for(var i=0; i<len; i++)
	acc.push([array1[i],array2[i]]);
    return acc;
}


function abort()
{
    // Reset the prefix arg
    gPrefixArg = null;
    message("Quit");
}


function getPostData()
{
    try {
        var sessionHistory = getWebNavigation().sessionHistory;
        var entry = sessionHistory.getEntryAtIndex(sessionHistory.index, false);
        entry = entry.QueryInterface(Components.interfaces.nsISHEntry);
        return entry.postData;
    } catch (e) { }
    return null;
}


// download_uri
//
function download_uri (url_s, dest_s)
{
    var url_o = makeURL (url_s);
    var document_o = null;

    var dest_file_o = Components.classes["@mozilla.org/file/local;1"]
        .createInstance(Components.interfaces.nsILocalFile);
    dest_file_o.initWithPath(dest_s);
    var dest_data_dir_o = null;
    var referrer_o = null;//should there be a referrer?
    var post_data_o = null;
    var content_type_s = null;
    var should_bypass_cache_p = true;//not sure...

    //we cannot save as text or as web-complete unless we are browsing the
    //document already.
    var save_as_text_p = false;
    var save_as_complete_p = false;

    download_uri_internal (
        url_o,
        document_o,
        dest_file_o,
        dest_data_dir_o,
        referrer_o,
        post_data_o,
        content_type_s,
        should_bypass_cache_p,
        save_as_text_p,
        save_as_complete_p
        );
}



function add_stringbundle (id, src)
{
    const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
    var stringbundleset = document.getElementById ("stringbundleset");
    var item = document.createElementNS (XUL_NS,"stringbundle");
    item.setAttribute ("id", id);
    item.setAttribute ("src", src);
    stringbundleset.appendChild (item);
    return item;
}






// var commandline_flags = {
//     'default': { doc: "This action is associated with stand-alone command-line arguments (those with no flag).",
//                  arg: 'URL',
//                  func: function (url) { dumpln (url); }
//     },

//     '-r': { doc: "Recycle active buffer for first url",
//             arg: false,
//             func: function () { dump ("I saw -r\n"); }
//     },

//     '-c': { doc: "Call interactive command",
//             arg: 'COMMAND',
//             func: function (command) { dump ("I saw -c with command, "+command+"\n"); }
//     }
// };


// function commandline_handler (cmdline) {
//     try {
//         var flag;
//         var expect = false;
//         var actions = [];
//         if (cmdline.length == 0) {
//             // FIXME: what should happen when a command line is remoted that
//             // has no arguments?  new frame?  request focus for active frame?
//             dumpln ("conkeror: command line remoted with no args.");
//         }
//         for (var i = 0; i < cmdline.length; i++) {
//             var arg = cmdline.getArgument (i);
//             if (expect == false && arg[0] == '-') {
//                 // looks like a flag
//                 if (arg in commandline_flags) {
//                     if (commandline_flags[arg].arg) {
//                         flag = arg;
//                         expect = true;
//                     } else {
//                         // this flag takes no argument.
//                         actions.push ([arg]);
//                     }
//                 } else {
//                     throw ("unrecognized flag: "+arg);
//                 }
//             } else {
//                 if (expect) {
//                     expect = false;
//                     actions.push ([flag, arg]);
//                 } else {
//                     // stand-alone argument, like an URL.  use default action.
//                     actions.push (['default', arg]);
//                 }
//             }
//         }
//         if (expect) { //p-tui!
//             var detail = (commandline_flags[flag].arg == true ? ""
//                           : " ("+commandline_flags[flag].arg + ")");
//             throw ("expected argument for flag, " + flag + detail);
//         }

//         while (actions.length) {
//             try {
//                 var a = actions.shift ();
//                 if (commandline_flags[ a[0] ].arg) {
//                     // an arg has been collected for this action (a[1])
//                     commandline_flags[ a[0] ].func (a[1]);
//                 } else {
//                     commandline_flags[ a[0] ].func ();
//                 }
//             } catch (e) {
//                 dump ("conkeror: command line action failed:\n"+e+"\n");
//             }
//         }

//         // should we open a new window?
// //         if (cmdline.state == cmdline.STATE_INITIAL_LAUNCH) {
// //             // we need to open a window, with our object as arg.
// //             ww.openWindow(null, CHROME_URI, "_blank",
// //                           "chrome,menubar,toolbar,status,resizable,dialog=no",
// //                           {wrappedJSObject: window_arguments});
// //         } else {
// //             // we need to pass our object to the active window.
// //             try {
// //                 ww.activeWindow.handle_window_arguments ({wrappedJSObject: window_arguments});
// //             } catch (e) {
// //                 dump ("conkeror: failed to find active window:\n"
// //                       +"          "+ e + "\n");
// //             }
// //         }

//     } catch (e) {
//         dump ("conkeror: abandoning command line interpretation because:\n"
//               +"          "+ e + "\n");
// //         Components.utils.reportError (e);
//     }
// }

