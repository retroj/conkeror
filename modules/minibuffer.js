/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 * (C) Copyright 2009-2010 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

/**
 * minibuffer_state: abstact base class for minibuffer states.
 */
function minibuffer_state (minibuffer, keymap) {
    this.minibuffer = minibuffer;
    this.keymaps = [default_base_keymap, keymap];
}
minibuffer_state.prototype = {
    constructor: minibuffer_state,
    load: function () {},
    unload: function () {},
    destroy: function () {}
};


/**
 * minibuffer_message_state: base class for minibuffer states which do not
 * use the input element, but still may use a keymap.
 */
function minibuffer_message_state (minibuffer, keymap, message, cleanup_function) {
    minibuffer_state.call(this, minibuffer, keymap);
    this._message = message;
    this.cleanup_function = cleanup_function;
}
minibuffer_message_state.prototype = {
    constructor: minibuffer_message_state,
    __proto__: minibuffer_state.prototype,
    _message: null,
    get message () { return this._message; },
    set message (x) {
        this.minibuffer._restore_normal_state();
        this.minibuffer._show(this._message);
    },
    load: function () {
        minibuffer_state.prototype.load.call(this);
        this.minibuffer._show(this.message);
    },
    cleanup_function: null,
    destroy: function () {
        if (this.cleanup_function)
            this.cleanup_function();
        minibuffer_state.prototype.destroy.call(this);
    }
};


/**
 * minibuffer_input_state: base class for minibuffer states which use the
 * input element.
 */
function minibuffer_input_state (minibuffer, keymap, prompt, input, selection_start, selection_end) {
    minibuffer_state.call(this, minibuffer, keymap);
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
    this.minibuffer.window.input.begin_recursion();
}
minibuffer_input_state.prototype = {
    constructor: minibuffer_input_state,
    __proto__: minibuffer_state.prototype,
    mark_active: false,
    load: function () {
        minibuffer_state.prototype.load.call(this);
        this.minibuffer.ignore_input_events = true;
        this.minibuffer._input_text = this.input;
        this.minibuffer.ignore_input_events = false;
        this.minibuffer.prompt = this.prompt;
        this.minibuffer._set_selection(this.selection_start,
                                       this.selection_end);
    },
    unload: function () {
        this.input = this.minibuffer._input_text;
        this.prompt = this.minibuffer.prompt;
        this.selection_start = this.minibuffer._selection_start;
        this.selection_end = this.minibuffer._selection_end;
        minibuffer_state.prototype.unload.call(this);
    },
    destroy: function () {
        this.minibuffer.window.input.end_recursion();
        minibuffer_state.prototype.destroy.call(this);
    }
};


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
define_keywords("$keymap", "$prompt", "$initial_value", "$select");
function basic_minibuffer_state (minibuffer) {
    keywords(arguments, $keymap = minibuffer_base_keymap);
    var initial_value = arguments.$initial_value || "";
    var sel_start, sel_end;
    if (arguments.$select) {
        sel_start = 0;
        sel_end = initial_value.length;
    } else {
        sel_start = sel_end = initial_value.length;
    }
    minibuffer_input_state.call(this, minibuffer, arguments.$keymap,
                                arguments.$prompt, initial_value,
                                sel_start, sel_end);
}
basic_minibuffer_state.prototype = {
    constructor: basic_minibuffer_state,
    __proto__: minibuffer_input_state.prototype
};


define_variable("minibuffer_input_mode_show_message_timeout", 1000,
    "Time duration (in milliseconds) to flash minibuffer messages while in "+
    "minibuffer input mode.");


