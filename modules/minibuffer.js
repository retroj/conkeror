/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

/* This should only be used for minibuffer states where it makes
 * sense.  In particular, it should not be used if additional cleanup
 * must be done. */
function minibuffer_abort (window)
{
    var m = window.minibuffer;
    var s = m.current_state;
    if (s == null)
        throw "Invalid minibuffer state";
    m.pop_state();
}
interactive("minibuffer-abort", function (I) {minibuffer_abort(I.window);});

define_builtin_commands(
    "minibuffer-",
    function (I, command) {
        try {
            var m = I.minibuffer;
            if (m._input_mode_enabled)
            {
                m._restore_normal_state();
                var e = m.input_element;
                var c = e.controllers.getControllerForCommand(command);
                try {
                    m.ignore_input_events = true;
                    if (c && c.isCommandEnabled(command))
                        c.doCommand(command);
                } finally {
                    m.ignore_input_events = false;
                }
                var s = m.current_state;
                if (s.ran_minibuffer_command)
                    s.ran_minibuffer_command(command);
            }
        } catch (e)
        {
            /* Ignore exceptions. */
        }
    },
    function (I) {
        I.minibuffer.current_state.mark_active = !I.minibuffer.current_state.mark_active;
    },

    function (I) I.minibuffer.current_state.mark_active
);

function minibuffer_state(keymap, use_input_mode)
{
    this.keymap = keymap;
    this.use_input_mode = use_input_mode;
}
minibuffer_state.prototype.load = function () {}
minibuffer_state.prototype.unload = function () {}
minibuffer_state.prototype.destroy = function () {}

function minibuffer_message_state(keymap, message, destroy_function)
{
    minibuffer_state.call(this, keymap, false);
    this._message = message;
    if (destroy_function)
        this.destroy = destroy_function;
}
minibuffer_message_state.prototype = {
    __proto__: minibuffer_state.prototype,
    load : function (window) {
        this.window = window;
    },
    unload : function (window) {
        this.window = null;
    },
    get message () { return this._message; },
    set message (x) {
        if (this.window) {
            this.window.minibuffer._restore_normal_state();
            this.window.minibuffer._show(this._message);
        }
    }
};

function minibuffer_input_state(keymap, prompt, input, selection_start, selection_end)
{
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

    minibuffer_state.call(this, keymap, true);
}
minibuffer_input_state.prototype.__proto__ = minibuffer_state.prototype;


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
    keywords(arguments);
    var initial_value = arguments.$initial_value || "";
    var sel_start, sel_end;
    if (arguments.$select)
    {
        sel_start = 0;
        sel_end = initial_value.length;
    } else {
        sel_start = sel_end = initial_value.length;
    }
    minibuffer_input_state.call(this, minibuffer_base_keymap,
                                arguments.$prompt, initial_value,
                                sel_start, sel_end);
}
basic_minibuffer_state.prototype.__proto__ = minibuffer_input_state.prototype; // inherit from minibuffer_state

define_variable("minibuffer_input_mode_show_message_timeout", 1000, "Time duration (in milliseconds) to flash minibuffer messages while in minibuffer input mode.");

