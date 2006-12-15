// -*- mode: java -*-
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
var default_directory = null;


function copy_img_location (node)
{
    var loc;
    if (node && node.getAttribute("src")) {
	loc = node.getAttribute("src");
	loc = makeURLAbsolute(node.baseURI, loc);
    }
    writeToClipboard(loc);
    message("Copied '" + loc + "'");
}


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
//       alert(getBrowser().curbrow.firstChild.webNavigation);
      return getBrowser().webNavigation;
  } catch (e) {
      window.alert(e);
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
function readInput(prompt, open, keypress)
{
//     var messageWindow = document.getElementById("message-bar");
    var label = document.getElementById("input-prompt");
    var field = document.getElementById("input-field");
    var output = document.getElementById("minibuffer-output");

    output.value = "";
    output.collapsed = true;
    label.collapsed = false;
    field.collapsed = false;

    gFocusedWindow = document.commandDispatcher.focusedWindow;
    gFocusedElement = document.commandDispatcher.focusedElement;

    label.value = prompt;
    field.setAttribute("onkeypress", keypress);

    if (open) open();

    // If this isn't given a timeout it doesn't focus in ff1.5. I
    // don't know why.
//     setTimeout (function (){field.focus();}, 0);

    window.focus();
    field.focus();
//     document.commandDispatcher.focusedWindow = window;
//     document.commandDispatcher.focusedElement = field;

}

function handle_basic_input(event)
{
    try {
    // Find the command
    var key = getKeyAction(input_kmap, event);



    // For now, don't handle embedded keymaps. Just commands 
    if (key) {
	if (key.command) {
	    exec_command(key.command);
	    return true;
	}
    }

    return false;
    } catch(e) {alert(e);}
}

// Keeps track of history
var gHistory = [];

function getHistory(id)
{
    if (gHistory[id] == null)
	gHistory[id] = [];

    return gHistory[id];
}

function initHistory(id)
{
    if (id != null) {
	gHistoryArray = getHistory(id);
	gHistoryPoint = gHistoryArray.length;
    } else {
	gHistoryPoint = null;
	gHistoryArray = null;
    }    
}

function metaPressed (event)
{
    return event.altKey || event.metaKey;
}

function handle_history(event, field)
{
    if (event.charCode == 110 && metaPressed(event)) {
	if (gHistoryArray != null) {
	    gHistoryPoint++;
	    if (gHistoryPoint < gHistoryArray.length) {
		field.value = gHistoryArray[gHistoryPoint];
	    } else {
		gHistoryPoint = gHistoryArray.length - 1;
	    }
	}
	return true;
    } else if (event.charCode == 112 && metaPressed(event)) {
	if (gHistoryArray != null) {
	    gHistoryPoint--;
	    if (gHistoryPoint >= 0) {
		field.value = gHistoryArray[gHistoryPoint];
	    } else {
		gHistoryPoint = 0;
	    }
	}
	return true;
    }
    return false;
}

function addHistory(str)
{
    // FIXME: make 100 customizable
    if (gHistoryArray.length >= 100)
	gHistoryArray.splice(0, 1);
    gHistoryArray.push(str);
}

// The focus before we read from the minibuffer
var gFocusedElement = null;
var gFocusedWindow = null;

// The callback setup to be called when readFromMiniBuffer is done
var gReadFromMinibufferCallBack = null;
var gReadFromMinibufferAbortCallBack = null;

// The completions for the user to choose
var gMiniBufferCompletions = [];

// The current completion
var gCurrentCompletion = null;

var gCurrentCompletions = null;

var gDefault = null;

var gAllowNonMatches = false;

// The current idx into the history
var gHistoryPoint = null;
// The arry we're using for history
var gHistoryArray = null;

function miniBufferKeyPress(event)
{
    try {
    var field = document.getElementById("input-field");
    if (event.keyCode == KeyEvent.DOM_VK_RETURN) {
	try{
	    var val = removeWhiteSpace (field.value);
	    addHistory(val);
	    var callback = gReadFromMinibufferCallBack;
	    gReadFromMinibufferCallBack = null;
	    gReadFromMinibufferAbortCallBack = null;
	    closeInput(true);
	    if (callback)
		callback(val);
	    event.preventDefault();
	    event.preventBubble();
	} catch (e) {window.alert(e);}
	//    } else if (event.keyCode == KeyEvent.DOM_VK_TAB) {
	// paste current url
    } else if (handle_history(event, field)) {
	event.preventDefault();
	event.preventBubble();	
    } else if (event.keyCode == KeyEvent.DOM_VK_ESCAPE
	       || (event.ctrlKey && (event.charCode == 103))) {
	if (gReadFromMinibufferAbortCallBack)
	    gReadFromMinibufferAbortCallBack();
	gReadFromMinibufferAbortCallBack = null;
	gReadFromMinibufferCallBack = null;
	closeInput(true);
	event.preventDefault();
	event.preventBubble();
    } else if (event.keyCode == KeyEvent.DOM_VK_TAB) {
	// gobble the tab
	event.preventDefault();
	event.preventBubble();
    } else if (handle_basic_input(event)) {
	// gobble the tab
	event.preventDefault();
	event.preventBubble();
    }
    } catch(e) {alert(e);}
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
    return tmp.replace (/^\s+/, "").replace (/\s+$/, "");;
}

function findCompleteMatch(matches, val)
{
    for (var i=0; i<matches.length; i++) {
	if (matches[i][0] == val)
	    return matches[i][1];
    }
    return null;
}

function miniBufferCompleteKeyPress(event)
{
    try {
	var field = document.getElementById("input-field");
	if (event.keyCode == KeyEvent.DOM_VK_RETURN) {
	    try{
		var val = removeWhiteSpace (field.value);
		if (val.length == 0 && gDefaultMatch != null)
		    val = gDefaultMatch;
		var match = findCompleteMatch(gMiniBufferCompletions, val);
		addHistory(val);
		var callback = gReadFromMinibufferCallBack;
		gReadFromMinibufferCallBack = null;
		gReadFromMinibufferAbortCallBack = null;
		closeInput(true);
		if (callback) {
		    if (gAllowNonMatches)
			callback(match, val);
		    else if (match)
			callback(match);
		}
	    event.preventDefault();
	    event.preventBubble();
	    } catch (e) {window.alert(e);}
	} else if (handle_history(event, field)) {
	    event.preventDefault();
	    event.preventBubble();
	} else if (event.keyCode == KeyEvent.DOM_VK_TAB) {
	    var str = field.value;
	    var idx;
	    if (gCurrentCompletion != null) {
		idx = gCurrentCompletion + (event.shiftKey ? -1:1);
		if (idx >= gCurrentCompletions.length)
		    idx = 0;
		else if (idx < 0)
		    idx = gCurrentCompletions.length - 1;
	    } else {
		idx = 0;
		// Build our completion list
		gCurrentCompletions = miniBufferCompleteStr(str, gMiniBufferCompletions);
		if (gCurrentCompletions.length == 0)
		    idx = null;
	    }
	    if (idx != null) {
		gCurrentCompletion = idx;
		field.value = gCurrentCompletions[idx][0];
		// When we allow non-matches it generally means the
		// completion takes an argument. So add a space.
		if (gAllowNonMatches)
		    field.value += " ";
	    }
	    event.preventDefault();
	    event.preventBubble();
	} else if (event.keyCode == KeyEvent.DOM_VK_ESCAPE
		   || (event.ctrlKey && (event.charCode == 103))) {
	    // Call the abort callback
	    if (gReadFromMinibufferAbortCallBack)
		gReadFromMinibufferAbortCallBack();
	    gReadFromMinibufferAbortCallBack = null;
	    gReadFromMinibufferCallBack = null;
	    closeInput(true);
	    event.preventDefault();
	    event.preventBubble();
	} else if (event.charCode && !event.ctrlKey && !metaPressed(event)) {
	    // They typed a letter, so reset the completion cycle
	    gCurrentCompletion = null;
	} else if (handle_basic_input(event)) {
	    // they did something so reset the completion cycle
	    gCurrentCompletion = null;
	    event.preventDefault();
	    event.preventBubble();
	}	    
    } catch(e) {alert(e);}
}

function setInputValue(str)
{
    var field = document.getElementById("input-field"); 
    field.value = str;
}

// Read a string from the minibuffer and call callBack with the string
// as an argument.
function readFromMiniBuffer(prompt, initVal, history, callBack, abortCallback)
{
    gReadFromMinibufferCallBack = callBack;
    gReadFromMinibufferAbortCallBack = abortCallback;
    initHistory(history);
    readInput(prompt, function () { setInputValue(initVal); }, "miniBufferKeyPress(event);");
}

function miniBufferComplete(prompt, initVal, history, completions, nonMatches, callBack, abortCallback, def)
{
    gReadFromMinibufferCallBack = callBack;
    gReadFromMinibufferAbortCallBack = abortCallback;
    gMiniBufferCompletions = completions;
    gCurrentCompletion = null;
    gDefaultMatch = def;
    gAllowNonMatches = nonMatches;
    initHistory(history);
    readInput(prompt, function () { setInputValue(initVal); }, "miniBufferCompleteKeyPress(event);");    
}

function setFocus(element) {
    Components.lookupMethod(element, "focus").call(element);
}

function closeInput(restoreFocus)
{
    try {
	var field = document.getElementById("input-field");
	var prompt = document.getElementById("input-prompt");
	var output = document.getElementById("minibuffer-output");
	if (gFocusedElement && restoreFocus) {
	    try {
		// Focusing the element will scroll the window to the focused
		// element, but we want to restore focus without moving the
		// window. So scroll back after we've focused.
		var screenx = gFocusedWindow.scrollX;
		var screeny = gFocusedWindow.scrollY;
		setFocus(gFocusedElement);
		gFocusedWindow.scrollTo(screenx,screeny);
	    } catch (e) {
		setFocus(gFocusedWindow);
	    }
	} else if (gFocusedWindow) {
	    content.focus();
// 	    setFocus(gFocusedWindow);
	} else {
	    // Last resort
	    content.focus();
	}

// 	if (clearInput)
	output.collapsed = false;
	prompt.collapsed = true;


	// alert ("message: " + output.value);

	// field.removeAttribute("flex");
	field.collapsed = true;
	//field.hidden = true;
	// field.value = "";
    } catch(e) { alert(e); }
}

// Enable/disable modeline
var gModeLineMode = true;

function showModeline()
{
    var modeline = getBrowser().modeLine;
    modeline.hidden = !gModeLineMode;
}

function updateModeline()
{
    var url = getWebNavigation().currentURI;
    var docshell = document.getElementById("content").webNavigation;
    var modeline = getBrowser().modeLine;
    var time = new Date();
    var hours = time.getHours();
    var mins = time.getMinutes();
    var win = document.commandDispatcher.focusedWindow;
    var x = win.scrollMaxX == 0 ? 100 : Math.round(win.scrollX / win.scrollMaxX * 100);
    var y = win.scrollMaxY == 0 ? 100 : Math.round(win.scrollY / win.scrollMaxY * 100);
    modeline.value = url.spec;
    modeline.value += "    " + (hours<10 ? "0" + hours:hours)
	+ ":" + (mins<10 ?"0" +mins:mins);
    modeline.value += "    (" + x + "," + y + ")";
    showModeline();
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

// Put the string on the clipboard
function writeToClipboard(str)
{
    const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
	.getService(Components.interfaces.nsIClipboardHelper);
    gClipboardHelper.copyString(str);
}

// Show the message in the minibuffer
function message(str)
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

// This is plain gross.
var gCurrentKmap = null;

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
    return (mods&MOD_META ? "A-":"") 
	+ (mods&MOD_CTRL ? "C-":"") 
	+ (mods&MOD_SHIFT ? "S-":"");
}

function formatKey(key, mods)
{
    var s = key == 32 ? "SPC":String.fromCharCode(key);
    return formatMods(mods) + s;
}

function keyMatch(key, event)
{
    // A key with the matchAny prop always matches
    if (key.key.matchAny)
	return true;
    else
	return ((key.key.charCode && event.charCode == key.key.charCode)
		|| (key.key.keyCode && event.keyCode == key.key.keyCode))
	    && getMods(event) == key.key.modifiers;
}

function getKeyAction(kmap, event)
{
    for (var i=0; i<kmap.length; i++) {
	if (keyMatch(kmap[i], event)) {
	    return kmap[i];
	}
    }
    return null;
}

function getMods(event)
{
    // The shift key into account when building the charCode, so it
    // can be said that the shift key has already be processed. So
    // don't include it in the mods if charCode exists in the event.
    return event.ctrlKey ? MOD_CTRL:0 |
	metaPressed(event) ? MOD_META:0 |
	(event.shiftKey && !event.charCode) ? MOD_SHIFT: 0;
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
    ev.fake = true;
    return ev;
}

function readKeyPress(event)
{
    try {
	// kmap contains the keys and commands we're looking for.
	var kmap = gCurrentKmap;
	var key = null;
	var done = true;

	clearMessage();

// 	gKeySeq.push(formatKey(event.charCode, getMods(event)));
// 	message(gKeySeq.join(" "));

	// Make a fake event
	gCommandLastEvent = copyEvent(event);

	// First check if there's an overlay kmap
	if (overlay_kmap != null) {
	    key = getKeyAction(overlay_kmap, event);
	} else if (kmap == top_kmap) {
	    // This is hacky. Check a seperate key map first, if some sort of
	    // form input is focused.
	    var elt = document.commandDispatcher.focusedElement;
	    if (elt) {
		var tag = elt.tagName.toLowerCase();
		var type = elt.getAttribute("type");
		if (type != null) {type = type.toLowerCase();}
		if (tag == "html:input"
		    || tag == "input" && (type != "radio"
					  && type != "checkbox")) {
		    // Use the input keymap for any input tag that
		    // isn't a radio button or checkbox.

		    // A bit of a hack, if there's a char code and no
		    // modifiers are set, then just let it get processed
		    if (event.charCode && !metaPressed(event) && !event.ctrlKey)
			return;
		    key = getKeyAction(input_kmap, event);
		} else if (elt.tagName == "TEXTAREA") {
		    // Use the textarea keymap
		    if (event.charCode && !metaPressed(event) && !event.ctrlKey)
			return;
		    key = getKeyAction(textarea_kmap, event);
		}
	    }
	}

	// Check for a key match
	if (key == null) {
	    key = getKeyAction(kmap, event);
	}

	// If it's the top level map and we didn't match the key, let
	// it fall through so something else can try handling
	// it. Otherwise, we wanna grab it because we're in the middle
	// of a key sequence.
	if (key || kmap != top_kmap) {
	    // gobble the key if it's not a fake event
	    if (!event.fake) {
		event.preventDefault();
		event.preventBubble();
	    }
	}

	// Finally, process the key
	if (key) {
	    if (key.keymap) {
		gCurrentKmap = key.keymap;
		if (!gKeyTimeout)
		    addKeyPressHelpTimeout();
		// We're going for another round
		done = false;
	    } else {
		exec_command(key.command);
	    }
	} else {
	    // C-g always aborts unless it's bound
	    if (event.ctrlKey && event.charCode == 103)
		abort();
// 	    else
// 		message(gKeySeq.join(" ") + " is undefined");
	}

	// Clean up if we're done
	if (done) {
	    gKeySeq = [];
	    gCurrentKmap = top_kmap;
	}

    } catch(e){alert(e);}
}

function goDoCommand(command)
{
    try {
        var dispatcher = top.document.commandDispatcher;
        var controller = dispatcher.getControllerForCommand(command);
        if (controller && controller.isCommandEnabled(command))
            controller.doCommand(command);
    }
    catch (e) { }
}

function zip2(array1, array2)
{
    len = array1.length < array2.length ? array2.length:array1.length;
    acc = [];
    for(var i=0; i<len; i++)
	acc.push([array1[i],array2[i]]);
    return acc;
}

var BMDS;
var BMSVC;
var RDF;
var kBMSVCIID;

function initBookmarkService()
{
    var kRDFSVCIID     = Components.interfaces.nsIRDFService;
    var kRDFContractID = "@mozilla.org/rdf/rdf-service;1";
    RDF                = Components.classes[kRDFContractID].getService(kRDFSVCIID);
    kBMSVCIID      = Components.interfaces.nsIBookmarksService;
    BMDS  	       = RDF.GetDataSource("rdf:bookmarks");
    BMSVC 	       = BMDS.QueryInterface(kBMSVCIID);
}

function add_bookmark(url, title, charset)
{
    BMSVC.addBookmarkImmediately(url, title, kBMSVCIID.BOOKMARK_DEFAULT_TYPE, charset);
}

//////////// Stolen from venkman

const PERM_IWOTH = 00002;  /* write permission, others */
const PERM_IWGRP = 00020;  /* write permission, group */

const MODE_RDONLY   = 0x01;
const MODE_WRONLY   = 0x02;
const MODE_RDWR     = 0x04;
const MODE_CREATE   = 0x08;
const MODE_APPEND   = 0x10;
const MODE_TRUNCATE = 0x20;
const MODE_SYNC     = 0x40;
const MODE_EXCL     = 0x80;


function fopen (path, mode, perms, tmp)
{
    return new LocalFile(path, mode, perms, tmp);
}

function LocalFile(file, mode, perms, tmp)
{
    const classes = Components.classes;
    const interfaces = Components.interfaces;

    const LOCALFILE_CTRID = "@mozilla.org/file/local;1";
    const FILEIN_CTRID = "@mozilla.org/network/file-input-stream;1";
    const FILEOUT_CTRID = "@mozilla.org/network/file-output-stream;1";
    const SCRIPTSTREAM_CTRID = "@mozilla.org/scriptableinputstream;1";
    
    const nsIFile = interfaces.nsIFile;
    const nsILocalFile = interfaces.nsILocalFile;
    const nsIFileOutputStream = interfaces.nsIFileOutputStream;
    const nsIFileInputStream = interfaces.nsIFileInputStream;
    const nsIScriptableInputStream = interfaces.nsIScriptableInputStream;
    
    if (typeof perms == "undefined")
        perms = 0666 & ~(PERM_IWOTH | PERM_IWGRP);

    if (typeof mode == "string")
    {
        switch (mode)
        {
            case ">":
                mode = MODE_WRONLY | MODE_CREATE | MODE_TRUNCATE;
                break;
            case ">>":
                mode = MODE_WRONLY | MODE_CREATE | MODE_APPEND;
                break;
            case "<":
                mode = MODE_RDONLY;
                break;
            default:
                throw "Invalid mode ``" + mode + "''";
        }
    }
        
    if (typeof file == "string")
    {
        this.localFile = classes[LOCALFILE_CTRID].createInstance(nsILocalFile);
        this.localFile.initWithPath(file);
    }
    else if (file instanceof nsILocalFile)
    {
        this.localFile = file;
    }
    else
    {
        throw "bad type for argument |file|.";
    }

    this.path = this.localFile.path;
    
    if (mode & (MODE_WRONLY | MODE_RDWR))
    {
        this.outputStream = 
            classes[FILEOUT_CTRID].createInstance(nsIFileOutputStream);
        this.outputStream.init(this.localFile, mode, perms, 0);
    }
    
    if (mode & (MODE_RDONLY | MODE_RDWR))
    {
        var is = classes[FILEIN_CTRID].createInstance(nsIFileInputStream);
        is.init(this.localFile, mode, perms, tmp);
        this.inputStream =
            classes[SCRIPTSTREAM_CTRID].createInstance(nsIScriptableInputStream);
        this.inputStream.init(is);
    }    
}


LocalFile.prototype.write =
function fo_write(buf)
{
    if (!("outputStream" in this))
        throw "file not open for writing.";
    
    return this.outputStream.write(buf, buf.length);
}

LocalFile.prototype.read =
function fo_read(max)
{
    if (!("inputStream" in this))
        throw "file not open for reading.";

    var av = this.inputStream.available();
    if (typeof max == "undefined")
        max = av;

    if (!av)
        return null;    
    
    var rv = this.inputStream.read(max);
    return rv;
}

LocalFile.prototype.close =
function fo_close()
{
    if ("outputStream" in this)
        this.outputStream.close();
    if ("inputStream" in this)
        this.inputStream.close();
}

LocalFile.prototype.flush =
function fo_close()
{
    return this.outputStream.flush();
}

function makeURLAbsolute (base, url)
{
    // Construct nsIURL.
    var ioService = Components.classes["@mozilla.org/network/io-service;1"]
	.getService(Components.interfaces.nsIIOService);
    var baseURI  = ioService.newURI(base, null, null);
        
    return ioService.newURI(baseURI.resolve(url), null, null).spec;
}

function abort()
{
    // Reset the prefix arg
    gPrefixArg = null;
    message("Quit");
}

// We don't care about helper apps or extensions or anything. Just put
// the bits where we're told.

function makeURL(aURL)
{
  var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                .getService(Components.interfaces.nsIIOService);
  return ioService.newURI(aURL, null, null);
}

function makeFileURL(aFile)
{
  var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                .getService(Components.interfaces.nsIIOService);
  return ioService.newFileURI(aFile);
}

function get_document_content_disposition (document_o)
{
    var content_disposition = null;
    try {
        content_disposition =
            document_o.defaultView
            .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
            .getInterface(Components.interfaces.nsIDOMWindowUtils)
            .getDocumentMetadata("content-disposition");
    } catch (e) { }
    return content_disposition;
}

// download_uri
//
// called by the command save-link.
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
        content_type_s,
        should_bypass_cache_p,
        save_as_text_p,
        save_as_complete_p
        );
}