function minibuffer (window) {
    this.element = window.document.getElementById("minibuffer");
    this.output_element = window.document.getElementById("minibuffer-message");
    this.input_prompt_element = window.document.getElementById("minibuffer-prompt");
    this.input_element = window.document.getElementById("minibuffer-input");
    var m = this;
    this.input_element.inputField.addEventListener("blur",
        function () {
            if (m.active && m._input_mode_enabled && !m._showing_message) {
                window.setTimeout(function () {
                        m.input_element.inputField.focus();
                    }, 0);
            }
        }, false);
    function dispatch_handle_input () {
        if (m.ignore_input_events || !m._input_mode_enabled)
            return;
        var s = m.current_state;
        if (s && s.handle_input)
            s.handle_input(m);
    }
    this.input_element.addEventListener("input", dispatch_handle_input, true);
    this.input_element.watch("value",
        function (prop, oldval, newval) {
            if (newval != oldval &&
                !m.ignore_input_events)
            {
                call_after_timeout(dispatch_handle_input, 0);
            }
            return newval;
        });
    // Ensure that the input area will have focus if a message is
    // currently being flashed so that the default handler for key
    // events will properly add text to the input area.
    window.addEventListener("keydown",
        function (e) {
            if (m._input_mode_enabled && m._showing_message)
                m._restore_normal_state();
        }, true);
    this.window = window;
    this.last_message = "";
    this.states = [];
}
minibuffer.prototype = {
    constructor: minibuffer,
    get _selection_start () { return this.input_element.selectionStart; },
    get _selection_end () { return this.input_element.selectionEnd; },
    get _input_text () { return this.input_element.value; },
    set _input_text (text) { this.input_element.value = text; },
    get prompt () { return this.input_prompt_element.value; },
    set prompt (s) { this.input_prompt_element.value = s; },

    set_input_state: function (x) {
        this._input_text = x[0];
        this._set_selection(x[1], x[2]);
    },

    _set_selection: function (start, end) {
        if (start == null)
            start = this._input_text.length;
        if (end == null)
            end = this._input_text.length;
        this.input_element.setSelectionRange(start,end);
    },

    /* Saved focus state */
    saved_focused_frame: null,
    saved_focused_element: null,

    default_message: "",

    current_message: null,

    /* This method will display the specified string in the
     * minibuffer, without recording it in any log/Messages buffer. */
    show: function (str, force) {
        if (!this.active || force) {
            this.current_message = str;
            this._show(str);
        }
    },

    _show: function (str) {
        if (this.last_message != str) {
            this.output_element.value = str;
            this.last_message = str;
        }
    },

    message: function (str) {
        /* TODO: add the message to a *Messages* buffer, and/or
         * possibly dump them to the console. */
        if (str == "")
            this.clear();
        else {
            this.show(str, true /* force */);
            if (this.active)
                this._flash_temporary_message();
        }
    },

    clear: function () {
        this.current_message = null;
        if (!this.active)
            this._show(this.default_message);
    },

    set_default_message: function (str) {
        this.default_message = str;
        if (this.current_message == null)
            this._show(str);
    },

    get current_state () {
        if (! this.states[0])
            return null;
        return this.states[this.states.length - 1];
    },

    push_state: function (state) {
        this._save_state();
        this.states.push(state);
        this._restore_state();
    },

    pop_state: function () {
        this.current_state.destroy();
        this.states.pop();
        this._restore_state();
    },

    pop_all: function () {
        var state;
        while ((state = this.current_state)) {
            state.destroy();
            this.states.pop();
        }
    },

    //XXX: breaking stack discipline can cause incorrect
    //     input recursion termination
    remove_state: function (state) {
        var i = this.states.indexOf(state);
        if (i == -1)
            return;
        var was_current = (i == (this.states.length - 1));
        state.destroy();
        this.states.splice(i, 1);
        if (was_current)
            this._restore_state();
    },

    _input_mode_enabled: false,

    active: false,

    /* If _input_mode_enabled is true, this is set to indicate that
     * the message area is being temporarily shown instead of the
     * input box. */
    _showing_message: false,

    _message_timer_ID: null,

    /* This must only be called if _input_mode_enabled is true */
    //XXX: if it must only be called if _input_mode_enabled is true, then
    //     why does it have an else condition for handling
    //     minibuffer_message_state states?
    _restore_normal_state: function () {
        if (this._showing_message) {
            this.window.clearTimeout(this._message_timer_ID);
            this._message_timer_ID = null;
            this._showing_message = false;

            if (this._input_mode_enabled)
                this._switch_to_input_mode();
            else
                // assumes that anything other than an input state is a
                // minibuffer_message_state.
                this._show(this.current_state._message);
        }
    },

    /* This must only be called if _input_mode_enabled is true */
    _flash_temporary_message: function () {
        if (this._showing_message)
            this.window.clearTimeout(this._message_timer_ID);
        else {
            this._showing_message = true;
            if (this._input_mode_enabled)
                this._switch_to_message_mode();
        }
        var obj = this;
        this._message_timer_ID = this.window.setTimeout(function () {
            obj._restore_normal_state();
        }, minibuffer_input_mode_show_message_timeout);
    },

    _switch_to_input_mode: function () {
        this.element.setAttribute("minibuffermode", "input");
        this.input_element.inputField.focus();
    },

    _switch_to_message_mode: function () {
        this.element.setAttribute("minibuffermode", "message");
    },

    _restore_state: function () {
        var s = this.current_state;
        if (s) {
            if (!this.active) {
                this.saved_focused_frame = this.window.document.commandDispatcher.focusedWindow;
                this.saved_focused_element = this.window.document.commandDispatcher.focusedElement;
            }
            s.load();
            this.active = true;
        } else {
            if (this.active) {
                this.active = false;
                this.window.buffers.current.browser.focus();
                if (this.saved_focused_element && this.saved_focused_element.focus)
                    set_focus_no_scroll(this.window, this.saved_focused_element);
                else if (this.saved_focused_frame)
                    set_focus_no_scroll(this.window, this.saved_focused_frame);
                this.saved_focused_element = null;
                this.saved_focused_frame = null;
                this._show(this.current_message || this.default_message);
            }
        }
        if (this._showing_message) {
            this.window.clearTimeout(this._message_timer_ID);
            this._message_timer_ID = null;
            this._showing_message = false;
        }
        var want_input_mode = s instanceof minibuffer_input_state;
        var in_input_mode = this._input_mode_enabled && !this._showing_message;
        if (want_input_mode && !in_input_mode)
            this._switch_to_input_mode();
        else if (!want_input_mode && in_input_mode)
            this._switch_to_message_mode();
        this._input_mode_enabled = want_input_mode;
    },

    _save_state: function () {
        var s = this.current_state;
        if (s)
            s.unload();
    },

    insert_before: function (element) {
        this.element.parentNode.insertBefore(element, this.element);
    }
};


