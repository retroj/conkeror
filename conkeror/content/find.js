// -*- mode: java -*-

// isearch

// The point we search from
var gLastSearch = "";

// The window to search in (which frame)
var gWin = null;
var gSelCtrl = null;

// The find engine
var gFastFind = null;

// A list of find states
var gFindState = [];

function createInitialFindState()
{
    var state = new Array();
    state["screenx"] = gWin.scrollX;
    state["screeny"] = gWin.scrollY;
    state["search-str"] = "";
    state["wrapped"] = false;
    state["point"] = null;
    state["range"] = document.createRange();
    state["selection"] = null;
    state["direction"] = true;
    return state;
}

function addFindState(screenX, screenY, searchStr, wrapped, point, range, selection, direction)
{
    var state = new Array();
    state["screenx"] = screenX;
    state["screeny"] = screenY;
    state["search-str"] = searchStr;
    state["wrapped"] = wrapped;
    state["point"] = point;
    state["range"] = range;
    state["selection"] = selection;
    state["direction"] = direction;
    gFindState.push(state);
}

function resumeFindState(state)
{
    var findField = document.getElementById("input-field");
    var label = document.getElementById("input-prompt");

    findField.value = state["search-str"];
    if (state["selection"])
	setSelection(state["selection"]);
    else
	clearSelection();
    gWin.scrollTo(state["screenx"], state["screeny"]);

    label.value = (state["wrapped"] ? "Wrapped ":"") 
	+ (state["range"] ? "":"Failing ") + "I-Search:";
}

function lastFindState()
{
    return gFindState[gFindState.length-1];
}

function focusFindBar()
{
    try {
    gWin = document.commandDispatcher.focusedWindow;
    gSelCtrl = getFocusedSelCtrl();

    } catch(e) {alert(e);}

//     var bar = document.getElementById("find-toolbox");
//     var field = document.getElementById("find-field");
//     bar.hidden = false;
//     field.focus();

    // initialize our state list
    var state = createInitialFindState();
    gFindState = [];
    gFindState.push(state);
    resumeFindState(state);
}

function focusFindBarBW()
{
    focusFindBar();
    lastFindState()["direction"] = false;
}


function closeFindBar()
{
    closeInput(true);
}


function getFastFind()
{
    try {
    if (gFastFind == null) {
	gFastFind = Components.classes["@mozilla.org/typeaheadfind;1"]
	    .createInstance(Components.interfaces.nsITypeAheadFind); 
	alert(gFastFind);
// 	gFastFind.init(gBrowser.docShell);
    }
    return gFastFind;
    } catch(e) {alert(e);}
}

function getSelectionController()
{
//     var ds = window._content.frames[0].docShell;
  var ds = getBrowser().docShell;
//   var frame = gBrowser.docShell.presShell.getRootFrame();
//     var ds = window._content.frames[0].docShell;

  var display = ds.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsISelectionDisplay);
  if (!display)
    return null;
  return display.QueryInterface(Components.interfaces.nsISelectionController);
}

function highlight(range, node)
{
  var startContainer = range.startContainer;
  var startOffset = range.startOffset;
  var endOffset = range.endOffset;
  var docfrag = range.extractContents();
  var before = startContainer.splitText(startOffset);
  var parent = before.parentNode;
  node.appendChild(docfrag);
  parent.insertBefore(node, before);
  return node;
}

// turn on the selection in all frames
function getFocusedSelCtrl()
{
  var ds = getBrowser().docShell;
  var dsEnum = ds.getDocShellEnumerator(Components.interfaces.nsIDocShellTreeItem.typeContent,
                                        Components.interfaces.nsIDocShell.ENUMERATE_FORWARDS);
  while (dsEnum.hasMoreElements()) {
    ds = dsEnum.getNext().QueryInterface(Components.interfaces.nsIDocShell);
    if (ds.hasFocus) 
	{
	    var display = ds.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsISelectionDisplay);
	    if (!display)
		return null;
	    return display.QueryInterface(Components.interfaces.nsISelectionController);
	}
  }
  return null;
}

// Select the range and scroll it into view
function clearSelection()
{
    var selctrl = gSelCtrl;
    var sel = selctrl.getSelection(Components.interfaces.nsISelectionController.SELECTION_NORMAL);
    sel.removeAllRanges();
}