/*
 * download_uri_internal
 *
 *  url_o           an nsIURI object of the page to be saved. required.
 *
 *  document_o      a document object of the page to be saved.
 *                  null if you want to save an URL that is not being
 *                  browsed, but in that case, you cannot save as text
 *                  or as `web-complete'.
 *
 *  dest_file_o     an nsILocalFile object for the destination file.
 *                  required.
 *
 *  dest_data_dir_o  an nsILocalFile object for the directory to hold
 *                   linked files when doing save-as-complete.  Otherwise
 *                   null.
 *
 *  referrer_o      nsIURI to pass as the referrer.  May be null.
 *
 *  content_type_s  a string content type of the document.  Required to
 *                  save as text or save as complete.  Should be provided
 *                  for save-page, but probably safe to pass null.  for URI's
 *                  not browsed yet (save-link) pass null.
 *
 *  should_bypass_cache_p   boolean tells whether to bypass cache data or not.
 *                          Usually pass true.
 *
 *  save_as_text_p  boolean tells whether to save as text.  mutually exclusive
 *                  with save_as_complete_p.  Only available when document_o is
 *                  supplied.
 *
 *  save_as_complete_p  boolean tells whether to save in complete mode.
 *                      mutually exclusive with save_as_text_p.  Only available
 *                      when document_o is supplied.  Requires dest_data_dir_o be
 *                      supplied.
 *
 */
