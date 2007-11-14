
function find_complete_match(matches, val)
{
    for (var i=0; i<matches.length; i++) {
        if (matches[i][0] == val)
            return matches[i][1];
    }
    return null;
}

function exit_minibuffer(frame)
{
    var m = frame.minibuffer;
    var s = m.current_state;
    if (!(s instanceof text_entry_minibuffer_state))
        throw "Invalid minibuffer state";

    var match = null;
    var val = trim_whitespace(m._input_text);
    if (s instanceof completion_minibuffer_state) {
        if (val.length == 0 && s.default_match != null)
            val = s.default_match;
        match = find_complete_match(s.completions, val);
    }

    // Check if we are allowed to exit here
    if ((s instanceof completion_minibuffer_state) && !match && !s.allow_non_matches)
        return;

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
        else
            s.callback(val);
    }
}
interactive("exit-minibuffer", exit_minibuffer, ['current_frame']);

function minibuffer_history_next (frame)
{
    var m = frame.minibuffer;
    var s = m.current_state;
    if (!(s instanceof text_entry_minibuffer_state))
        throw "Invalid minibuffer state";
    if (!s.history)
        return;
    m._ensure_input_area_showing();
    s.history_index = Math.max(s.history_index + 1, s.history.length - 1);
    m._input_text = s.history[s.history_index];
    m._set_selection();
}
interactive("minibuffer-history-next", minibuffer_history_next, ['current_frame']);

function minibuffer_history_previous (frame)
{
    var m = frame.minibuffer;
    var s = m.current_state;
    if (!(s instanceof text_entry_minibuffer_state))
        throw "Invalid minibuffer state";
    if (!s.history)
        return;
    m._ensure_input_area_showing();
    s.history_index = Math.min(s.history_index - 1, 0);
    m._input_text = s.history[s.history_index];
    m._set_selection();
}
interactive("minibuffer-history-previous", minibuffer_history_previous, ['current_frame']);

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
interactive("minibuffer-abort", minibuffer_abort, ['current_frame']);

/* FIXME: Change this to use a binary search */
function get_completions(str, matches)
{
    if (str.length == 0)
        return matches;
    var ret = [];
    for (var i=0; i<matches.length; i++)
	{
	    if (str == matches[i][0].substr(0, str.length))
            ret.push(matches[i]);
	}
    return ret;
}

function find_longest_common_prefix(matches)
{
    var a = matches[0][0];
    var b = matches[matches.length - 1][0];
    for (var i = 0; i < a.length && i < b.length; i++)
        if (a.charAt(i) != b.charAt(i))
            return i;
    return Math.min(a.length,b.length);
}

function minibuffer_complete (frame)
{
    var m = frame.minibuffer;
    var s = m.current_state;
    if (!(s instanceof completion_minibuffer_state))
        throw "Invalid minibuffer state";
    var str = m._input_text;
    var entered_text = str.substring(0, m._selection_start);
    var matches = get_completions(entered_text, s.completions);

    // If no completions, then nothing to do
    if (matches.length == 0)
    {
        m._set_selection(); // moves cursor to end
        return;
    }

    /* Find longest common prefix; since s.completions is sorted, this
     * is easy */
    var lcp = find_longest_common_prefix(matches);

    if (lcp == entered_text.length)
    {
        /* Cycle: find current match */
        var current_index = -1;
        for (var i = 0; i < matches.length; ++i)
            if (matches[i][0] == str)
            {
                current_index = i;
                break;
            }
        current_index = (current_index + 1) % matches.length;
        m._input_text = matches[current_index][0];
        m._set_selection(lcp); // select after lcp
    } else {
        m._input_text = matches[0][0];
        m._set_selection(lcp);
    }
}
interactive("minibuffer-complete", minibuffer_complete, ['current_frame']);


