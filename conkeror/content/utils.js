// -*- mode: java -*-

var gBrowser = null;

function getAccessibility(node)
{
    var acc_serv = Components.classes["@mozilla.org/accessibilityService;1"]
	.createInstance(Components.interfaces.nsIAccessibilityService);
    
    var o = new Object();
    var i = acc_serv.getAccessibleFor(node, o);
//     alert(i);
    return i;
//     var x = new Object();
//     var y = new Object();
//     var w = new Object();;
//     var h = new Object();;

//     acc.getBounds(x,y,w,h);
//     alert(x.value + " " + y.value + " " + w.value + " " + h.value);
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
    label.value = prompt;
    field.setAttribute("onkeypress", keypress);

    if (open) open();

    output.hidden = true;
    label.hidden = false;
    field.hidden = false;
    field.focus();
}

// The callback setup to be called when readFromMiniBuffer is done
var gReadFromMinibufferCallBack = null;

function miniBufferKeyPress(event)
{
    var field = document.getElementById("input-field");
    if (event.keyCode == KeyEvent.DOM_VK_RETURN) {
	try{
	    var val = field.value;
	    closeInput(true);
	    if (gReadFromMinibufferCallBack)
		gReadFromMinibufferCallBack(val);
	    gReadFromMinibufferCallBack = null;
	} catch (e) {window.alert(e);}
	//    } else if (event.keyCode == KeyEvent.DOM_VK_TAB) {
	// paste current url
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
}

// Read a string from the minibuffer and call callBack with the string
// as an argument.
function readFromMiniBuffer(prompt, callBack)
{
    gReadFromMinibufferCallBack = callBack;
    readInput(prompt, null, "miniBufferKeyPress(event);");
}

function closeInput(clearInput)
{
    try {
	var field = document.getElementById("input-field");
	var prompt = document.getElementById("input-prompt");
	var output = document.getElementById("minibuffer-output");
	var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
	    .getService(Components.interfaces.nsIWindowWatcher);
	if (window == ww.activeWindow && document.commandDispatcher.focusedElement &&
	    document.commandDispatcher.focusedElement.parentNode.parentNode == field) {
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
    var modeline = document.getElementById("mode-line");
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

function pasteX11CutBuffer()
{
    var s = readFromClipboard();
    if (!s)
	return;
    
    
}

// Show the message in the minibuffer
function message(str) {
    var minibuf = document.getElementById("minibuffer-output");
    minibuf.value = str;    
}

function clearMessage() {
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

function addKeyBinding(kmap, key, control, alt, keymap, command)
{
    var obj = {key: key, control: control, alt: alt};
    if (command)
	obj.command = command;
    else 
	obj.keymap = keymap;
    kmap.push(obj);
}

// This is a bit of a gross hack. but hey, who's watching? Kmap is a
// list of objects { key: <key>, control: <bool>, alt: <bool>, command: <function> }
function topLevelReadKey(key, kmap)
{
    var keybox = document.getElementById("readkey");

    gKeySeq = [key];
    gCurrentKmap = kmap;
    keybox.focus();
    addKeyPressHelpTimeout();
}

function readKeyPress(event)
{
    try {
	// kmap contains the keys and commands we're looking for.
	var keybox = document.getElementById("readkey");
	var kmap = gCurrentKmap;
	var done = true;
	var command = null;

	gKeySeq.push((event.ctrlKey?"C-":"") + String.fromCharCode(event.charCode));
	if (gKeyTimeout) {
	    message(gKeySeq.join(" "));
	}
	for (var i=0; i<kmap.length; i++) {
	    if (event.charCode == kmap[i].key 
		&& event.ctrlKey == kmap[i].control
		&& event.altKey == kmap[i].alt) {
		if (kmap[i].keymap) {
		    gCurrentKmap = kmap[i].keymap;
		    if (!gKeyTimeout)
			addKeyPressHelpTimeout();
		    // We're going for another round
		    done = false;
		    break;
		} else {
		    command = kmap[i].command;
		    break;
		}
	    }
	}

	// gobble the key
	event.preventDefault();
	event.preventBubble();

	if (done) {
	    // Revert focus
	    gKeySeq = [];
	    _content.focus();
	}

	// execute the command we found or tell the user it's undefined
	if (command) {
	    command();
	} else if (done) {
	    // C-g always aborts unless it's bound
	    if (event.ctrlKey && event.charCode == 103)
		message("Quit");
	    else
		message(gKeySeq.join(" ") + " undefined");
	}
    } catch(e){alert(e);}
}