function download_uri_internal (url_o, document_o,
                                dest_file_o, dest_data_dir_o, referrer_o,
                                content_type_s, should_bypass_cache_p,
                                save_as_text_p, save_as_complete_p)
{
    // We have no DOM, and can only save the URL as is.
    const SAVEMODE_FILEONLY      = 0x00;
    // We have a DOM and can save as complete.
    const SAVEMODE_COMPLETE_DOM  = 0x01;
    // We have a DOM which we can serialize as text.
    const SAVEMODE_COMPLETE_TEXT = 0x02;

    function GetSaveModeForContentType(aContentType)
    {
        var saveMode = SAVEMODE_FILEONLY;
        switch (aContentType) {
            case "text/html":
            case "application/xhtml+xml":
                saveMode |= SAVEMODE_COMPLETE_TEXT;
                // Fall through
            case "text/xml":
            case "application/xml":
                saveMode |= SAVEMODE_COMPLETE_DOM;
                break;
        }
        return saveMode;
    }

    //getPostData might be handy outside of download_uri_internal.
    //
    function getPostData()
    {
        try {
            var sessionHistory = getWebNavigation().sessionHistory;
            var entry = sessionHistory.getEntryAtIndex(sessionHistory.index, false);
            entry = entry.QueryInterface(Components.interfaces.nsISHEntry);
            return entry.postData;
        }
        catch (e) {
        }
        return null;
    }


    // to save the current page, pass in the url object of the current url, and the document object.

    // saveMode defaults to SAVEMODE_FILEONLY, meaning we have no DOM, so we can only save the file as-is.
    // SAVEMODE_COMPLETE_DOM means we can save as complete.
    // SAVEMODE_COMPLETE_TEXT means we have a DOM and we can serialize it as text.
    // text/html will have all these flags set, meaning it can be saved in all these ways.
    // text/xml will have just FILEONLY and COMPLETE_DOM.  We cannot serialize plain XML as text.

    var saveMode = GetSaveModeForContentType (content_type_s);

    // is_document_p is a flag that tells us a document object was passed
    // in, its content type was passed in, and this content type has a DOM.

    var is_document_p = document_o != null && saveMode != SAVEMODE_FILEONLY;

    // use_save_document_p is a flag that tells us that it is possible to save as
    // either COMPLETE or TEXT, and that saving as such was requested by the
    // caller.
    //
    // Therefore, it is ONLY possible to save in COMPLETE or TEXT
    // mode if we pass in a document object and its content type, and its
    // content type supports those save modes.
    //
    // Ergo, we can implement the Conkeror commands, save-page-as-text and
    // save-page-complete, but not corresponding commands for links.

    var use_save_document_p = is_document_p &&
        (((saveMode & SAVEMODE_COMPLETE_DOM) && !save_as_text_p && save_as_complete_p) ||
         ((saveMode & SAVEMODE_COMPLETE_TEXT) && save_as_text_p));

    if (save_as_text_p && !use_save_document_p)
        throw ("Cannot save this page as text.");

    if (save_as_complete_p && !use_save_document_p)
        throw ("Cannot save this page in complete mode.");

    // source may be a document object or an url object.

    var source = use_save_document_p ? document_o : url_o;

    // fileURL is an url object representing the output file.

    var fileURL = makeFileURL (dest_file_o);



    var persistArgs = {
        source: source,
        contentType: ((use_save_document_p && save_as_text_p) ?
                      "text/plain" : content_type_s),
        target: fileURL,
        postData: (is_document_p ? getPostData() : null), //ok (new)
        bypassCache: should_bypass_cache_p
    };

    const nsIWBP = Components.interfaces.nsIWebBrowserPersist;
    var persist = Components.classes["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"]
        .createInstance(nsIWBP);

    // Calculate persist flags.
    const flags = nsIWBP.PERSIST_FLAGS_REPLACE_EXISTING_FLAGS;
    if (should_bypass_cache_p)
        persist.persistFlags = flags | nsIWBP.PERSIST_FLAGS_BYPASS_CACHE;
    else
        persist.persistFlags = flags | nsIWBP.PERSIST_FLAGS_FROM_CACHE;

    // Let the WebBrowserPersist decide whether the incoming data is encoded
    // and whether it needs to go through a content converter e.g. to
    // decompress it.
    persist.persistFlags |= nsIWBP.PERSIST_FLAGS_AUTODETECT_APPLY_CONVERSION;

    // Create download and initiate it (below)
    //
    //XXX RetroJ:
    //  This transfer object is what produces the gui downloads display.  As a
    //  future project, we will use a nsIWebProgressListener internal to
    //  conkeror that does not involve annoying gui dialogs.
    //
    var tr = Components.classes["@mozilla.org/transfer;1"].createInstance(Components.interfaces.nsITransfer);

    if (use_save_document_p)
    {
        // Saving a Document, not a URI:
        var encodingFlags = 0;
        if (persistArgs.contentType == "text/plain")
        {
            encodingFlags |= nsIWBP.ENCODE_FLAGS_FORMATTED;
            encodingFlags |= nsIWBP.ENCODE_FLAGS_ABSOLUTE_LINKS;
            encodingFlags |= nsIWBP.ENCODE_FLAGS_NOFRAMES_CONTENT;
        } else {
            encodingFlags |= nsIWBP.ENCODE_FLAGS_BASIC_ENTITIES;
        }

        const kWrapColumn = 80;
        
        // this transfer object is the only place in this document-saving branch where url_o is needed.
        tr.init (url_o, persistArgs.target, "", null, null, null, persist);
        persist.progressListener = tr;
        //persist.progressListener = progress_listener;
        persist.saveDocument (persistArgs.source, persistArgs.target, dest_data_dir_o,
                              persistArgs.contentType, encodingFlags, kWrapColumn);
    } else {
        // Saving a URI:

        tr.init (source, persistArgs.target, "", null, null, null, persist);
        persist.progressListener = tr;
        //persist.progressListener = progress_listener;
        persist.saveURI (source, null, referrer_o, persistArgs.postData, null,
                         persistArgs.target);
    }
}