function minibuffer_accept_match (frame)
{
    var m = frame.minibuffer;
    var s = m.current_state;
    if (!(s instanceof completion_minibuffer_state))
        throw "Invalid minibuffer state";
    var sel_start = m._selection_start;
    var sel_end = m._selection_end;
    var str = m._input_text;
    if (sel_start == sel_end) {
        m._input_text = str.substr(0, sel_start) + " " + str.substr(sel_end);
        m._set_selection(sel_start + 1, sel_start + 1);
    } else {
        // When we allow non-matches it generally means the
        // completion takes an argument. So add a space.
        if (s.allow_non_matches && str[str.length-1] != ' ')
            m._input_text = str + " ";
        m._set_selection();
    }
}
interactive("minibuffer-accept-match", minibuffer_accept_match, ['current_frame']);

function minibuffer_do_command(frame, command) {
    /* FIXME: Once we have the minibuffer capable of flashing a
     * message, this should always revert to input mode immediately */
    try {
        var m = frame.minibuffer;
        if (m._input_mode_enabled)
        {
            m._ensure_input_area_showing();
            var e = m.input_element;
            var c = e.controllers.getControllerForCommand(command);
            if (c && c.isCommandEnabled(command))
                c.doCommand(command);
        }
    } catch (e)
    {
        dumpln("minibuffer_do_command: " + e);
    }
}

/* FIXME: These should all be defined more compactly using a loop */
interactive("minibuffer-cmd_beginLine", minibuffer_do_command, ['current_frame', ['value', 'cmd_beginLine']]);
interactive("minibuffer-cmd_copy", minibuffer_do_command, ['current_frame', ['value', 'cmd_copy']]);
interactive("minibuffer-cmd_copyOrDelete", minibuffer_do_command, ['current_frame', ['value', 'cmd_copyOrDelete']]);
interactive("minibuffer-cmd_cut", minibuffer_do_command, ['current_frame', ['value', 'cmd_cut']]);
interactive("minibuffer-cmd_cutOrDelete", minibuffer_do_command, ['current_frame', ['value', 'cmd_cutOrDelete']]);
interactive("minibuffer-cmd_deleteToBeginningOfLine", minibuffer_do_command, ['current_frame', ['value', 'cmd_deleteToBeginningOfLine']]);
interactive("minibuffer-cmd_deleteToEndOfLine", minibuffer_do_command, ['current_frame', ['value', 'cmd_deleteToEndOfLine']]);
interactive("minibuffer-cmd_endLine", minibuffer_do_command, ['current_frame', ['value', 'cmd_endLine']]);
interactive("minibuffer-cmd_moveTop", minibuffer_do_command, ['current_frame', ['value', 'cmd_moveTop']]);
interactive("minibuffer-cmd_moveBottom", minibuffer_do_command, ['current_frame', ['value', 'cmd_moveBottom']]);
interactive("minibuffer-cmd_selectAll", minibuffer_do_command, ['current_frame', ['value', 'cmd_selectAll']]);
interactive("minibuffer-cmd_selectBeginLine", minibuffer_do_command, ['current_frame', ['value', 'cmd_selectBeginLine']]);
interactive("minibuffer-cmd_selectBottom", minibuffer_do_command, ['current_frame', ['value', 'cmd_selectBottom']]);
interactive("minibuffer-cmd_selectEndLine", minibuffer_do_command, ['current_frame', ['value', 'cmd_selectEndLine']]);
interactive("minibuffer-cmd_selectTop", minibuffer_do_command, ['current_frame', ['value', 'cmd_selectTop']]);
interactive("minibuffer-cmd_scrollBeginLine", minibuffer_do_command, ['current_frame', ['value', 'cmd_scrollBeginLine']]);
interactive("minibuffer-cmd_scrollEndLine", minibuffer_do_command, ['current_frame', ['value', 'cmd_scrollEndLine']]);
interactive("minibuffer-cmd_scrollTop", minibuffer_do_command, ['current_frame', ['value', 'cmd_scrollTop']]);
interactive("minibuffer-cmd_scrollBottom", minibuffer_do_command, ['current_frame', ['value', 'cmd_scrollBottom']]);

