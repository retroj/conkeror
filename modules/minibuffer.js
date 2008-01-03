
function exit_minibuffer(window)
{
    var m = window.minibuffer;
    var s = m.current_state;
    if (!(s instanceof text_entry_minibuffer_state))
        throw "Invalid minibuffer state";

    var val = m._input_text;

    if (s.validator && !s.validator(val, m))
        return;

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
interactive("exit-minibuffer", exit_minibuffer, I.current_window);

function minibuffer_history_next (window)
{
    var m = window.minibuffer;
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
interactive("minibuffer-history-next", minibuffer_history_next, I.current_window);

function minibuffer_history_previous (window)
{
    var m = window.minibuffer;
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
interactive("minibuffer-history-previous", minibuffer_history_previous, I.current_window);

/* This should only be used for minibuffer states where it makes
 * sense.  In particular, it should not be used if additional cleanup
 * must be done. */
function minibuffer_abort (window)
{
    var m = window.minibuffer;
    var s = m.current_state;
    if (!(s instanceof minibuffer_state))
        throw "Invalid minibuffer state";
    m.pop_state();
    if (s.abort_callback)
        s.abort_callback();
}
interactive("minibuffer-abort", minibuffer_abort, I.current_window);

function minibuffer_do_command(window, command) {
    try {
        var m = window.minibuffer;
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
                s.update_completions(window);
            }
        }
    } catch (e)
    {
        dumpln("minibuffer_do_command: " + e);
    }
}

/* FIXME: These should all be defined more compactly using a loop */
interactive("minibuffer-cmd_beginLine", minibuffer_do_command, I.current_window, 'cmd_beginLine');
interactive("minibuffer-cmd_copy", minibuffer_do_command, I.current_window, 'cmd_copy');
interactive("minibuffer-cmd_copyOrDelete", minibuffer_do_command, I.current_window, 'cmd_copyOrDelete');
interactive("minibuffer-cmd_cut", minibuffer_do_command, I.current_window, 'cmd_cut');
interactive("minibuffer-cmd_cutOrDelete", minibuffer_do_command, I.current_window, 'cmd_cutOrDelete');
interactive("minibuffer-cmd_deleteToBeginningOfLine", minibuffer_do_command, I.current_window, 'cmd_deleteToBeginningOfLine');
interactive("minibuffer-cmd_deleteToEndOfLine", minibuffer_do_command, I.current_window, 'cmd_deleteToEndOfLine');
interactive("minibuffer-cmd_endLine", minibuffer_do_command, I.current_window, 'cmd_endLine');
interactive("minibuffer-cmd_moveTop", minibuffer_do_command, I.current_window, 'cmd_moveTop');
interactive("minibuffer-cmd_moveBottom", minibuffer_do_command, I.current_window, 'cmd_moveBottom');
interactive("minibuffer-cmd_selectAll", minibuffer_do_command, I.current_window, 'cmd_selectAll');
interactive("minibuffer-cmd_selectBeginLine", minibuffer_do_command, I.current_window, 'cmd_selectBeginLine');
interactive("minibuffer-cmd_selectBottom", minibuffer_do_command, I.current_window, 'cmd_selectBottom');
interactive("minibuffer-cmd_selectEndLine", minibuffer_do_command, I.current_window, 'cmd_selectEndLine');
interactive("minibuffer-cmd_selectTop", minibuffer_do_command, I.current_window, 'cmd_selectTop');
interactive("minibuffer-cmd_scrollBeginLine", minibuffer_do_command, I.current_window, 'cmd_scrollBeginLine');
interactive("minibuffer-cmd_scrollEndLine", minibuffer_do_command, I.current_window, 'cmd_scrollEndLine');
interactive("minibuffer-cmd_scrollTop", minibuffer_do_command, I.current_window, 'cmd_scrollTop');
interactive("minibuffer-cmd_scrollBottom", minibuffer_do_command, I.current_window, 'cmd_scrollBottom');

interactive("minibuffer-cmd_charNext", do_N_times, minibuffer_do_command, I.p, I.current_window, 'cmd_charNext');
interactive("minibuffer-cmd_charPrevious", do_N_times, minibuffer_do_command, I.p, I.current_window, 'cmd_charPrevious');
interactive("minibuffer-cmd_deleteCharBackward", do_N_times, minibuffer_do_command, I.p, I.current_window, 'cmd_deleteCharBackward');
interactive("minibuffer-cmd_deleteCharForward", do_N_times, minibuffer_do_command, I.p, I.current_window, 'cmd_deleteCharForward');
interactive("minibuffer-cmd_deleteWordBackward", do_N_times, minibuffer_do_command, I.p, I.current_window, 'cmd_deleteWordBackward');
interactive("minibuffer-cmd_deleteWordForward", do_N_times, minibuffer_do_command, I.p, I.current_window, 'cmd_deleteWordForward');
interactive("minibuffer-cmd_lineNext", do_N_times, minibuffer_do_command, I.p, I.current_window, 'cmd_lineNext');
interactive("minibuffer-cmd_linePrevious", do_N_times, minibuffer_do_command, I.p, I.current_window, 'cmd_linePrevious');
interactive("minibuffer-cmd_movePageDown", do_N_times, minibuffer_do_command, I.p, I.current_window, 'cmd_movePageDown');
interactive("minibuffer-cmd_movePageUp", do_N_times, minibuffer_do_command, I.p, I.current_window, 'cmd_movePageUp');
interactive("minibuffer-cmd_redo", do_N_times, minibuffer_do_command, I.p, I.current_window, 'cmd_redo');
interactive("minibuffer-cmd_selectCharNext", do_N_times, minibuffer_do_command, I.p, I.current_window, 'cmd_selectCharNext');
interactive("minibuffer-cmd_selectCharPrevious", do_N_times, minibuffer_do_command, I.p, I.current_window, 'cmd_selectCharPrevious');
interactive("minibuffer-cmd_selectLineNext", do_N_times, minibuffer_do_command, I.p, I.current_window, 'cmd_selectLineNext');
interactive("minibuffer-cmd_selectLinePrevious", do_N_times, minibuffer_do_command, I.p, I.current_window, 'cmd_selectLinePrevious');
interactive("minibuffer-cmd_selectPageDown", do_N_times, minibuffer_do_command, I.p, I.current_window, 'cmd_selectPageDown');
interactive("minibuffer-cmd_selectPageUp", do_N_times, minibuffer_do_command, I.p, I.current_window, 'cmd_selectPageUp');
interactive("minibuffer-cmd_selectWordNext", do_N_times, minibuffer_do_command, I.p, I.current_window, 'cmd_selectWordNext');
interactive("minibuffer-cmd_selectWordPrevious", do_N_times, minibuffer_do_command, I.p, I.current_window, 'cmd_selectWordPrevious');
interactive("minibuffer-cmd_undo", do_N_times, minibuffer_do_command, I.p, I.current_window, 'cmd_undo');
interactive("minibuffer-cmd_wordNext", do_N_times, minibuffer_do_command, I.p, I.current_window, 'cmd_wordNext');
interactive("minibuffer-cmd_wordPrevious", do_N_times, minibuffer_do_command, I.p, I.current_window, 'cmd_wordPrevious');
interactive("minibuffer-cmd_scrollPageUp", do_N_times, minibuffer_do_command, I.p, I.current_window, 'cmd_scrollPageUp');
interactive("minibuffer-cmd_scrollPageDown", do_N_times, minibuffer_do_command, I.p, I.current_window, 'cmd_scrollPageDown');
interactive("minibuffer-cmd_scrollLineUp", do_N_times, minibuffer_do_command, I.p, I.current_window, 'cmd_scrollLineUp');
interactive("minibuffer-cmd_scrollLineDown", do_N_times, minibuffer_do_command, I.p, I.current_window, 'cmd_scrollLineDown');
interactive("minibuffer-cmd_scrollLeft", do_N_times, minibuffer_do_command, I.p, I.current_window, 'cmd_scrollLeft');
interactive("minibuffer-cmd_scrollRight", do_N_times, minibuffer_do_command, I.p, I.current_window, 'cmd_scrollRight');
interactive("minibuffer-cmd_paste", do_N_times, minibuffer_do_command, I.p, I.current_window, 'cmd_paste');

function minibuffer_insert_character(window, n, event)
{
    var m = window.minibuffer;
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
        s.update_completions(window);
}
interactive("minibuffer-insert-character", minibuffer_insert_character,
            I.current_window, I.p, I.e);

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
define_keywords("$callback", "$abort_callback", "$history", "$completer",
                "$match_required", "$default_completion",
                "$validator");
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

    this.validator = arguments.$validator;
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
        if (c.get_description)
            return c.get_description(c.data[row]);
        return "";
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
    load : function (window) {

        if (this.completer) {
            // Create completion display element if needed
            if (!this.completion_element)
            {
                var tree = create_XUL(window, "tree");
                var s = this;
                tree.addEventListener("select", function () { s.completion_selected(window); }, true, false);
                tree.setAttribute("class", "completions");

                tree.setAttribute("rows", "8");

                tree.setAttribute("collapsed", "true");

                tree.setAttribute("hidecolumnpicker", "true");
                tree.setAttribute("hideheader", "true");

                var treecols = create_XUL(window, "treecols");
                tree.appendChild(treecols);
                var treecol = create_XUL(window, "treecol");
                treecol.setAttribute("flex", "1");
                treecols.appendChild(treecol);
                treecol = create_XUL(window, "treecol");
                treecol.setAttribute("flex", "1");
                treecols.appendChild(treecol);
                tree.appendChild(create_XUL(window, "treechildren"));

                window.minibuffer.insert_before(tree);
                tree.view = new completions_tree_view(this);
                this.completions_display_element = tree;
            }

            if (this.completions && this.completions.data.length > 0) {
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
                    this.completion_selected(window); // This is a no-op, but it is done for consistency
                }
            }
        }
    },

    unload : function (window) {
        if (this.completions_display_element)
            this.completions_display_element.setAttribute("collapsed", "true");
    },

    destroy : function (window) {
        var el = this.completions_display_element;
        if (el)
        {
            el.parentNode.removeChild(el);
            this.completions_display_element = null;
        }
    },

    /* FIXME: this should perhaps be called "handle_state_change" or something */
    update_completions : function (window) {
        /* FIXME: need to use delay */
        if (this.completer) {
            var m = window.minibuffer;
            this.completions = this.completer(m._input_text, m._selection_start);

            if (m.current_state == this)
            {
                if (this.completions && this.completions.data.length > 0)
                {
                    this.completions_display_element.view = this.completions_display_element.view;
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

    completion_selected : function (window) {
        /**
         * When a completion is selected, apply it to the input text
         * if a match is not "required"; otherwise, the completion is
         * only displayed.
         */
        if (this.completions_valid && !this.match_required)
        {
            var m = window.minibuffer;
            var c = this.completions;

            var sel_c = c.data[this.completions_display_element.currentIndex];
            c.apply(sel_c, m);
        }
    }
};

function minibuffer_complete(window)
{
    var m = window.minibuffer;
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
    if (!c || c.data.length == 0)
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
        s.completion_selected(window);
    }
}
interactive("minibuffer-complete", minibuffer_complete, I.current_window);

function or_string(options) {
    return options.slice(0,options.length-1).join(", ") + " or " + options[options.length - 1];
}

/* USER PREFERENCE */
var minibuffer_input_mode_show_message_timeout = 1000;

function minibuffer (window)
{
    this.element = window.document.getElementById("minibuffer");
    this.output_element = window.document.getElementById("minibuffer-message");
    this.input_prompt_element = window.document.getElementById("minibuffer-prompt");
    this.input_element = window.document.getElementById("minibuffer-input");
    var m = this;
    this.input_element.inputField.addEventListener("blur", function() {
            if (m._input_mode_enabled && !m._showing_message)
            {
                window.setTimeout(
                    function(){
                        m.input_element.focus();
                    }, 0);
            }
        }, false);
    this.window = window;
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
    saved_focused_frame : null,
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
        state.load(this.window);
    },

    pop_state : function (restore_focus) {
        if (restore_focus === undefined)
            restore_focus = true;
        this.current_state.destroy();
        this.states.pop();
        this._restore_state(restore_focus);
    },

    remove_state : function (state, restore_focus) {
        if (restore_focus === undefined)
            restore_focus = true;
        var i = this.states.indexOf(state);
        state.destroy();
        this.states.splice(i, 1);
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
            this.window.clearTimeout(this._message_timer_ID);
            this._message_timer_ID = null;
            this._showing_message = false;
            this._switch_to_input_mode();
        }
    },

    /* This must only be called if _input_mode_enabled is true */
    _ensure_message_area_showing : function () {
        if (this._showing_message)
            this.window.clearTimeout(this._message_timer_ID);
        else {
            this._showing_message = true;
            this._switch_to_message_mode();
        }
        var obj = this;
        this._message_timer_ID = this.window.setTimeout(function(){
                obj._ensure_input_area_showing();
            }, minibuffer_input_mode_show_message_timeout);
    },

    _switch_to_input_mode : function () {
        this.element.setAttribute("minibuffermode", "input");
        this.input_element.focus();
    },

    _switch_to_message_mode : function () {
        this.element.setAttribute("minibuffermode", "message");
    },

    _restore_state : function (restore_focus) {
        var s = this.current_state;
        if (s) {
            if (!this._input_mode_enabled)
            {
                this.saved_focused_frame = this.window.document.commandDispatcher.focusedWindow;
                this.saved_focused_element = this.window.document.commandDispatcher.focusedElement;
                this._input_mode_enabled = true;
                this._switch_to_input_mode();
            }
            this.window.keyboard.set_override_keymap(s.keymap);
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
                    this.window.clearTimeout(this._message_timer_ID);
                    this._message_timer_ID = null;
                    this._showing_message = false;
                }
                if (restore_focus)
                {
                    if (this.saved_focused_element)
                        set_focus_no_scroll(this.window, this.saved_focused_element);
                    else if (this.saved_focused_frame)
                        set_focus_no_scroll(this.window, this.saved_focused_frame);
                }
                this.saved_focused_element = null;
                this.saved_focused_frame = null;
                this.window.keyboard.set_override_keymap(null);
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
            s.unload(this.window);
        }
    },

    /*  See basic_minibuffer_state for a description of arguments */
    read : function () {
        /* FIXME: have policy for deciding whether to refuse a
         * recursive minibuffer operation */
        var s = new text_entry_minibuffer_state(forward_keywords(arguments));
        this.push_state(s);
        return s;
    },

    read_with_completion : function () {
        var s = new completion_minibuffer_state(forward_keywords(arguments));
        this.push_state(s);
        return s;
    },

    insert_before : function (element) {
        this.element.parentNode.insertBefore(element, this.element);
    }
};

