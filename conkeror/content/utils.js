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

    gFocusedWindow = document.commandDispatcher.focusedWindow;
    gFocusedElement = document.commandDispatcher.focusedElement;

    label.value = prompt;
    field.setAttribute("onkeypress", keypress);

    if (open) open();

    output.hidden = true;
    label.hidden = false;
    field.hidden = false;
    field.focus();
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
	    var val = field.value;
	    closeInput(true, true);
	    addHistory(val);
	    var callback = gReadFromMinibufferCallBack;
	    gReadFromMinibufferCallBack = null;
	    gReadFromMinibufferAbortCallBack = null;
	    if (callback)
		callback(val);
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
	closeInput(true, true);
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
		var val = field.value;
		if (val.length == 0 && gDefaultMatch != null)
		    val = gDefaultMatch;
		var match = findCompleteMatch(gMiniBufferCompletions, val);
		closeInput(true, true);
		addHistory(val);
		var callback = gReadFromMinibufferCallBack;
		gReadFromMinibufferCallBack = null;
		gReadFromMinibufferAbortCallBack = null;
		if (callback) {
		    if (gAllowNonMatches)
			callback(match, val);
		    else if (match)
			callback(match);
		}
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
	    gReadFromMinibufferCallAbortBack = null;
	    gReadFromMinibufferCallBack = null;
	    closeInput(true, true);
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
    gReadFromMinibufferCallAbortBack = abortCallback;
    initHistory(history);
    readInput(prompt, function () { setInputValue(initVal); }, "miniBufferKeyPress(event);");
}

function miniBufferComplete(prompt, initVal, history, completions, nonMatches, callBack, abortCallback, def)
{
    gReadFromMinibufferCallBack = callBack;
    gReadFromMinibufferCallAbortBack = abortCallback;
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

function closeInput(clearInput, restoreFocus)
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
	    setFocus(gFocusedWindow);
	} else {
	    // Last resort
	    _content.focus();
	}

	if (clearInput)
	    output.value = "";
	output.hidden = false;
	prompt.hidden = true;
	field.hidden = true;
	field.value = "";
    } catch(e) { window.alert(e); }
}

function updateModeline(url)
{
    var docshell = document.getElementById("content").webNavigation;
    var modeline = getBrowser().modeLine;
    modeline.value = "--:%%  " + url.spec;
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
		var type = elt.getAttribute("type");
		if (elt.tagName == "INPUT" && (type == null
						|| type == "text"
						|| type == "password"
						|| type == "file")) {
		    // Use the input keymap.

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

function makeWebBrowserPersist()
{
  const persistContractID = "@mozilla.org/embedding/browser/nsWebBrowserPersist;1";
  const persistIID = Components.interfaces.nsIWebBrowserPersist;
  return Components.classes[persistContractID].createInstance(persistIID);
}

function download_uri(uri, dest)
{
    try {
    var persist = makeWebBrowserPersist();

    // Calculate persist flags.
    const nsIWBP = Components.interfaces.nsIWebBrowserPersist;
    const flags = nsIWBP.PERSIST_FLAGS_NO_CONVERSION 
	          | nsIWBP.PERSIST_FLAGS_REPLACE_EXISTING_FILES
	          | nsIWBP.PERSIST_FLAGS_BYPASS_CACHE;
    persist.persistFlags = flags;

    // Create download and initiate it (below)
    var file = Components.classes["@mozilla.org/file/local;1"]
	                 .createInstance(Components.interfaces.nsILocalFile);
    file.initWithPath(dest);
    
    var source = makeURL(uri);
    var target = makeFileURL(file);

    var dl = Components.classes["@mozilla.org/download;1"]
	               .createInstance(Components.interfaces.nsIDownload);
    dl.init(source, target, null, null, null, persist);
    persist.saveURI(source, null, null, null, null, file);
    } catch(e) {alert(e);}
}