interactive("minibuffer-cmd_charNext", do_N_times, [['value', minibuffer_do_command], "p", 'current_frame', ['value', 'cmd_charNext']]);
interactive("minibuffer-cmd_charPrevious", do_N_times, [['value', minibuffer_do_command], "p", 'current_frame', ['value', 'cmd_charPrevious']]);
interactive("minibuffer-cmd_deleteCharBackward", do_N_times, [['value', minibuffer_do_command], "p", 'current_frame', ['value','cmd_deleteCharBackward']]);
interactive("minibuffer-cmd_deleteCharForward", do_N_times, [['value', minibuffer_do_command], "p", 'current_frame', ['value', 'cmd_deleteCharForward']]);
interactive("minibuffer-cmd_deleteWordBackward", do_N_times, [['value', minibuffer_do_command], "p", 'current_frame', ['value', 'cmd_deleteWordBackward']]);
interactive("minibuffer-cmd_deleteWordForward", do_N_times, [['value', minibuffer_do_command], "p", 'current_frame', ['value', 'cmd_deleteWordForward']]);
interactive("minibuffer-cmd_lineNext", do_N_times, [['value', minibuffer_do_command], "p", 'current_frame', ['value', 'cmd_lineNext']]);
interactive("minibuffer-cmd_linePrevious", do_N_times, [['value', minibuffer_do_command], "p", 'current_frame', ['value', 'cmd_linePrevious']]);
interactive("minibuffer-cmd_movePageDown", do_N_times, [['value', minibuffer_do_command], "p", 'current_frame', ['value', 'cmd_movePageDown']]);
interactive("minibuffer-cmd_movePageUp", do_N_times, [['value', minibuffer_do_command], "p", 'current_frame', ['value', 'cmd_movePageUp']]);
interactive("minibuffer-cmd_redo", do_N_times, [['value', minibuffer_do_command], "p", 'current_frame', ['value', 'cmd_redo']]);
interactive("minibuffer-cmd_selectCharNext", do_N_times, [['value', minibuffer_do_command], "p", 'current_frame', ['value', 'cmd_selectCharNext']]);
interactive("minibuffer-cmd_selectCharPrevious", do_N_times, [['value', minibuffer_do_command], "p", 'current_frame', ['value', 'cmd_selectCharPrevious']]);
interactive("minibuffer-cmd_selectLineNext", do_N_times, [['value', minibuffer_do_command], "p", 'current_frame', ['value', 'cmd_selectLineNext']]);
interactive("minibuffer-cmd_selectLinePrevious", do_N_times, [['value', minibuffer_do_command], "p", 'current_frame', ['value', 'cmd_selectLinePrevious']]);
interactive("minibuffer-cmd_selectPageDown", do_N_times, [['value', minibuffer_do_command], "p", 'current_frame', ['value', 'cmd_selectPageDown']]);
interactive("minibuffer-cmd_selectPageUp", do_N_times, [['value', minibuffer_do_command], "p", 'current_frame', ['value', 'cmd_selectPageUp']]);
interactive("minibuffer-cmd_selectWordNext", do_N_times, [['value', minibuffer_do_command], "p", 'current_frame', ['value', 'cmd_selectWordNext']]);
interactive("minibuffer-cmd_selectWordPrevious", do_N_times, [['value', minibuffer_do_command], "p", 'current_frame', ['value', 'cmd_selectWordPrevious']]);
interactive("minibuffer-cmd_undo", do_N_times, [['value', minibuffer_do_command], "p", 'current_frame', ['value', 'cmd_undo']]);
interactive("minibuffer-cmd_wordNext", do_N_times, [['value', minibuffer_do_command], "p", 'current_frame', ['value', 'cmd_wordNext']]);
interactive("minibuffer-cmd_wordPrevious", do_N_times, [['value', minibuffer_do_command], "p", 'current_frame', ['value', 'cmd_wordPrevious']]);
interactive("minibuffer-cmd_scrollPageUp", do_N_times, [['value', minibuffer_do_command], "p", 'current_frame', ['value', 'cmd_scrollPageUp']]);
interactive("minibuffer-cmd_scrollPageDown", do_N_times, [['value', minibuffer_do_command], "p", 'current_frame', ['value', 'cmd_scrollPageDown']]);
interactive("minibuffer-cmd_scrollLineUp", do_N_times, [['value', minibuffer_do_command], "p", 'current_frame', ['value', 'cmd_scrollLineUp']]);
interactive("minibuffer-cmd_scrollLineDown", do_N_times, [['value', minibuffer_do_command], "p", 'current_frame', ['value', 'cmd_scrollLineDown']]);
interactive("minibuffer-cmd_scrollLeft", do_N_times, [['value', minibuffer_do_command], "p", 'current_frame', ['value', 'cmd_scrollLeft']]);
interactive("minibuffer-cmd_scrollRight", do_N_times, [['value', minibuffer_do_command], "p", 'current_frame', ['value', 'cmd_scrollRight']]);
interactive("minibuffer-cmd_paste", do_N_times, [['value', minibuffer_do_command], "p", 'current_frame', ['value', 'cmd_paste']]);

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
}
interactive("minibuffer-insert-character", minibuffer_insert_character, ['current_frame', 'p', 'e']);