function minibuffer_initialize_window(window)
{
    window.minibuffer = new minibuffer(window);
}

add_hook("window_initialize_early_hook", minibuffer_initialize_window);

/* Note: This is concise, but doesn't seem to be useful in practice,
 * because nothing can be done with the state alone. */

I.minibuffer_state = interactive_method(
    $doc = "Topmost minibuffer state",
    $sync = function (ctx, type) {
        var s = ctx.window.minibuffer.current_state;
        if (!s || (type && !(s instanceof type)))
            throw new Error("Invalid minibuffer state.");
        return s;
    });

function minibuffer_read_command(m) {
    keywords(arguments, $prompt = "Command:", $history = "command");
    var completer = prefix_completer(
        $completions = function (visitor) {
            interactive_commands.for_each_value(visitor);
        },
        $get_string = function (x) {
            return x.name;
        },
        $get_description = function (x) {
            return x.shortdoc || "";
        },
        $get_value = function (x) {
            return x.name;
        });
    return m.read($prompt = arguments.$prompt,
                  $history = arguments.$history,
                  $completer = completer,
                  $match_required = true);
}


define_keywords("$options");
function explicit_options_minibuffer_state() {
    keywords(arguments);
    var options = arguments.$options;
    var options_string = or_string(options);
    text_entry_minibuffer_state.call(
        this, forward_keywords(arguments),
        $prompt = arguments.$prompt + " (" + options_string + ")",
        $validator = function (x, m) {
            if (options.indexOf(x) == -1) {
                m.message("Please answer " + options_string + ".");
                m._input_text = "";
                m._set_selection();
                return false;
            }
            return true;
        });
}
explicit_options_minibuffer_state.prototype.__proto__ = text_entry_minibuffer_state.prototype;

