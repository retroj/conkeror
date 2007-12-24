
function exit_minibuffer(frame)
{
    var m = frame.minibuffer;
    var s = m.current_state;
    if (!(s instanceof text_entry_minibuffer_state))
        throw "Invalid minibuffer state";

    var val = trim_whitespace(m._input_text);
    var match = null;

    /* FIXME: this is only for old completion junk */
    if (s instanceof completion_minibuffer_state) {
        if (val.length == 0 && s.default_match != null)
            val = s.default_match;
        match = find_complete_match(s.completions, val);
        if (!match && !s.allow_non_matches)
            return;
    } else
        match = val;

    if (s.completer && s.match_required) {
        var e = s.completions_display_element;
        var i = e.currentIndex;
        if (i == -1)
            return;
        var c = s.completions;
        var x = c.data[i];
        if (c.get_value)
            match = c.get_value(x);
        else
            match = x;
    }

    if (s.history)
    {
        s.history.push(val);
        if (s.history.length > minibuffer_history_max_items)
            s.history.splice(0, s.history.length - minibuffer_history_max_items);
    }
    m.pop_state();
    if (s.callback) {
        if (s instanceof completion_minibuffer_state) {
            if (s.allow_non_matches)
                s.callback(match, val);
            else // match must be non-null because of previous check
                s.callback(match);
        }
        else if (s.match_required)
            s.callback(match);
        else
            s.callback(val);
    }
}
interactive("exit-minibuffer", exit_minibuffer, I.current_frame);

function minibuffer_history_next (frame)
{
    var m = frame.minibuffer;
    var s = m.current_state;
    if (!(s instanceof text_entry_minibuffer_state))
        throw "Invalid minibuffer state";
    if (!s.history)
        return;
    m._ensure_input_area_showing();
    s.history_index = Math.min(s.history_index + 1, s.history.length - 1);
    m._input_text = s.history[s.history_index];
    m._set_selection();
}
interactive("minibuffer-history-next", minibuffer_history_next, I.current_frame);

function minibuffer_history_previous (frame)
{
    var m = frame.minibuffer;
    var s = m.current_state;
    if (!(s instanceof text_entry_minibuffer_state))
        throw "Invalid minibuffer state";
    if (!s.history)
        return;
    m._ensure_input_area_showing();
    s.history_index = Math.max(s.history_index - 1, 0);
    m._input_text = s.history[s.history_index];
    m._set_selection();
}
interactive("minibuffer-history-previous", minibuffer_history_previous, I.current_frame);

function minibuffer_abort (frame)
{
    var m = frame.minibuffer;
    var s = m.current_state;
    if (!(s instanceof text_entry_minibuffer_state))
        throw "Invalid minibuffer state";
    if (s.abort_callback)
        s.abort_callback();
    m.pop_state();
}
interactive("minibuffer-abort", minibuffer_abort, I.current_frame);

function minibuffer_do_command(frame, command) {
    try {
        var m = frame.minibuffer;
        if (m._input_mode_enabled)
        {
            m._ensure_input_area_showing();
            var e = m.input_element;
            var c = e.controllers.getControllerForCommand(command);
            if (c && c.isCommandEnabled(command))
                c.doCommand(command);
            var s = m.current_state;
            if ((s instanceof text_entry_minibuffer_state))
            {
                s.update_completions(frame);
            }
        }
    } catch (e)
    {
        dumpln("minibuffer_do_command: " + e);
    }
}