function minibuffer_insert_character_complete(frame, n, event)
{
    var m = frame.minibuffer;
    var s = m.current_state;
    if (!(s instanceof completion_minibuffer_state))
        throw "Invalid minibuffer state";

    minibuffer_insert_character(frame, n, event);

    // Check for completions

    var entered_text = m._input_text.substring(0, m._selection_start);
    var matches = get_completions(entered_text, s.completions);
    if (matches.length == 0)
        return;
    m._input_text = matches[0][0];
    m._set_selection(entered_text.length);
}
interactive("minibuffer-insert-character-complete", minibuffer_insert_character_complete,
            ['current_frame', 'p', 'e']);

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
    minibuffer_state.call(this, minibuffer_base_kmap,
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
 */
define_keywords("$callback", "$abort_callback", "$history");
function text_entry_minibuffer_state() {
    keywords(arguments);

    basic_minibuffer_state.call(this, forward_keywords(arguments));
    this.keymap = minibuffer_kmap;
    
    this.callback = arguments.$callback;
    this.abort_callback = arguments.$abort_callback;
    if (arguments.$history)
    {
        this.history = minibuffer_history_data.get_put_default(arguments.$history, []);
        this.history_index = this.history.length;
    }
}
// inherit from basic_minibuffer_state
text_entry_minibuffer_state.prototype.__proto__ = basic_minibuffer_state.prototype;

/**
 * The parameter `args' specifies the arguments.  In addition, the
 * arguments for text_entry_minibuffer_state are also allowed.
 *
 * completions:       [required] specifies an array of possible completions
 *
 * allow_non_matches: [optional] if completions is non-null, setting
 *                               this allows a non-match to be successfully entered; the callback
 *                               with be called with the match as the first argument, and the true
 *                               value as the second argument.
 *
 * default_match:     [optional] if completions is non-null, specifies a default
 *                               match to use if the user entered a blank string.
 *
 * callback:          [optional] Called with the match as the first argument, and possibly with
 *                               the true value as the second argument, depending on allow_non_matches.
 *
 */
define_keywords("$completions", "$allow_non_matches", "$default_match");
function completion_minibuffer_state() {
    text_entry_minibuffer_state.call(this, forward_keywords(arguments));
    keywords(arguments, $allow_non_matches = false);
    this.keymap = minibuffer_completion_kmap;
    this.completions = arguments.$completions.slice().sort(function (a,b) {
            if (a[0] < b[0]) return -1;
            else if (a[0] == b[0]) return 0;
            else return 1;
        });
    this.allow_non_matches = arguments.$allow_non_matches;
    this.default_match = arguments.$default_match;
}
// inherit from text_entry_minibuffer_state
completion_minibuffer_state.prototype.__proto__ = text_entry_minibuffer_state.prototype;

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
    this._keymap_set = new keymap_set();
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

        if (str.length > 0 && this._input_mode_enabled)
            this._ensure_message_area_showing();
    },
    message : function (str) {
        /* TODO: add the message to a *Messages* buffer, and/or
         * possibly dump them to the console. */
        this.show(str);
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
    },

    pop_state : function (restore_focus) {
        if (restore_focus === undefined)
            restore_focus = true;
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
            this._keymap_set.default_keymap = s.keymap;
            this.frame.keyboard_state.override_keymap_set = this._keymap_set;
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
                this.frame.keyboard_state.override_keymap_set = null;
                this._keymap_set.default_keymap = null;
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
