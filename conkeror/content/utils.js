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