/* FIXME: These should all be defined more compactly using a loop */
interactive("minibuffer-cmd_beginLine", minibuffer_do_command, I.current_frame, 'cmd_beginLine');
interactive("minibuffer-cmd_copy", minibuffer_do_command, I.current_frame, 'cmd_copy');
interactive("minibuffer-cmd_copyOrDelete", minibuffer_do_command, I.current_frame, 'cmd_copyOrDelete');
interactive("minibuffer-cmd_cut", minibuffer_do_command, I.current_frame, 'cmd_cut');
interactive("minibuffer-cmd_cutOrDelete", minibuffer_do_command, I.current_frame, 'cmd_cutOrDelete');
interactive("minibuffer-cmd_deleteToBeginningOfLine", minibuffer_do_command, I.current_frame, 'cmd_deleteToBeginningOfLine');
interactive("minibuffer-cmd_deleteToEndOfLine", minibuffer_do_command, I.current_frame, 'cmd_deleteToEndOfLine');
interactive("minibuffer-cmd_endLine", minibuffer_do_command, I.current_frame, 'cmd_endLine');
interactive("minibuffer-cmd_moveTop", minibuffer_do_command, I.current_frame, 'cmd_moveTop');
interactive("minibuffer-cmd_moveBottom", minibuffer_do_command, I.current_frame, 'cmd_moveBottom');
interactive("minibuffer-cmd_selectAll", minibuffer_do_command, I.current_frame, 'cmd_selectAll');
interactive("minibuffer-cmd_selectBeginLine", minibuffer_do_command, I.current_frame, 'cmd_selectBeginLine');
interactive("minibuffer-cmd_selectBottom", minibuffer_do_command, I.current_frame, 'cmd_selectBottom');
interactive("minibuffer-cmd_selectEndLine", minibuffer_do_command, I.current_frame, 'cmd_selectEndLine');
interactive("minibuffer-cmd_selectTop", minibuffer_do_command, I.current_frame, 'cmd_selectTop');
interactive("minibuffer-cmd_scrollBeginLine", minibuffer_do_command, I.current_frame, 'cmd_scrollBeginLine');
interactive("minibuffer-cmd_scrollEndLine", minibuffer_do_command, I.current_frame, 'cmd_scrollEndLine');
interactive("minibuffer-cmd_scrollTop", minibuffer_do_command, I.current_frame, 'cmd_scrollTop');
interactive("minibuffer-cmd_scrollBottom", minibuffer_do_command, I.current_frame, 'cmd_scrollBottom');

interactive("minibuffer-cmd_charNext", do_N_times, minibuffer_do_command, I.p, I.current_frame, 'cmd_charNext');
interactive("minibuffer-cmd_charPrevious", do_N_times, minibuffer_do_command, I.p, I.current_frame, 'cmd_charPrevious');
interactive("minibuffer-cmd_deleteCharBackward", do_N_times, minibuffer_do_command, I.p, I.current_frame, 'cmd_deleteCharBackward');
interactive("minibuffer-cmd_deleteCharForward", do_N_times, minibuffer_do_command, I.p, I.current_frame, 'cmd_deleteCharForward');
interactive("minibuffer-cmd_deleteWordBackward", do_N_times, minibuffer_do_command, I.p, I.current_frame, 'cmd_deleteWordBackward');
interactive("minibuffer-cmd_deleteWordForward", do_N_times, minibuffer_do_command, I.p, I.current_frame, 'cmd_deleteWordForward');
interactive("minibuffer-cmd_lineNext", do_N_times, minibuffer_do_command, I.p, I.current_frame, 'cmd_lineNext');
interactive("minibuffer-cmd_linePrevious", do_N_times, minibuffer_do_command, I.p, I.current_frame, 'cmd_linePrevious');
interactive("minibuffer-cmd_movePageDown", do_N_times, minibuffer_do_command, I.p, I.current_frame, 'cmd_movePageDown');
interactive("minibuffer-cmd_movePageUp", do_N_times, minibuffer_do_command, I.p, I.current_frame, 'cmd_movePageUp');
interactive("minibuffer-cmd_redo", do_N_times, minibuffer_do_command, I.p, I.current_frame, 'cmd_redo');
interactive("minibuffer-cmd_selectCharNext", do_N_times, minibuffer_do_command, I.p, I.current_frame, 'cmd_selectCharNext');
interactive("minibuffer-cmd_selectCharPrevious", do_N_times, minibuffer_do_command, I.p, I.current_frame, 'cmd_selectCharPrevious');
interactive("minibuffer-cmd_selectLineNext", do_N_times, minibuffer_do_command, I.p, I.current_frame, 'cmd_selectLineNext');
interactive("minibuffer-cmd_selectLinePrevious", do_N_times, minibuffer_do_command, I.p, I.current_frame, 'cmd_selectLinePrevious');
interactive("minibuffer-cmd_selectPageDown", do_N_times, minibuffer_do_command, I.p, I.current_frame, 'cmd_selectPageDown');
interactive("minibuffer-cmd_selectPageUp", do_N_times, minibuffer_do_command, I.p, I.current_frame, 'cmd_selectPageUp');
interactive("minibuffer-cmd_selectWordNext", do_N_times, minibuffer_do_command, I.p, I.current_frame, 'cmd_selectWordNext');
interactive("minibuffer-cmd_selectWordPrevious", do_N_times, minibuffer_do_command, I.p, I.current_frame, 'cmd_selectWordPrevious');
interactive("minibuffer-cmd_undo", do_N_times, minibuffer_do_command, I.p, I.current_frame, 'cmd_undo');
interactive("minibuffer-cmd_wordNext", do_N_times, minibuffer_do_command, I.p, I.current_frame, 'cmd_wordNext');
interactive("minibuffer-cmd_wordPrevious", do_N_times, minibuffer_do_command, I.p, I.current_frame, 'cmd_wordPrevious');
interactive("minibuffer-cmd_scrollPageUp", do_N_times, minibuffer_do_command, I.p, I.current_frame, 'cmd_scrollPageUp');
interactive("minibuffer-cmd_scrollPageDown", do_N_times, minibuffer_do_command, I.p, I.current_frame, 'cmd_scrollPageDown');
interactive("minibuffer-cmd_scrollLineUp", do_N_times, minibuffer_do_command, I.p, I.current_frame, 'cmd_scrollLineUp');
interactive("minibuffer-cmd_scrollLineDown", do_N_times, minibuffer_do_command, I.p, I.current_frame, 'cmd_scrollLineDown');
interactive("minibuffer-cmd_scrollLeft", do_N_times, minibuffer_do_command, I.p, I.current_frame, 'cmd_scrollLeft');
interactive("minibuffer-cmd_scrollRight", do_N_times, minibuffer_do_command, I.p, I.current_frame, 'cmd_scrollRight');
interactive("minibuffer-cmd_paste", do_N_times, minibuffer_do_command, I.p, I.current_frame, 'cmd_paste');