function setSelection(range)
{
    try {
	var selctrlcomp = Components.interfaces.nsISelectionController;
	var selctrl = gSelCtrl;
	var sel = selctrl.getSelection(selctrlcomp.SELECTION_NORMAL);
	sel.removeAllRanges();
	sel.addRange(range.cloneRange());

	selctrl.scrollSelectionIntoView(selctrlcomp.SELECTION_NORMAL,
					selctrlcomp.SELECTION_FOCUS_REGION,
				     true);
    } catch(e) {alert("setSelection: " + e);}
}

function highlightAllBut(str, range, color)
{
    try {
	var finder = Components.classes["@mozilla.org/embedcomp/rangefind;1"].createInstance()
	    .QueryInterface(Components.interfaces.nsIFind);
	var searchRange;
	var startPt;
	var endPt;

	var doc = window.content.document;
	var body = doc.body;

	searchRange = doc.createRange();
	startPt = doc.createRange();
	endPt = doc.createRange();

	var count = body.childNodes.length;

	// Search range in the doc
	searchRange.setStart(body,0);
	searchRange.setEnd(body, count);
	startPt.setStart(body, 0);
	startPt.setEnd(body, 0);
	endPt.setStart(body, count);
	endPt.setEnd(body, count);

	// Highlight the rest
	var retRange = null;
	var hlNode = doc.createElement("span");
	hlNode.setAttribute("style", "background-color: " + color + ";");
	hlNode.setAttribute("id", "__conkeror-findbar-search-id");

	while ((retRange = finder.Find(str, searchRange, startPt, endPt))) {
	    if (retRange.startContainer != range.startContainer) {
		var nodeSurround = hlNode.cloneNode(true);
		var node = highlight(retRange, nodeSurround);
		startPt = node.ownerDocument.createRange();
		startPt.setStart(node, node.childNodes.length);
		startPt.setEnd(node, node.childNodes.length);
	    } else {
		startPt = retRange.endContainer.ownerDocument.createRange();
		startPt.setStart(retRange.endContainer, retRange.endOffset);
		startPt.setEnd(retRange.endContainer, retRange.endOffset);
	    }
	}
    } catch(e) {alert(e);}
}

// Highlight find matches and move selection to the first occurrence
// starting from pt.
function highlightFind(str, color, wrapped, dir, pt)
{
    try {
	var doc = gWin.document;
	var finder = Components.classes["@mozilla.org/embedcomp/rangefind;1"].createInstance()
	    .QueryInterface(Components.interfaces.nsIFind);
	var searchRange;
	var startPt;
	var endPt;
	var body = doc.body;

	finder.findBackwards = !dir;

	searchRange = doc.createRange();
	startPt = doc.createRange();
	endPt = doc.createRange();

	var count = body.childNodes.length;

	// Search range in the doc
	searchRange.setStart(body,0);
	searchRange.setEnd(body, count);

	if (!dir) {
	    if (pt == null) {
		startPt.setStart(body, count);
		startPt.setEnd(body, count);
	    } else {
		startPt.setStart(pt.startContainer, pt.startOffset);
		startPt.setEnd(pt.startContainer, pt.startOffset);
	    }
	    endPt.setStart(body, 0);
	    endPt.setEnd(body, 0);
	} else {
	    if (pt == null) {
		startPt.setStart(body, 0);
		startPt.setEnd(body, 0);
	    } else {
		startPt.setStart(pt.endContainer, pt.endOffset);
		startPt.setEnd(pt.endContainer, pt.endOffset);
	    }
	    endPt.setStart(body, count);
	    endPt.setEnd(body, count);
	}
	// search the doc
	var retRange = null;
	var selectionRange = null;

	if (!wrapped) {
	    do {
		retRange = finder.Find(str, searchRange, startPt, endPt);
		var keepSearching = false;
		if (retRange) {
		    var sc = retRange.startContainer;
		    var ec = retRange.endContainer;
		    if (!sc || !ec) alert(sc + " " + ec);
		    var acc = getAccessibility(sc);
		    var sx = new Object();
		    var sy = new Object();
		    var sw = new Object();
		    var sh = new Object();
		    acc.getBounds(sx,sy,sw,sh);
		    acc = getAccessibility(ec);
		    var ex = new Object();
		    var ey = new Object();
		    var ew = new Object();
		    var eh = new Object();
		    acc.getBounds(ex,ey,ew,eh);
		    startPt = retRange.startContainer.ownerDocument.createRange();
		    if (!dir) {
			startPt.setStart(retRange.startContainer, retRange.startOffset);
			startPt.setEnd(retRange.startContainer, retRange.startOffset);
		    } else {
			startPt.setStart(retRange.endContainer, retRange.endOffset);
			startPt.setEnd(retRange.endContainer, retRange.endOffset);
		    }
		    // We want to find a match that is completely
		    // visible, otherwise the view will scroll just a
		    // bit to fit the selection in completely.
		    keepSearching = (dir && sy.value < 0)
				     || (!dir && sy.value + sh.value >= gWin.innerHeight);
		}
	    } while (retRange && keepSearching);
	} else {
	    retRange = finder.Find(str, searchRange, startPt, endPt);
	}

	if (retRange) {
	    setSelection(retRange);
	    selectionRange = retRange.cloneRange();
	    // 	    highlightAllBut(str, retRange, color);
	} else {
	    
	}

	return selectionRange;
    } catch(e) { alert(e); }
}