function minibuffer (window)
{
    this.element = window.document.getElementById("minibuffer");
    this.output_element = window.document.getElementById("minibuffer-message");
    this.input_prompt_element = window.document.getElementById("minibuffer-prompt");
    this.input_element = window.document.getElementById("minibuffer-input");
    var m = this;
    this.input_element.inputField.addEventListener("blur", function() {
            if (m.active && m._input_mode_enabled && !m._showing_message)
            {
                window.setTimeout(
                    function(){
                        m.input_element.inputField.focus();
                    }, 0);
            }
        }, false);
    this.input_element.addEventListener("input", function(e) {
        if (m.ignore_input_events || !m._input_mode_enabled)
            return;
        var s = m.current_state;
        if (s) {
            if (s.handle_input)
                s.handle_input(m);
        }
    }, true);

    // Ensure that the input area will have focus if a message is
    // currently being flashed so that the default handler for key
    // events will properly add text to the input area.
    window.addEventListener("keydown", function (e) {
        if (m._input_mode_enabled && m._showing_message)
            m._restore_normal_state();
    }, true);
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

    set_input_state : function(x) {
        this._input_text = x[0];
        this._set_selection(x[1], x[2]);
    },

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

    default_message : "",

    current_message : null,

    /* This method will display the specified string in the
     * minibuffer, without recording it in any log/Messages buffer. */
    show : function (str, force) {
        if (!this.active || force) {
            this.current_message = str;
            this._show(str);
        }
    },

    _show : function (str, force) {
        if (this.last_message != str)
        {
            this.output_element.value = str;
            this.last_message = str;
        }
    },

    message : function (str) {
        /* TODO: add the message to a *Messages* buffer, and/or
         * possibly dump them to the console. */
        this.show(str, true /* force */);

        if (str.length > 0 && this.active)
            this._flash_temporary_message();
    },
    clear : function () {
        this.current_message = null;
        if (!this.active)
            this._show(this.default_message);
    },

    set_default_message : function (str) {
        this.default_message = str;
        if (this.current_message == null)
            this._show(str);
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

    pop_state : function () {
        this.current_state.destroy();
        this.states.pop();
        this._restore_state();
    },

    pop_all : function () {
        while (this.states.length > 0) {
            this.current_state.destroy();
            this.states.pop();
        }
    },

    remove_state : function (state) {
        var i = this.states.indexOf(state);
        if (i == -1)
            return;
        var was_current = (i == (this.states.length - 1));
        state.destroy();
        this.states.splice(i, 1);
        if (was_current)
            this._restore_state();
    },

    _input_mode_enabled : false,

    active : false,

    /* If _input_mode_enabled is true, this is set to indicate that
     * the message area is being temporarily shown instead of the
     * input box. */
    _showing_message : false,

    _message_timer_ID : null,

    /* This must only be called if _input_mode_enabled is true */
    _restore_normal_state : function () {
        if (this._showing_message)
        {
            this.window.clearTimeout(this._message_timer_ID);
            this._message_timer_ID = null;
            this._showing_message = false;

            if (this._input_mode_enabled)
                this._switch_to_input_mode();
            else
                this._show(this.current_state._message);
        }
    },

    /* This must only be called if _input_mode_enabled is true */
    _flash_temporary_message : function () {
        if (this._showing_message)
            this.window.clearTimeout(this._message_timer_ID);
        else {
            this._showing_message = true;
            if (this._input_mode_enabled)
                this._switch_to_message_mode();
        }
        var obj = this;
        this._message_timer_ID = this.window.setTimeout(function(){
            obj._restore_normal_state();
        }, minibuffer_input_mode_show_message_timeout);
    },

    _switch_to_input_mode : function () {
        this.element.setAttribute("minibuffermode", "input");
        this.input_element.inputField.focus();
    },

    _switch_to_message_mode : function () {
        this.element.setAttribute("minibuffermode", "message");
    },

    _restore_state : function () {
        var s = this.current_state;
        var want_input_mode = false;
        if (s) {
            if (!this.active) {
                this.saved_focused_frame = this.window.document.commandDispatcher.focusedWindow;
                this.saved_focused_element = this.window.document.commandDispatcher.focusedElement;
            }
            if (s.use_input_mode) {
                want_input_mode = true;
                this._input_text = s.input;
                this.prompt = s.prompt;
                this._set_selection(s.selection_start, s.selection_end);
            } else {
                this._show(s._message);
            }
            s.load(this.window);
            this.window.keyboard.set_override_keymap(s.keymap);
            this.active = true;
        } else {
            if (this.active) {
                this.active = false;
                this.window.keyboard.set_override_keymap(null);
                if (this.saved_focused_element)
                    set_focus_no_scroll(this.window, this.saved_focused_element);
                else if (this.saved_focused_frame)
                    set_focus_no_scroll(this.window, this.saved_focused_frame);
                this.saved_focused_element = null;
                this.saved_focused_frame = null;
                this._show(this.current_message || this.default_message);
            }
        }
        var in_input_mode = this._input_mode_enabled && !this._showing_message;
        if (this._showing_message) {
            this.window.clearTimeout(this._message_timer_ID);
            this._message_timer_ID = null;
            this._showing_message = false;
        }
        if (want_input_mode && !in_input_mode)
            this._switch_to_input_mode();
        else if (!want_input_mode && in_input_mode)
            this._switch_to_message_mode();
        this._input_mode_enabled = want_input_mode;
    },

    _save_state : function () {
        var s = this.current_state;
        if (s)
        {
            if (s.use_input_mode) {
                s.input = this._input_text;
                s.prompt = this.prompt;
                s.selection_start = this._selection_start;
                s.selection_end = this._selection_end;
            }
            s.unload(this.window);
        }
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

function minibuffer_window_close_handler(window) {
    window.minibuffer.pop_all();
}
add_hook("window_close_hook", minibuffer_window_close_handler);

/* Note: This is concise, but doesn't seem to be useful in practice,
 * because nothing can be done with the state alone. */
minibuffer.prototype.check_state = function(type) {
    var s = this.current_state;
    if (!(s instanceof type))
        throw new Error("Invalid minibuffer state.");
    return s;
};

minibuffer.prototype.show_wait_message = function (initial_message, destroy_function) {
    var s = new minibuffer_message_state(minibuffer_message_keymap, initial_message, destroy_function);
    this.push_state(s);
    return s;
};

minibuffer.prototype.wait_for = function minibuffer__wait_for(message, coroutine) {
    var cc = yield CONTINUATION;
    var done = false;
    var s = this.show_wait_message(message, function () { if (!done) cc.throw(abort()); });
    var result;
    try {
        result = yield coroutine;
    }
    finally {
        done = true;
        this.remove_state(s);
    }
    yield co_return(result);
}