function minibuffer_insert_character(frame, n, event)
{
    var m = frame.minibuffer;
    var s = m.current_state;
    if (!(s instanceof basic_minibuffer_state))
        throw "Invalid minibuffer state";
    m._ensure_input_area_showing();
    var val = m._input_text;
    var sel_start = m._selection_start;
    var sel_end = m._selection_end;
    var insert = String.fromCharCode(event.charCode);
    var out = val.substr(0, sel_start);
    for (var i = 0; i < n; ++i)
        out += insert;
    out += val.substr(sel_end);
    m._input_text = out;
    var new_sel = sel_end + n;
    m._set_selection(new_sel, new_sel);

    if (s instanceof text_entry_minibuffer_state)
        s.update_completions(frame);
}
interactive("minibuffer-insert-character", minibuffer_insert_character,
            I.current_frame, I.p, I.e);

var minibuffer_history_data = new string_hashmap();

/* FIXME: These should possibly be saved to disk somewhere */
/* USER PREFERENCE */
var minibuffer_history_max_items = 100;


function minibuffer_state(keymap, prompt, input, selection_start, selection_end)
{
    this.keymap = keymap;
    this.prompt = prompt;
    if (input)
        this.input = input;
    else
        this.input = "";
    if (selection_start)
        this.selection_start = selection_start;
    else
        this.selection_start = 0;
    if (selection_end)
        this.selection_end = selection_end;
    else
        this.selection_end = this.selection_start;
}
minibuffer_state.prototype.load = function () {}
minibuffer_state.prototype.unload = function () {}
minibuffer_state.prototype.destroy = function () {}

/**
 * The parameter `args' is an object specifying the arguments for
 * basic_minibuffer_state.  The following properties of args must/may
 * be set:
 *
 * prompt:            [required]
 *
 * initial_value:     [optional] specifies the initial text
 *
 * select:            [optional] specifies to select the initial text if set to non-null
 */
define_keywords("$prompt", "$initial_value", "$select");
function basic_minibuffer_state()
{
    keywords(arguments, $initial_value = "");
    var sel_start, sel_end;
    if (arguments.$select)
    {
        sel_start = 0;
        sel_end = arguments.$initial_value.length;
    } else {
        sel_start = sel_end = arguments.$initial_value.length;
    }
    minibuffer_state.call(this, minibuffer_base_keymap,
                          arguments.$prompt, arguments.$initial_value,
                          sel_start, sel_end);
}
basic_minibuffer_state.prototype.__proto__ = minibuffer_state.prototype; // inherit from minibuffer_state

/* The parameter `args' specifies the arguments.  In addition, the
 * arguments for basic_minibuffer_state are also allowed.
 *
 * history:           [optional] specifies a string to identify the history list to use
 *
 * callback:          [optional] function called once the user successfully enters a value; it is 
 *                               called with the value entered by the user.
 *
 * abort_callback:    [optional] called if the operaion is aborted
 *
 * completer
 *
 * match_required
 *
 * default_completion  only used if match_required is set to true
 */
