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

// turn on the selection in all frames
function getFocusedSelCtrl(window)
{
    var ds = window.buffers.current.doc_shell;
    var dsEnum = ds.getDocShellEnumerator(Components.interfaces.nsIDocShellTreeItem.typeContent,
                                          Components.interfaces.nsIDocShell.ENUMERATE_FORWARDS);
    while (dsEnum.hasMoreElements()) {
        ds = dsEnum.getNext().QueryInterface(Components.interfaces.nsIDocShell);
        if (ds.hasFocus) 
        {
            var display = ds.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                .getInterface(Components.interfaces.nsISelectionDisplay);
            if (!display)
                return null;
            return display.QueryInterface(Components.interfaces.nsISelectionController);
        }
    }

  // One last try
  return window.buffers.current.doc_shell
      .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
      .getInterface(Components.interfaces.nsISelectionDisplay)
      .QueryInterface(Components.interfaces.nsISelectionController);
}


function initial_isearch_state(frame, forward)
{
    this.screenx = frame.scrollX;
    this.screeny = frame.scrollY;
    this.search_str = "";
    this.wrapped = false;
    this.point = null;
    this.range = frame.document.createRange();
    this.selection = null;
    this.direction = forward;
}

function isearch_session(window, forward)
{
    this.states = [];
    this.frame = window.buffers.current.focused_frame;
    this.sel_ctrl = getFocusedSelCtrl(window);
    this.sel_ctrl.setDisplaySelection(Components.interfaces.nsISelectionController.SELECTION_ATTENTION);
    this.sel_ctrl.repaintSelection(Components.interfaces.nsISelectionController.SELECTION_NORMAL);
    this.states.push(new initial_isearch_state(this.frame, forward));
    this.window = window;

    minibuffer_input_state.call(this, isearch_keymap, "");
}
isearch_session.prototype = {
    constructor : isearch_session,
    __proto__ : minibuffer_input_state.prototype, // inherit from minibuffer_state

    get top () {
        return this.states[this.states.length - 1];
    },
    _set_selection : function (range)
    {
        try {
            const selctrlcomp = Components.interfaces.nsISelectionController;
            var sel = this.sel_ctrl.getSelection(selctrlcomp.SELECTION_NORMAL);
            sel.removeAllRanges();
            sel.addRange(range.cloneRange());
            this.sel_ctrl.scrollSelectionIntoView(selctrlcomp.SELECTION_NORMAL,
                                                  selctrlcomp.SELECTION_FOCUS_REGION,
                                                  true);
        } catch(e) {/*FIXME:figure out if/why this is needed*/ dumpln("setSelection: " + e);}
    },
    _clear_selection : function ()
    {
        const selctrlcomp = Components.interfaces.nsISelectionController;
        var sel = this.sel_ctrl.getSelection(selctrlcomp.SELECTION_NORMAL);
        sel.removeAllRanges();
    },
    restore_state: function () {
        var m = this.window.minibuffer;
        var s = this.top;
        m._input_text = s.search_str;
        if (s.selection)
            this._set_selection(s.selection);
        else
            this._clear_selection();
        this.frame.scrollTo(s.screenx, s.screeny);
        m.prompt = ((s.wrapped ? "Wrapped ":"")
                    + (s.range ? "" : "Failing ")
                    + "I-Search" + (s.direction? "": " backward") + ":");
    },
    _highlight_find : function (str, wrapped, dir, pt) {
        try {
            var doc = this.frame.document;
            var finder = (Components.classes["@mozilla.org/embedcomp/rangefind;1"].createInstance()
                          .QueryInterface(Components.interfaces.nsIFind));
            var searchRange;
            var startPt;
            var endPt;
            var body = doc.documentElement;

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
                        keepSearching = (dir && sy1 < this.frame.scrollY)
                            || (!dir && ey2 >= this.frame.scrollY + this.frame.innerHeight);
                    }
                } while (retRange && keepSearching);
            } else {
                retRange = finder.Find(str, searchRange, startPt, endPt);
            }

            if (retRange) {
                this._set_selection(retRange);
                selectionRange = retRange.cloneRange();
            } else {
	    
            }

            return selectionRange;
        } catch(e) { /* FIXME: figure out why this is needed*/ this.window.alert(e); }
        return null;
    },

    find : function (str, dir, pt) {
        var s = this.top;

        if (str == null || str.length == 0)
            return;

        // Should we wrap this time?
        var wrapped = s.wrapped;
        var point = pt;
        if (s.wrapped == false && s.range == null && s.search_str == str && s.direction == dir) {
            wrapped = true;
            point = null;
        }

        var match_range = this._highlight_find(str, wrapped, dir, point);

        var new_state = {
            screenx: this.frame.scrollX, screeny: this.frame.scrollY,
            search_str: str, wrapped: wrapped, point: point,
            range: match_range,
            selection: match_range ? match_range : s.selection,
            direction: dir
        };
        this.states.push(new_state);
    },

    focus_link : function ()
    {
        var sel = this.frame.getSelection(Components.interfaces.nsISelectionController.SELECTION_NORMAL);
        if (!sel)
            return;
        var node = sel.focusNode;
        if (node == null)
            return;
    
        do {
            if (node.localName == "A") {
                if (node.hasAttributes && node.attributes.getNamedItem("href")) {
                    /* FIXME: This shouldn't be needed anymore, due to
                     * better xpc wrappers */
                    Components.lookupMethod(node, "focus").call(node);
                    return;
                }
            }
        } while ((node = node.parentNode));
    }
};

