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
function getFocusedSelCtrl(frame)
{
    var ds = frame.buffers.current.doc_shell;
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
  return frame.buffers.current.doc_shell
      .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
      .getInterface(Components.interfaces.nsISelectionDisplay)
      .QueryInterface(Components.interfaces.nsISelectionController);
}


function initial_isearch_state(window, forward)
{
    this.screenx = window.scrollX;
    this.screeny = window.scrollY;
    this.search_str = "";
    this.wrapped = false;
    this.point = null;
    this.range = window.document.createRange();
    this.selection = null;
    this.direction = forward;
}

function isearch_session(frame, forward)
{
    this.states = [];
    this.window = frame.buffers.current.focused_window();
    this.sel_ctrl = getFocusedSelCtrl(frame);
    this.sel_ctrl.setDisplaySelection(Components.interfaces.nsISelectionController.SELECTION_ATTENTION);
    this.sel_ctrl.repaintSelection(Components.interfaces.nsISelectionController.SELECTION_NORMAL);
    this.states.push(new initial_isearch_state(this.window, forward));
    this.frame = frame;

    minibuffer_state.call(this, isearch_keymap, "");
}
isearch_session.prototype = {
    constructor : isearch_session,
    __proto__ : minibuffer_state.prototype, // inherit from minibuffer_state

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
        var m = this.frame.minibuffer;
        var s = this.top;
        m._input_text = s.search_str;
        if (s.selection)
            this._set_selection(s.selection);
        else
            this._clear_selection();
        this.window.scrollTo(s.screenx, s.screeny);
        m.prompt = ((s.wrapped ? "Wrapped ":"")
                    + (s.range ? "" : "Failing ")
                    + "I-Search" + (s.direction? "": " backward") + ":");
    },
    _highlight_find : function (str, wrapped, dir, pt) {
        try {
            var doc = this.window.document;
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
                        keepSearching = (dir && sy1 < this.window.scrollY)
                            || (!dir && ey2 >= this.window.scrollY + this.window.innerHeight);
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
        } catch(e) { /* FIXME: figure out why this is needed*/ this.frame.alert(e); }
        return null;
    },

    find : function (str, dir, pt) {
        var s = this.top;

        // Should we wrap this time?
        var wrapped = s.wrapped;
        var point = pt;
        if (s.wrapped == false && s.range == null && s.search_str == str && s.direction == dir) {
            wrapped = true;
            point = null;
        }

        var match_range = this._highlight_find(str, wrapped, dir, point);

        var new_state = {
            screenx: this.window.scrollX, screeny: this.window.scrollY,
            search_str: str, wrapped: wrapped, point: point,
            range: match_range,
            selection: match_range ? match_range : s.selection,
            direction: dir
        };
        this.states.push(new_state);
    },

    focus_link : function ()
    {
        var sel = this.window.getSelection(Components.interfaces.nsISelectionController.SELECTION_NORMAL);
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

function isearch_continue(frame, direction) {
    var s = frame.minibuffer.current_state;
    if (!(s instanceof isearch_session))
        throw "Invalid minibuffer state";
    if (s.states.length == 1 && frame.isearch_last_search)
        s.find(frame.isearch_last_search, direction, s.top.point);
    else
        s.find(s.top.search_str, direction, s.top.range);
    s.restore_state();
}
interactive("isearch-continue-forward", isearch_continue, I.current_frame, true);
interactive("isearch-continue-backward", isearch_continue, I.current_frame, false);

function isearch_start (frame, direction)
{
    var s = new isearch_session(frame, direction);
    frame.minibuffer.push_state(s);
    s.restore_state();
}
interactive("isearch-forward", isearch_start, I.current_frame, true);
interactive("isearch-backward", isearch_start, I.current_frame, false);

function isearch_backspace (frame)
{
    var s = frame.minibuffer.current_state;
    if (!(s instanceof isearch_session))
        throw "Invalid minibuffer state";
    if (s.states.length > 1)
        s.states.pop();
    s.restore_state();
}
interactive("isearch-backspace", isearch_backspace, I.current_frame);

function isearch_abort (frame)
{
    var s = frame.minibuffer.current_state;
    if (!(s instanceof isearch_session))
        throw "Invalid minibuffer state";
    frame.minibuffer.pop_state();
    s.window.scrollTo(s.states[0].screenx, s.states[0].screeny);
    s._clear_selection();
}
interactive("isearch-abort", isearch_abort, I.current_frame);


function isearch_add_character (frame, event)
{
    var s = frame.minibuffer.current_state;
    if (!(s instanceof isearch_session))
        throw "Invalid minibuffer state";
    var str = s.top.search_str;
    str += String.fromCharCode(event.charCode);
    s.find(str, s.top.direction, s.top.point);
    s.restore_state();
}
interactive("isearch-add-character", isearch_add_character, I.current_frame, I.e);

function isearch_done (frame)
{
    var s = frame.minibuffer.current_state;
    if (!(s instanceof isearch_session))
        throw "Invalid minibuffer state";
    s.sel_ctrl.setDisplaySelection(Components.interfaces.nsISelectionController.SELECTION_NORMAL);
    frame.minibuffer.pop_state(false /* don't restore focus */);
    frame.isearch_last_search = s.top.search_str;
    s.focus_link();
    s._clear_selection();
}
interactive("isearch-done", isearch_done, I.current_frame);