define_keywords("$callback", "$abort_callback", "$history", "$completer", "$match_required", "$default_completion");
function text_entry_minibuffer_state() {
    keywords(arguments);

    basic_minibuffer_state.call(this, forward_keywords(arguments));
    this.keymap = minibuffer_keymap;
    
    this.callback = arguments.$callback;
    this.abort_callback = arguments.$abort_callback;
    if (arguments.$history)
    {
        this.history = minibuffer_history_data.get_put_default(arguments.$history, []);
        this.history_index = this.history.length;
    }

    this.completer = arguments.$completer;
    if (this.completer)
    {
        this.completions = this.completer(this.input, this.selection_start);
        this.completions_valid = true;
        this.completions_timer_ID = null;
        this.completions_display_element = null;
    }

    this.match_required  = arguments.$match_required ? true : false;
    if (this.match_required)
        this.default_completion = arguments.$default_completion;
}

function completions_tree_view(minibuffer_state)
{
    this.minibuffer_state = minibuffer_state;
}

var atom_service = Cc["@mozilla.org/atom-service;1"].getService(Ci.nsIAtomService);

completions_tree_view.prototype = {
    get rowCount () {
        var c = this.minibuffer_state.completions;
        if (!c)
            return 0;
        return c.data.length;
    },
    getCellText : function(row,column){
        var c = this.minibuffer_state.completions;
        if (row >= c.data.length)
            return null;
        if (column.index == 0)
            return c.get_string(c.data[row]);
        return c.get_description(c.data[row]);
    },
    setTree : function(treebox){ this.treebox = treebox; },
    isContainer: function(row){ return false; },
    isSeparator: function(row){ return false; },
    isSorted: function(){ return false; },
    getLevel: function(row){ return 0; },
    getImageSrc: function(row,col){ return null; },
    getRowProperties: function(row,props){},
    getCellProperties: function(row,col,props){
        if (col.index == 0)
            props.AppendElement(atom_service.getAtom("completion-string"));
        else
            props.AppendElement(atom_service.getAtom("completion-description"));
    },
    getColumnProperties: function(colid,col,props){}
};

// inherit from basic_minibuffer_state
text_entry_minibuffer_state.prototype = {
    __proto__: basic_minibuffer_state.prototype,
    load : function (frame) {

        if (this.completer) {
            // Create completion display element if needed
            if (!this.completion_element)
            {
                var insert_before = frame.document.getElementById("minibuffer");
                var tree = create_XUL(frame, "tree");
                var s = this;
                tree.addEventListener("select", function () { s.completion_selected(frame); }, true, false);
                tree.setAttribute("class", "completions");

                tree.setAttribute("rows", "8");

                tree.setAttribute("collapsed", "true");

                tree.setAttribute("hidecolumnpicker", "true");
                tree.setAttribute("hideheader", "true");

                var treecols = create_XUL(frame, "treecols");
                tree.appendChild(treecols);
                var treecol = create_XUL(frame, "treecol");
                treecol.setAttribute("flex", "1");
                treecols.appendChild(treecol);
                treecol = create_XUL(frame, "treecol");
                treecol.setAttribute("flex", "1");
                treecols.appendChild(treecol);
                tree.appendChild(create_XUL(frame, "treechildren"));

                insert_before.parentNode.insertBefore(tree, insert_before);
                tree.view = new completions_tree_view(this);
                this.completions_display_element = tree;
            }

            if (this.completions) {
                this.completions_display_element.setAttribute("collapsed", "false");
                if (this.match_required && this.completions_display_element.currentIndex == -1)
                {
                    var i;
                    if (this.default_completion)
                    {
                        i = this.completions.data.indexOf(this.default_completion);
                        if (i == -1)
                            i = 0;
                    } else
                        i = 0;
                    this.completions_display_element.currentIndex = i;
                    this.completions_display_element.treeBoxObject.ensureRowIsVisible(i);
                    this.completion_selected(frame); // This is a no-op, but it is done for consistency
                }
            }
        }
    },

    unload : function (frame) {
        if (this.completions_display_element)
            this.completions_display_element.setAttribute("collapsed", "true");
    },

    destroy : function (frame) {
        var el = this.completions_display_element;
        if (el)
        {
            el.parentNode.removeChild(el);
            this.completions_display_element = null;
        }
    },

    /* FIXME: this should perhaps be called "handle_state_change" or something */
    update_completions : function (frame) {
        /* FIXME: need to use delay */
        if (this.completer) {
            var m = frame.minibuffer;
            this.completions = this.completer(m._input_text, m._selection_start);

            if (m.current_state == this)
            {
                if (this.completions && this.completions.data.length > 0)
                {
                    this.completions_display_element.treeBoxObject.invalidate();
                    this.completions_display_element.setAttribute("collapsed", "false");
                    if (this.match_required)
                    {
                        var i;
                        if (this.default_completion)
                        {
                            i = this.completions.data.indexOf(this.default_completion);
                            if (i == -1)
                                i = 0;
                        }
                        else
                            i = 0;
                        this.completions_display_element.currentIndex = i;
                        this.completions_display_element.treeBoxObject.scrollToRow(i);
                    } else  {
                        this.completions_display_element.currentIndex = -1;
                        this.completions_display_element.treeBoxObject.scrollToRow(0);
                    }

                } else {
                    this.completions_display_element.setAttribute("collapsed", "true");
                }
            }
        }
    },

    completion_selected : function (frame) {
        /**
         * When a completion is selected, apply it to the input text
         * if a match is not "required"; otherwise, the completion is
         * only displayed.
         */
        if (this.completions_valid && !this.match_required)
        {
            var m = frame.minibuffer;
            var c = this.completions;

            var sel_c = c.data[this.completions_display_element.currentIndex];
            c.apply(sel_c, m);
        }
    }
};

