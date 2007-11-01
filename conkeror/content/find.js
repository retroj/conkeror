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

// FIXME: There is no reason to create a state as an Array, since we
// only use it as an Object.  Also, we should use . syntax rather than
// [] syntax.

function createInitialFindState(window)
{
    var state = new Array();
    state["screenx"] = window.gWin.scrollX;
    state["screeny"] = window.gWin.scrollY;
    state["search-str"] = "";
    state["wrapped"] = false;
    state["point"] = null;
    state["range"] = window.document.createRange();
    state["selection"] = null;
    state["direction"] = true;
    return state;
}

function addFindState(window, screenX, screenY, searchStr, wrapped, point, range, selection, direction)
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
    window.gFindState.push(state);
}

function resumeFindState(window, state)
{
    var label = window.document.getElementById("input-prompt");

    window.minibuffer.input.value = state["search-str"];
    if (state["selection"])
      setSelection(window, state["selection"]);
    else
      clearSelection(window);
    window.gWin.scrollTo(state["screenx"], state["screeny"]);

    label.value = (state["wrapped"] ? "Wrapped ":"") 
	+ (state["range"] ? "":"Failing ") + "I-Search" + (state["direction"]? "": " backward") + ":";
}

function lastFindState(window)
{
    return window.gFindState[window.gFindState.length-1];
}

function focusFindBar(window)
{
    try {
    window.gWin = window.document.commandDispatcher.focusedWindow;
    window.gSelCtrl = getFocusedSelCtrl(window);
    window.gSelCtrl.setDisplaySelection(Components.interfaces.nsISelectionController.SELECTION_ATTENTION);
    window.gSelCtrl.repaintSelection(Components.interfaces.nsISelectionController.SELECTION_NORMAL);
    } catch(e) {window.alert(e);}

//     var bar = document.getElementById("find-toolbox");
//     var field = document.getElementById("find-field");
//     bar.hidden = false;
//     field.focus();

    // initialize our state list
    var state = createInitialFindState(window);
    window.gFindState = [];
    window.gFindState.push(state);
    window.isearch_active = true;
    resumeFindState(window, state);
}

function focusFindBarBW(window)
{
    focusFindBar(window);
    lastFindState()["direction"] = false;
    resumeFindState(window, lastFindState());
}


function closeFindBar(window)
{
    window.gSelCtrl.setDisplaySelection(Components.interfaces.nsISelectionController.SELECTION_NORMAL);
    window.isearch_active = false;
    window.closeInput(false);
}

function getSelectionController(window)
{
//     var ds = window._content.frames[0].docShell;
  var ds = window.getBrowser().docShell;
//   var frame = gBrowser.docShell.presShell.getRootFrame();
//     var ds = window._content.frames[0].docShell;

  var display = ds.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsISelectionDisplay);
  if (!display)
    return null;
  return display.QueryInterface(Components.interfaces.nsISelectionController);
}

// turn on the selection in all frames
function getFocusedSelCtrl(window)
{
  var ds = window.getBrowser().docShell;
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
  return window.getBrowser().docShell
      .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
      .getInterface(Components.interfaces.nsISelectionDisplay)
      .QueryInterface(Components.interfaces.nsISelectionController);
}

// Select the range and scroll it into view
function clearSelection(window)
{
    var selctrl = window.gSelCtrl;
    var sel = selctrl.getSelection(Components.interfaces.nsISelectionController.SELECTION_NORMAL);
    sel.removeAllRanges();
}

function setSelection(window, range)
{
    try {
	var selctrlcomp = Components.interfaces.nsISelectionController;
	var selctrl = window.gSelCtrl;
	var sel = selctrl.getSelection(selctrlcomp.SELECTION_NORMAL);
	sel.removeAllRanges();
	sel.addRange(range.cloneRange());

	selctrl.scrollSelectionIntoView(selctrlcomp.SELECTION_NORMAL,
					selctrlcomp.SELECTION_FOCUS_REGION,
				     true);
    } catch(e) {window.alert("setSelection: " + e);}
}

// Highlight find matches and move selection to the first occurrence
// starting from pt.
function highlightFind(window, str, color, wrapped, dir, pt)
{
    try {
	var doc = window.gWin.document;
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
		    var sy1 = window.abs_point(scp).y;
		    var ey2 = window.abs_point(ecp).y + ecp.offsetHeight;

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
		    keepSearching = (dir && sy1 < window.gWin.scrollY)
			|| (!dir && ey2 >= window.gWin.scrollY + window.gWin.innerHeight);
		}
	    } while (retRange && keepSearching);
	} else {
	    retRange = finder.Find(str, searchRange, startPt, endPt);
	}

	if (retRange) {
      setSelection(window, retRange);
	    selectionRange = retRange.cloneRange();
	    // 	    highlightAllBut(str, retRange, color);
	} else {
	    
	}

	return selectionRange;
    } catch(e) { window.alert(e); }
    return null;
}

function clearHighlight(window)
{
    var win = window.content; 
    var doc = win.document;
    if (!doc)
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

function focusLink(window)
{
    var sel = window.gSelCtrl.getSelection(Components.interfaces.nsISelectionController.SELECTION_NORMAL);
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

function find(window, str, dir, pt)
{
    var matchRange;
    clearHighlight(window);

    var lastState = lastFindState(window);

    // Should we wrap this time?
    var wrapped = lastState["wrapped"];
    var point = pt;
    if (lastState["wrapped"] == false 
        && lastState["range"] == null
        && lastState["search-str"] == str
        && lastState["direction"] == dir) {
      wrapped = true;
      point = null;
    }
    matchRange = highlightFind(window, str, "lightblue", wrapped, dir, point);
    if (matchRange == null) {
      addFindState (window, window.gWin.scrollX, window.gWin.scrollY, str, wrapped, point,
                    matchRange, lastFindState(window)["selection"], dir);
    } else {
      addFindState (window, window.gWin.scrollX, window.gWin.scrollY, str, wrapped,
                    point, matchRange, matchRange, dir);
    }
}