function isearch_continue(window, direction) {
    var s = window.minibuffer.current_state;
    if (!(s instanceof isearch_session))
        throw "Invalid minibuffer state";
    if (s.states.length == 1 && window.isearch_last_search)
        s.find(window.isearch_last_search, direction, s.top.point);
    else
        s.find(s.top.search_str, direction, s.top.range);
    s.restore_state();
}
interactive("isearch-continue-forward", function (I) {isearch_continue(I.window, true);});
interactive("isearch-continue-backward", function (I) {isearch_continue(I.window, false);});

function isearch_start (window, direction)
{
    var s = new isearch_session(window, direction);
    window.minibuffer.push_state(s);
    s.restore_state();
}
interactive("isearch-forward", function (I) {isearch_start(I.window, true);});
interactive("isearch-backward", function (I) {isearch_start(I.window, false);});

function isearch_backspace (window)
{
    var s = window.minibuffer.current_state;
    if (!(s instanceof isearch_session))
        throw "Invalid minibuffer state";
    if (s.states.length > 1)
        s.states.pop();
    s.restore_state();
}
interactive("isearch-backspace", function (I) {isearch_backspace(I.window);});

/* FIXME: do this stuff in .destroy instead */
function isearch_abort (window)
{
    var s = window.minibuffer.current_state;
    if (!(s instanceof isearch_session))
        throw "Invalid minibuffer state";
    window.minibuffer.pop_state();
    s.frame.scrollTo(s.states[0].screenx, s.states[0].screeny);
    s._clear_selection();
}
interactive("isearch-abort", function(I) {isearch_abort(I.window);});


function isearch_add_character (window, event)
{
    var s = window.minibuffer.current_state;
    if (!(s instanceof isearch_session))
        throw "Invalid minibuffer state";
    var str = s.top.search_str;
    str += String.fromCharCode(event.charCode);
    s.find(str, s.top.direction, s.top.point);
    s.restore_state();
}
interactive("isearch-add-character", function (I) {isearch_add_character(I.window, I.event);});

function isearch_done (window)
{
    var s = window.minibuffer.current_state;
    if (!(s instanceof isearch_session))
        throw "Invalid minibuffer state";
    s.sel_ctrl.setDisplaySelection(Components.interfaces.nsISelectionController.SELECTION_NORMAL);

    // Prevent focus from being reverted
    window.minibuffer.saved_focused_element = null;
    window.minibuffer.saved_focused_window = null;

    window.minibuffer.pop_state();
    window.isearch_last_search = s.top.search_str;
    s.focus_link();
    s._clear_selection();
}
interactive("isearch-done", function (I) {isearch_done(I.window);});