function minibuffer_complete(frame)
{
    var m = frame.minibuffer;
    var s = m.current_state;
    if (!(s instanceof text_entry_minibuffer_state))
        throw "Invalid minibuffer state";
    if (!s.completer)
        return;
    /* FIXME: handle delay
    if (!s.completions_valid)
    {
    var str = m._input_text;
    var pos = m._selection_start;
    }*/

    /* FIXME: handle "select one of the choices" behavior */
    var c = s.completions;
    if (!c)
        return;
    var e = s.completions_display_element;
    var new_index = -1;
    if (c.common_prefix)
    {
        c.apply_common_prefix(c.common_prefix, m);
        c.common_prefix = null;
    } else if (e.currentIndex != -1)
    {
        new_index = (e.currentIndex + 1) % c.data.length;

    } else {
        new_index = 0;
    }
    if (new_index != -1)
    {
        e.currentIndex = new_index;
        s.completions_display_element.treeBoxObject.ensureRowIsVisible(new_index);
        s.completion_selected(frame);
    }
}
interactive("minibuffer-complete", minibuffer_complete, I.current_frame);

/* USER PREFERENCE */
var minibuffer_input_mode_show_message_timeout = 1000;

function minibuffer (frame)
{
    this.output_element = frame.document.getElementById("minibuffer-output");
    this.input_prompt_element = frame.document.getElementById("input-prompt");
    this.input_element = frame.document.getElementById("input-field");
    var m = this;
    this.input_element.inputField.addEventListener("blur", function() {
            if (m._input_mode_enabled && !m._showing_message)
            {
                frame.setTimeout(
                    function(){
                        m.input_element.focus();
                    }, 0);
            }
        }, false);
    this.frame = frame;
    this.last_message = "";
    this.states = [];
}