function clearHighlight()
{
    var win = window._content; 
    var doc = win.document;
    if (!document)
	return;

    var elem = null;
    while ((elem = doc.getElementById("__conkeror-findbar-search-id"))) {
	var child = null;
	var docfrag = doc.createDocumentFragment();
	var next = elem.nextSibling;
	var parent = elem.parentNode;
	while((child = elem.firstChild)) {
	    docfrag.appendChild(child);
	}
	parent.removeChild(elem);
	parent.insertBefore(docfrag, next);
    }
}

function find(str, dir, pt)
{
    var matchRange;
    clearHighlight();

    // Should we wrap this time?
    var wrapped = lastFindState()["wrapped"];
    var point = pt;
    if (lastFindState()["wrapped"] == false 
	&& lastFindState()["range"] == null
	&& lastFindState()["search-str"] == str
	&& lastFindState()["direction"] == dir) {
	wrapped = true;
	point = null;
    }
    matchRange = highlightFind(str, "lightblue", wrapped, dir, point);
    if (matchRange == null) {
	addFindState (gWin.scrollX, gWin.scrollY, str, wrapped, point,
		      matchRange, lastFindState()["selection"], dir);
    } else {
	addFindState (gWin.scrollX, gWin.scrollY, str, wrapped,
		      point, matchRange, matchRange, dir);
    }
}

function onFindKeyPress(event)
{
    var updateFind = false;

    try {
    var findField = document.getElementById("input-field");

    if (event.keyCode == KeyEvent.DOM_VK_BACK_SPACE) {
	if (gFindState.length > 1) {
	    var state = gFindState.pop();
	    resumeFindState(lastFindState());
	}
    } else if (event.charCode == 114 && event.ctrlKey) { // C-r
	if (gFindState.length == 1) {
	    find(gLastSearch, false, lastFindState()["point"]);
	} else {
	    find(lastFindState()["search-str"], false, lastFindState()["range"]);
	}
	resumeFindState(lastFindState());
    } else if (event.charCode == 115 && event.ctrlKey) { // C-s
	if (gFindState.length == 1) {
	    find(gLastSearch, true, lastFindState()["point"]);
	} else {
	    find(lastFindState()["search-str"], true, lastFindState()["range"]);
	}
	resumeFindState(lastFindState());
    } else if (event.keyCode == KeyEvent.DOM_VK_ESCAPE
	       || (event.ctrlKey && (event.charCode == 103))) { // C-g
	gWin.scrollTo(gFindState[0]["screenx"], gFindState[0]["screeny"]);
	clearSelection();
	clearHighlight();
	closeFindBar();
    } else if (event.charCode && !event.ctrlKey && !event.altKey) {
	var str;
	str = lastFindState()["search-str"];
	str += String.fromCharCode(event.charCode);
	find(str, lastFindState()["direction"], lastFindState()["point"]);
	resumeFindState(lastFindState());
    } else {
	// Anything else closes i-search
	gLastSearch = lastFindState()["search-str"];
	clearHighlight();
	closeFindBar();
    }

    // We control what goes into the input box
    event.preventDefault();
    event.preventBubble();
    } catch (e) {alert(e);}
}


