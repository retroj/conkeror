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

// isearch

conkeror.isearch_active = false;

// The point we search from
var gLastSearch = "";

// The window to search in (which frame)
var gWin = null;
var gSelCtrl = null;

// The find engine
var gFastFind = null;

// A list of find states
var gFindState = [];

// Whether we're searching for links or text
var gLinksOnly = null;

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
    var label = document.getElementById("input-prompt");

    minibuffer.input.value = state["search-str"];
    if (state["selection"])
	setSelection(state["selection"]);
    else
	clearSelection();
    gWin.scrollTo(state["screenx"], state["screeny"]);

    label.value = (state["wrapped"] ? "Wrapped ":"") 
	+ (state["range"] ? "":"Failing ") + "I-Search" + (state["direction"]? "": " backward") + ":";
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
    gSelCtrl.setDisplaySelection(Components.interfaces.nsISelectionController.SELECTION_ATTENTION);
    gSelCtrl.repaintSelection(Components.interfaces.nsISelectionController.SELECTION_NORMAL);
    } catch(e) {alert(e);}

//     var bar = document.getElementById("find-toolbox");
//     var field = document.getElementById("find-field");
//     bar.hidden = false;
//     field.focus();

    // initialize our state list
    var state = createInitialFindState();
    gFindState = [];
    gFindState.push(state);
    conkeror.isearch_active = true;
    resumeFindState(state);
}

function focusFindBarBW()
{
    focusFindBar();
    lastFindState()["direction"] = false;
    resumeFindState(lastFindState());
}


function closeFindBar()
{
    gSelCtrl.setDisplaySelection(Components.interfaces.nsISelectionController.SELECTION_NORMAL);
    conkeror.isearch_active = false;
    closeInput(false);
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
    return null;
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

  // One last try
  return getBrowser().docShell
      .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
      .getInterface(Components.interfaces.nsISelectionDisplay)
      .QueryInterface(Components.interfaces.nsISelectionController);
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
		    var scp = sc.parentNode;
		    var ecp = ec.parentNode;
		    var sy1 = abs_point(scp).y;
		    var ey2 = abs_point(ecp).y + ecp.offsetHeight;

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
// 		    alert ("sy1: " + sy1 + " scry: " + gWin.scrollY);
// 		    alert ("ey2: " + ey2 + " bot: " + (gWin.scrollY + gWin.innerHeight));
		    keepSearching = (dir && sy1 < gWin.scrollY)
			|| (!dir && ey2 >= gWin.scrollY + gWin.innerHeight);
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
    return null;
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

function focusLink()
{
    var sel = gSelCtrl.getSelection(Components.interfaces.nsISelectionController.SELECTION_NORMAL);
    var node = sel.focusNode;
    if (node == null)
	return;
    
    do {
	if (node.localName == "A") {
	    if (node.hasAttributes && node.attributes.getNamedItem("href")) {
		Components.lookupMethod(node, "focus").call(node);
		return;
	    }
	}
    } while ((node = node.parentNode));
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