minibuffer.prototype = {
    constructor : minibuffer.constructor,
    get _selection_start () { return this.input_element.selectionStart; },
    get _selection_end () { return this.input_element.selectionEnd; },
    get _input_text () { return this.input_element.value; },
    set _input_text (text) { this.input_element.value = text; },
    get prompt () { return this.input_prompt_element.value; },
    set prompt (s) { this.input_prompt_element.value = s; },

    _set_selection : function (start, end) {
        if (start == null)
            start = this._input_text.length;
        if (end == null)
            end = this._input_text.length;
        this.input_element.setSelectionRange(start,end);
    },

    /* Saved focus state */
    saved_focused_window : null,
    saved_focused_element : null,

    /* This method will display the specified string in the
     * minibuffer, without recording it in any log/Messages buffer. */
    show : function (str) {
        if (this.last_message != str)
        {
            this.output_element.value = str;
            this.last_message = str;
            /*
            if (str.length > 0)
                dumpln("MINIBUFFER: " + str);
            */
        }
    },
    message : function (str) {
        /* TODO: add the message to a *Messages* buffer, and/or
         * possibly dump them to the console. */
        this.show(str);


        if (str.length > 0 && this._input_mode_enabled)
            this._ensure_message_area_showing();
    },
    clear : function () {
        this.show("");
    },

    get current_state () {
        if (this.states.length == 0)
            return null;
        return this.states[this.states.length - 1];
    },

    push_state : function (state) {
        this._save_state();
        this.states.push(state);
        this._restore_state();
        state.load(this.frame);
    },

    pop_state : function (restore_focus) {
        if (restore_focus === undefined)
            restore_focus = true;
        this.current_state.destroy();
        this.states.pop();
        this._restore_state(restore_focus);
    },

    _input_mode_enabled : false,

    /* If _input_mode_enabled is true, this is set to indicate that
     * the message area is being temporarily shown instead of the
     * input box. */
    _showing_message : false,

    _message_timer_ID : null,

    /* This must only be called if _input_mode_enabled is true */
    _ensure_input_area_showing : function () {
        if (this._showing_message)
        {
            this.frame.clearTimeout(this._message_timer_ID);
            this._message_timer_ID = null;
            this._showing_message = false;
            this._switch_to_input_mode();
        }
    },

    /* This must only be called if _input_mode_enabled is true */
    _ensure_message_area_showing : function () {
        if (this._showing_message)
            this.frame.clearTimeout(this._message_timer_ID);
        else {
            this._showing_message = true;
            this._switch_to_message_mode();
        }
        var obj = this;
        this._message_timer_ID = this.frame.setTimeout(function(){
                obj._ensure_input_area_showing();
            }, minibuffer_input_mode_show_message_timeout);
    },

    _switch_to_input_mode : function () {
        this.output_element.collapsed = true;
        this.input_prompt_element.collapsed = false;
        this.input_element.collapsed = false;
        this.input_element.focus();
    },

    _switch_to_message_mode : function () {
        this.output_element.collapsed = false;
        this.input_prompt_element.collapsed = true;
        this.input_element.collapsed = true;
    },

    _restore_state : function (restore_focus) {
        var s = this.current_state;
        if (s) {
            if (!this._input_mode_enabled)
            {
                this.saved_focused_window = this.frame.document.commandDispatcher.focusedWindow;
                this.saved_focused_element = this.frame.document.commandDispatcher.focusedElement;
                this._input_mode_enabled = true;
                this._switch_to_input_mode();
            }
            this.frame.keyboard.override_keymap = s.keymap;
            this._input_text = s.input;
            this.prompt = s.prompt;
            this._set_selection(s.selection_start, s.selection_end);
        } else {
            if (this._input_mode_enabled)
            {
                this._input_mode_enabled = false;
                if (!this._showing_message)
                    this._switch_to_message_mode();
                else {
                    this.frame.clearTimeout(this._message_timer_ID);
                    this._message_timer_ID = null;
                    this._showing_message = false;
                }
                if (restore_focus)
                {
                    if (this.saved_focused_element)
                        set_focus_no_scroll(this.frame, this.saved_focused_element);
                    else if (this.saved_focused_window)
                        set_focus_no_scroll(this.frame, this.saved_focused_window);
                }
                this.saved_focused_element = null;
                this.saved_focused_window = null;
                this.frame.keyboard.override_keymap = null;
            }
        }
    },

    _save_state : function () {
        var s = this.current_state;
        if (s)
        {
            s.input = this._input_text;
            s.prompt = this.prompt;
            s.selection_start = this._selection_start;
            s.selection_end = this._selection_end;
            s.unload(this.frame);
        }
    },

    /*  See basic_minibuffer_state for a description of arguments */
    read : function () {
        /* FIXME: have policy for deciding whether to refuse a
         * recursive minibuffer operation */
        this.push_state(new text_entry_minibuffer_state(forward_keywords(arguments)));
    },

    read_with_completion : function () {
        this.push_state(new completion_minibuffer_state(forward_keywords(arguments)));
    }
};

function minibuffer_initialize_frame(frame)
{
    frame.minibuffer = new minibuffer(frame);
}

add_hook("frame_initialize_early_hook", minibuffer_initialize_frame);

/* Note: This is concise, but doesn't seem to be useful in practice,
 * because nothing can be done with the state alone. */

I.minibuffer_state = interactive_method(
    $doc = "Topmost minibuffer state",
    $sync = function (ctx, type) {
        var s = ctx.frame.minibuffer.current_state;
        if (!s || (type && !(s instanceof type)))
            throw new Error("Invalid minibuffer state.");
        return s;
    });