function minibuffer_initialize_window (window) {
    window.minibuffer = new minibuffer(window);
}
add_hook("window_initialize_early_hook", minibuffer_initialize_window);


function minibuffer_window_close_handler (window) {
    window.minibuffer.pop_all();
}
add_hook("window_close_hook", minibuffer_window_close_handler);


/* Note: This is concise, but doesn't seem to be useful in practice,
 * because nothing can be done with the state alone. */
minibuffer.prototype.check_state = function (type) {
    var s = this.current_state;
    if (!(s instanceof type))
        throw new Error("Invalid minibuffer state.");
    return s;
};

minibuffer.prototype.show_wait_message = function (initial_message, cleanup_function) {
    var s = new minibuffer_message_state(this, minibuffer_message_keymap, initial_message, cleanup_function);
    this.push_state(s);
    return s;
};

minibuffer.prototype.wait_for = function (message, coroutine) {
    var cc = yield CONTINUATION;
    var done = false;
    var s = this.show_wait_message(message, function () { if (!done) cc.throw(abort()); });
    var result;
    try {
        result = yield coroutine;
    } finally {
        done = true;
        this.remove_state(s);
    }
    yield co_return(result);
};


// This should only be used for minibuffer states where it makes
// sense.  In particular, it should not be used if additional cleanup
// must be done.
function minibuffer_abort (window) {
    var m = window.minibuffer;
    var s = m.current_state;
    if (s == null)
        throw "Invalid minibuffer state";
    m.pop_state();
    input_sequence_abort.call(window);
}
interactive("minibuffer-abort", null, function (I) { minibuffer_abort(I.window); });


provide("minibuffer");