function yes_or_no_minibuffer_state() {
    keywords(arguments);
    var callback = arguments.$callback;
    explicit_options_minibuffer_state.call(
        this, forward_keywords(arguments),
        $options = ["yes", "no"],
        $callback = function (x) {
            callback(x == "yes");
        });
}
yes_or_no_minibuffer_state.prototype.__proto__ = explicit_options_minibuffer_state.prototype;

function single_character_options_minibuffer_state() {
    keywords(arguments);
    this.callback = arguments.$callback;
    this.abort_callback = arguments.$abort_callback;
    this.options = arguments.$options;
    minibuffer_state.call(this, single_character_options_minibuffer_keymap, arguments.$prompt);
}
single_character_options_minibuffer_state.prototype.__proto__ = minibuffer_state.prototype;

function single_character_options_enter_character(window, s, event) {
    var ch = String.fromCharCode(event.charCode);
    if (s.options.indexOf(ch) != -1) {
        window.minibuffer.pop_state();
        s.callback(ch);
        return;
    }
    var str = "Please answer " + or_string(s.options) + ".";
    window.minibuffer.message(str);
}

interactive("single-character-options-enter-character",
            single_character_options_enter_character,
            I.current_window,
            I.minibuffer_state(single_character_options_minibuffer_state),
            I.e);
