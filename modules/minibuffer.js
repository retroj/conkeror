
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
                m._ensure_input_area_showing();
                var e = m.input_element;
                var c = e.controllers.getControllerForCommand(command);
                if (c && c.isCommandEnabled(command))
                    c.doCommand(command);
                var s = m.current_state;
                if ((s instanceof text_entry_minibuffer_state))
                    s.handle_input_changed();
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
        s.handle_input_changed();
}
interactive("minibuffer-insert-character", function (I) {
    minibuffer_insert_character(I.window, I.p, I.event);
});

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
    minibuffer_state.call(this, minibuffer_base_keymap,
                          arguments.$prompt, initial_value,
                          sel_start, sel_end);
}
basic_minibuffer_state.prototype.__proto__ = minibuffer_state.prototype; // inherit from minibuffer_state

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

    default_message : "",

    current_message : null,

    /* This method will display the specified string in the
     * minibuffer, without recording it in any log/Messages buffer. */
    show : function (str) {
        this.current_message = str;
        this._show(str);
    },

    _show : function (str) {
        if (this.last_message != str)
        {
            this.output_element.value = str;
            this.last_message = str;
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
        this.current_message = null;
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
        state.load(this.window);
    },

    pop_state : function (restore_focus) {
        if (restore_focus === undefined)
            restore_focus = true;
        this.current_state.destroy();
        this.states.pop();
        this._restore_state(restore_focus);
    },

    pop_all : function () {
        while (this.states.length > 0) {
            this.current_state.destroy();
            this.states.pop();
        }
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
