/**
 * (C) Copyright 2004-2005 Shawn Betts
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 * (C) Copyright 2008 Nelson Elhage
 * (C) Copyright 2008-2010 John Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

define_variable("isearch_keep_selection", false,
    "Set to `true' to make isearch leave the selection visible when a "+
    "search is completed.");


function initial_isearch_state (buffer, frame, forward) {
    this.screenx = frame.scrollX;
    this.screeny = frame.scrollY;
    this.search_str = "";
    this.wrapped = false;
    let sel = frame.getSelection(Ci.nsISelectionController.SELECTION_NORMAL);
    if (sel.rangeCount > 0) {
        this.point = sel.getRangeAt(0);
        if (caret_enabled(buffer))
            this.caret = this.point.cloneRange();
    } else {
        this.point = null;
    }
    this.range = frame.document.createRange();
    this.selection = null;
    this.direction = forward;
}

function isearch_session (minibuffer, forward) {
    minibuffer_input_state.call(this, minibuffer, isearch_keymap, "");
    this.states = [];
    this.buffer = this.minibuffer.window.buffers.current;
    this.frame = this.buffer.focused_frame;
    this.sel_ctrl = this.buffer.focused_selection_controller;
    this.sel_ctrl.setDisplaySelection(Ci.nsISelectionController.SELECTION_ATTENTION);
    this.sel_ctrl.repaintSelection(Ci.nsISelectionController.SELECTION_NORMAL);
    this.states.push(new initial_isearch_state(this.buffer, this.frame, forward));
}
isearch_session.prototype = {
    constructor: isearch_session,
    __proto__: minibuffer_input_state.prototype,

    get top () {
        return this.states[this.states.length - 1];
    },
    _set_selection: function (range) {
        const selctrlcomp = Ci.nsISelectionController;
        var sel = this.sel_ctrl.getSelection(selctrlcomp.SELECTION_NORMAL);
        sel.removeAllRanges();
        sel.addRange(range.cloneRange());
        this.sel_ctrl.scrollSelectionIntoView(selctrlcomp.SELECTION_NORMAL,
                                              selctrlcomp.SELECTION_FOCUS_REGION,
                                              true);
    },
    _clear_selection: function () {
        const selctrlcomp = Ci.nsISelectionController;
        var sel = this.sel_ctrl.getSelection(selctrlcomp.SELECTION_NORMAL);
        sel.removeAllRanges();
    },
    restore_state: function () {
        var m = this.minibuffer;
        var s = this.top;
        m.ignore_input_events = true;
        m._input_text = s.search_str;
        m.ignore_input_events = false;
        if (s.selection)
            this._set_selection(s.selection);
        else
            this._clear_selection();
        this.frame.scrollTo(s.screenx, s.screeny);
        m.prompt = ((s.wrapped ? "Wrapped ":"")
                    + (s.range ? "" : "Failing ")
                    + "I-Search" + (s.direction? "": " backward") + ":");
    },
    _highlight_find: function (str, wrapped, dir, pt) {
        var doc = this.frame.document;
        var finder = (Cc["@mozilla.org/embedcomp/rangefind;1"]
                      .createInstance()
                      .QueryInterface(Ci.nsIFind));
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
        }

        return selectionRange;
    },

    find: function (str, dir, pt) {
        var s = this.top;

        if (str == null || str.length == 0)
            return;

        // Should we wrap this time?
        var wrapped = s.wrapped;
        var point = pt;
        if (s.wrapped == false && s.range == null
            && s.search_str == str && s.direction == dir)
        {
            wrapped = true;
            point = null;
        }

        var match_range = this._highlight_find(str, wrapped, dir, point);

        var new_state = {
            screenx: this.frame.scrollX,
            screeny: this.frame.scrollY,
            search_str: str,
            wrapped: wrapped,
            point: point,
            range: match_range,
            selection: match_range ? match_range : s.selection,
            direction: dir
        };
        this.states.push(new_state);
    },

    focus_link: function () {
        var sel = this.frame.getSelection(Ci.nsISelectionController.SELECTION_NORMAL);
        if (!sel)
            return;
        var node = sel.focusNode;
        if (node == null)
            return;
        do {
            if (node.localName && node.localName.toLowerCase() == "a") {
                if (node.hasAttributes && node.attributes.getNamedItem("href")) {
                    // if there is a selection, preserve it.  it is up
                    // to the caller to decide whether or not to keep
                    // the selection.
                    var sel = this.frame.getSelection(
                        Ci.nsISelectionController.SELECTION_NORMAL);
                    if (sel.rangeCount > 0)
                        var stored_selection = sel.getRangeAt(0).cloneRange();
                    node.focus();
                    if (stored_selection) {
                        sel.removeAllRanges();
                        sel.addRange(stored_selection);
                    }
                    return;
                }
            }
        } while ((node = node.parentNode));
    },

    collapse_selection: function() {
        const selctrlcomp = Ci.nsISelectionController;
        var sel = this.sel_ctrl.getSelection(selctrlcomp.SELECTION_NORMAL);
        if (sel.rangeCount > 0)
            sel.getRangeAt(0).collapse(true);
    },

    handle_input: function (m) {
        m._set_selection();
        this.find(m._input_text, this.top.direction, this.top.point);
        this.restore_state();
    },

    done: false,

    destroy: function () {
        if (! this.done) {
            this.frame.scrollTo(this.states[0].screenx, this.states[0].screeny);
            if (caret_enabled(this.buffer) && this.states[0].caret)
                this._set_selection(this.states[0].caret);
            else
                this._clear_selection();
        }
        minibuffer_input_state.prototype.destroy.call(this);
    }
};

function isearch_continue_noninteractively (window, direction) {
    var s = new isearch_session(window.minibuffer, direction);
    if (window.isearch_last_search)
        s.find(window.isearch_last_search, direction, s.top.point);
    else
        throw "No previous isearch";
    window.minibuffer.push_state(s);
    s.restore_state();
    // if (direction && s.top.point !== null)
    //    isearch_continue (window, direction);
    isearch_done(window, true);
}

function isearch_continue (window, direction) {
    var s = window.minibuffer.current_state;
    // if the minibuffer is not open, this command operates in
    // non-interactive mode.
    if (s == null)
        return isearch_continue_noninteractively(window, direction);
    if (!(s instanceof isearch_session))
        throw "Invalid minibuffer state";
    if (s.states.length == 1 && window.isearch_last_search)
        s.find(window.isearch_last_search, direction, s.top.point);
    else
        s.find(s.top.search_str, direction, s.top.range);
    return s.restore_state();
}
interactive("isearch-continue-forward", null,
            function (I) { isearch_continue(I.window, true); });
interactive("isearch-continue-backward", null,
            function (I) { isearch_continue(I.window, false); });

function isearch_start (window, direction) {
    var s = new isearch_session(window.minibuffer, direction);
    window.minibuffer.push_state(s);
    s.restore_state();
}
interactive("isearch-forward", null,
            function (I) { isearch_start(I.window, true); });
interactive("isearch-backward", null,
            function (I) { isearch_start(I.window, false); });

function isearch_backspace (window) {
    var s = window.minibuffer.current_state;
    if (!(s instanceof isearch_session))
        throw "Invalid minibuffer state";
    if (s.states.length > 1)
        s.states.pop();
    s.restore_state();
}
interactive("isearch-backspace", null,
            function (I) { isearch_backspace(I.window); });

function isearch_done (window, keep_selection) {
    var s = window.minibuffer.current_state;
    if (!(s instanceof isearch_session))
        throw "Invalid minibuffer state";
    s.sel_ctrl.setDisplaySelection(Ci.nsISelectionController.SELECTION_NORMAL);

    // Prevent focus from being reverted
    window.minibuffer.saved_focused_element = null;
    window.minibuffer.saved_focused_window = null;

    s.done = true;

    window.minibuffer.pop_state();
    window.isearch_last_search = s.top.search_str;
    s.focus_link();
    if (! isearch_keep_selection && ! keep_selection)
        s.collapse_selection();
}
interactive("isearch-done", null,
            function (I) { isearch_done(I.window); });

provide("isearch");
