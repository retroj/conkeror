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
    label.value = prompt;
    field.setAttribute("onkeypress", keypress);

    if (open) open();

//     label.hidden = true;
    field.hidden = false;
    field.focus();
}

function closeInput(clearInput)
{
    try {
	var field = document.getElementById("input-field");
	var prompt = document.getElementById("input-prompt");
	var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
	    .getService(Components.interfaces.nsIWindowWatcher);
	if (window == ww.activeWindow && document.commandDispatcher.focusedElement &&
	    document.commandDispatcher.focusedElement.parentNode.parentNode == field) {
	    _content.focus();
	}
	field.hidden = true;
	field.value = "";
	if (clearInput)
	    prompt.value = "";
    } catch(e) { window.alert(e); }
}

function updateModeline()
{
    var docshell = document.getElementById("content").webNavigation;
    var modeline = document.getElementById("mode-line");
    modeline.label = docshell.currentURI.spec;
}
