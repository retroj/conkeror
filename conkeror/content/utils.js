// -*- mode: java -*-

var gBrowser = null;

function getAccessibility(node)
{
    var acc_ret = Components.classes["@mozilla.org/accessibleRetrieval;1"]
	.createInstance(Components.interfaces.nsIAccessibleRetrieval);
    return acc_ret.getAccessibleFor(node);
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

function handle_history(event, field)
{
    if (event.charCode == 110 && event.ctrlKey) {
	if (gHistoryArray != null) {
	    gHistoryPoint++;
	    if (gHistoryPoint < gHistoryArray.length) {
		field.value = gHistoryArray[gHistoryPoint];
	    } else {
		gHistoryPoint = gHistoryArray.length - 1;
	    }
	}
	return true;
    } else if (event.charCode == 112 && event.ctrlKey) {
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

// The completions for the user to choose
var gMiniBufferCompletions = [];

// The current completion
var gCurrentCompletion = null;

var gCurrentCompletionStr = null;

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
	    closeInput(true);
	    addHistory(val);
	    if (gReadFromMinibufferCallBack)
		gReadFromMinibufferCallBack(val);
	    gReadFromMinibufferCallBack = null;
	} catch (e) {window.alert(e);}
	//    } else if (event.keyCode == KeyEvent.DOM_VK_TAB) {
	// paste current url
    } else if (handle_history(event, field)) {
	event.preventDefault();
	event.preventBubble();	
    } else if (event.keyCode == KeyEvent.DOM_VK_TAB 
	       || event.keyCode == KeyEvent.DOM_VK_RETURN
	       || event.keyCode == KeyEvent.DOM_VK_TAB 
	       || event.keyCode == KeyEvent.DOM_VK_ESCAPE
	       || (event.ctrlKey && (event.charCode == 103))) {
	gReadFromMinibufferCallBack = null;
	closeInput(true);
	event.preventDefault();
	event.preventBubble();
    }
    } catch(e) {alert(e);}
}

// Cheap completion
function miniBufferCompleteStr(str, matches, lastMatch)
{
    if (lastMatch >= matches.length)
	lastMatch = 0;

    for (var i=lastMatch; i<matches.length; i++)
	{
	    if (str.length == 0 || str == matches[i][0].substr(0, str.length)) {
		return i;
	    }
	}
    // No match? Loop around and try the rest
    for (var i=0; i<lastMatch; i++)
	{
	    if (str.length == 0 || str == matches[i][0].substr(0, str.length))
		return i;
	}
    return null;
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
	    var match = findCompleteMatch(gMiniBufferCompletions, val);
	    closeInput(true);
	    addHistory(val);
	    if (gReadFromMinibufferCallBack && match)
		gReadFromMinibufferCallBack(match);
	    gReadFromMinibufferCallBack = null;
	} catch (e) {window.alert(e);}
    } else if (handle_history(event, field)) {
	event.preventDefault();
	event.preventBubble();
    } else if (event.keyCode == KeyEvent.DOM_VK_TAB) {
	var str = field.value;
	var match = 0;
	if (gCurrentCompletion != null) {
	    match = gCurrentCompletion + 1;
	    str = gCurrentCompletionStr;
	}
	var idx = miniBufferCompleteStr(str, gMiniBufferCompletions, match);
	if (idx != null) {
	    gCurrentCompletionStr = str;
	    gCurrentCompletion = idx;
	    field.value = gMiniBufferCompletions[idx][0];
	}
	event.preventDefault();
	event.preventBubble();
    } else if (event.keyCode == KeyEvent.DOM_VK_RETURN
	       || event.keyCode == KeyEvent.DOM_VK_ESCAPE
	       || (event.ctrlKey && (event.charCode == 103))) {
	gReadFromMinibufferCallBack = null;
	closeInput(true);
	event.preventDefault();
	event.preventBubble();
    } else if (event.charCode) {
	// They typed a letter or did something, so reset the completion cycle
	gCurrentCompletion = null;
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
function readFromMiniBuffer(prompt, initVal, history, callBack)
{
    gReadFromMinibufferCallBack = callBack;
    initHistory(history);
    readInput(prompt, function () { setInputValue(initVal); }, "miniBufferKeyPress(event);");
}

function miniBufferComplete(prompt, history, completions, callBack)
{
    gReadFromMinibufferCallBack = callBack;
    gMiniBufferCompletions = completions;
    gCurrentCompletion = null;
    initHistory(history);
    readInput(prompt, null, "miniBufferCompleteKeyPress(event);");    
}

function setFocus(element) {
    Components.lookupMethod(element, "focus").call(element);
}

function closeInput(clearInput)
{
    try {
	var field = document.getElementById("input-field");
	var prompt = document.getElementById("input-prompt");
	var output = document.getElementById("minibuffer-output");
	if (gFocusedElement) {
	    try {
		setFocus(gFocusedElement);
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
    modeline.label = url.spec;
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

function pasteX11CutBuffer()
{
    var s = readFromClipboard();
    if (!s)
	return;
    
    
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

// This is a bit of a gross hack. but hey, who's watching? Kmap is a
// list of objects { key: <key>, control: <bool>, alt: <bool>, command: <function> }
function topLevelReadKey(key, kmap)
{
//     var keybox = document.getElementById("readkey");

    gKeySeq = [key];
    gCurrentKmap = kmap;
//     keybox.focus();
    addKeyPressHelpTimeout();
}

function formatKey(key, mods)
{
    return (mods&MOD_ALT ? "A-":"") 
	+ (mods&MOD_CTRL ? "C-":"") 
	+ (mods&MOD_SHIFT ? "S-":"")
	+ String.fromCharCode(key);
}

function keyMatch(key, event)
{
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
    return event.ctrlKey ? MOD_CTRL:0 |
	event.altKey ? MOD_ALT:0 |
	event.shiftKey ? MOD_SHIFT: 0;
}

function readKeyPress(event)
{
    try {
	// kmap contains the keys and commands we're looking for.
	var kmap = gCurrentKmap;
	var key = null;
	var done = true;

	clearMessage();

	gKeySeq.push(formatKey(event.charCode, getMods(event)));

	if (gKeyTimeout) {
	    message(gKeySeq.join(" "));
	}

	// This is hacky. Check a seperate key map first, if some sort of
	// form input is focused.
	if (kmap == top_kmap) {
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
		    if (event.charCode && !event.altKey && !event.ctrlKey)
			return;
		    key = getKeyAction(input_kmap, event);
		} else if (elt.tagName == "TEXTAREA") {
		    // Use the textarea keymap
		    if (charCode && !event.altKey && !event.ctrlKey)
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
	    // gobble the key
	    event.preventDefault();
	    event.preventBubble();
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
		message("Quit");
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