/**
 * Determine what the 'default' path is for operations like save-page.
 * Returns an nsILocalFile.
 * @param url_o nsIURI of the document being saved.
 * @param aDocument The document to be saved
 * @param aContentType The content type we're saving, if it could be
 *        determined by the caller.
 * @param aContentDisposition The content-disposition header for the object
 *        we're saving, if it could be determined by the caller.
 * @param dest_extension_s To override the extension of the destination file,
 *        pass the extension you want here.  Otherwise pass null.  This is
 *        used by save_page_as_text.
 */
function make_default_file_name_to_save_url (url_o, aDocument, aContentType, aContentDisposition, dest_extension_s)
{
     function getDefaultExtension(file_name_s, url_o, aContentType)
     {
         if (aContentType == "text/plain" || aContentType == "application/octet-stream" || url_o.scheme == "ftp")
             return "";   // temporary fix for bug 120327
 
         // First try the extension from the filename
         var url = Components.classes["@mozilla.org/network/standard-url;1"]
             .createInstance(Components.interfaces.nsIURL);
         url.filePath = file_name_s;
 
         var ext = url.fileExtension;
 
         // This mirrors some code in nsExternalHelperAppService::DoContent
         // Use the filename first and then the URI if that fails
   
         var mimeInfo = null;
         if (aContentType || ext) {
             try {
                 mimeInfo = Components.classes["@mozilla.org/mime;1"]
                     .getService(Components.interfaces.nsIMIMEService)
                     .getFromTypeAndExtension(aContentType, ext);
             }
             catch (e) {
             }
         }
 
         if (ext && mimeInfo && mimeInfo.extensionExists(ext))
             return ext;
   
         // Well, that failed.  Now try the extension from the URI
         var urlext;
         try {
             url = url_o.QueryInterface(Components.interfaces.nsIURL);
             urlext = url.fileExtension;
         } catch (e) {
         }
 
         if (urlext && mimeInfo && mimeInfo.extensionExists(urlext)) {
             return urlext;
         } else {
             try {
                 return mimeInfo.primaryExtension;
             }
             catch (e) {
                 // Fall back on the extensions in the filename and URI for lack
                 // of anything better.
                 return ext || urlext;
             }
         }
     }
 
 
     function getDefaultFileName(aDefaultFileName, aURI, aDocument,
                                 aContentDisposition)
     {
         function getCharsetforSave(aDocument)
         {
             if (aDocument)
                 return aDocument.characterSet;
 
             if (document.commandDispatcher.focusedWindow)
                 return document.commandDispatcher.focusedWindow.document.characterSet;
 
             return window.content.document.characterSet;
         }
 
         function validateFileName(aFileName)
         {
             var re = /[\/]+/g;
             if (navigator.appVersion.indexOf("Windows") != -1) {
                 re = /[\\\/\|]+/g;
                 aFileName = aFileName.replace(/[\"]+/g, "'");
                 aFileName = aFileName.replace(/[\*\:\?]+/g, " ");
                 aFileName = aFileName.replace(/[\<]+/g, "(");
                 aFileName = aFileName.replace(/[\>]+/g, ")");
             }
             else if (navigator.appVersion.indexOf("Macintosh") != -1)
                 re = /[\:\/]+/g;
   
             return aFileName.replace(re, "_");
         }
 
 
         // 1) look for a filename in the content-disposition header, if any
         if (aContentDisposition) {
             const mhp = Components.classes["@mozilla.org/network/mime-hdrparam;1"]
                 .getService(Components.interfaces.nsIMIMEHeaderParam);
             var dummy = { value: null };  // Need an out param...
             var charset = getCharsetforSave(aDocument);
 
             var fileName = null;
             try {
                 fileName = mhp.getParameter(aContentDisposition, "filename", charset,
                                             true, dummy);
             }
             catch (e) {
                 try {
                     fileName = mhp.getParameter(aContentDisposition, "name", charset, true,
                                                 dummy);
                 }
                 catch (e) {
                 }
             }
             if (fileName)
                 return fileName;
         }
 
         try {
             var url = aURI.QueryInterface(Components.interfaces.nsIURL);
             if (url.fileName != "") {
                 // 2) Use the actual file name, if present
                 var textToSubURI = Components.classes["@mozilla.org/intl/texttosuburi;1"]
                     .getService(Components.interfaces.nsITextToSubURI);
                 return validateFileName(textToSubURI.unEscapeURIForUI(url.originCharset || "UTF-8", url.fileName));
             }
         } catch (e) {
             // This is something like a data: and so forth URI... no filename here.
         }
 
         if (aDocument) {
             var docTitle = validateFileName(aDocument.title).replace(/^\s+|\s+$/g, "");
             if (docTitle) {
                 // 3) Use the document title
                 return docTitle;
             }
         }
 
         if (aDefaultFileName)
             // 4) Use the caller-provided name, if any
             return validateFileName(aDefaultFileName);
 
         // 5) If this is a directory, use the last directory name
         var path = aURI.path.match(/\/([^\/]+)\/$/);
         if (path && path.length > 1)
             return validateFileName(path[1]);
 
         try {
             if (aURI.host)
                 // 6) Use the host.
                 return aURI.host;
         } catch (e) {
             // Some files have no information at all, like Javascript generated pages
         }
         try {
             // 7) Use the default file name
             return getStringBundle().GetStringFromName("DefaultSaveFileName");
         } catch (e) {
             //in case localized string cannot be found
         }
         // 8) If all else fails, use "index"
         return "index";
     }
 
     // end of support functions.
     //
 
     var file_ext_s;
     var file_base_name_s;

    try {
        // Assuming nsiUri is valid, calling QueryInterface(...) on it will
        // populate extra object fields (eg filename and file extension).
        var url = url_o.QueryInterface(Components.interfaces.nsIURL);
        file_ext_s = url.fileExtension;
    } catch (e) { }

    // Get the default filename:
    var file_name_s = getDefaultFileName(null, url_o, aDocument, aContentDisposition);

    // If file_ext_s is still blank, and url_o is a web link (http or
    // https), make the extension `.html'.
    if (! file_ext_s && !aDocument && !aContentType && (/^http(s?)/i.test(url_o.scheme))) {
        file_ext_s = ".html";
        file_base_name_s = file_name_s;
    } else {
        file_ext_s = getDefaultExtension(file_name_s, url_o, aContentType);
        // related to temporary fix for bug 120327 in getDefaultExtension
        if (file_ext_s == "")
            file_ext_s = file_name_s.replace (/^.*?\.(?=[^.]*$)/, "");
        file_base_name_s = file_name_s.replace (/\.[^.]*$/, "");
    }

    if (dest_extension_s)
        file_ext_s = dest_extension_s;

    var file_name_o  = default_directory.clone();
    file_name_o.append (file_base_name_s +'.'+ file_ext_s);
    return file_name_o;
}

function set_default_directory (directory_s) {
    if (! directory_s)
    {
        var env = Components.classes['@mozilla.org/process/environment;1']
            .createInstance (Components.interfaces.nsIEnvironment);
        if (env.exists ('HOME'))
            directory_s = env.get('HOME');
    }
    default_directory = Components.classes["@mozilla.org/file/local;1"]
        .createInstance(Components.interfaces.nsILocalFile);
    default_directory.initWithPath (directory_s);

}
