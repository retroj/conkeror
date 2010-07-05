/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2010 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

require("window.js");
require("keymap.js");
require("interactive.js");

define_variable("key_bindings_ignore_capslock", false,
    "When true, the case of characters in key bindings will be based "+
    "only on whether shift was pressed--upper-case if yes, lower-case if "+
    "no.  Effectively, this overrides the capslock key.  This option has "+
    "no effect on ordinary typing in input fields.");

define_variable("keyboard_key_sequence_help_timeout", 0,
    "Delay (in millseconds) before the current key sequence prefix is "+
    "displayed in the minibuffer.");


/**
 * event_clone is used to make a copy of an event which is safe to keep
 * references to, because it will not reference any DOM trees directly
 * or indirectly.
 *
 * A pertinent question would be, is this needed?  Are there instances
 * in Conkeror when an event reference is stored across a navigation
 * boundary or buffer/window closing?
 */
function event_clone (event) {
    this.type = event.type;
    this.keyCode = event.keyCode;
    this.charCode = event.charCode;
    this.ctrlKey = event.ctrlKey;
    this.metaKey = event.metaKey;
    this.altKey = event.altKey;
    this.shiftKey = event.shiftKey;
    this.sticky_modifiers = event.sticky_modifiers;
}


/**
 * event_kill stops an event from being processed by any further handlers.
 */
function event_kill (event) {
    event.preventDefault();
    event.stopPropagation();
}


/**
 * command_event is a special event type that tells input_handle_sequence
 * to run the given command.
 */
function command_event (command) {
    this.type = "command";
    this.command = command;
}


/**
 * input_state makes an object that holds the state of a single key sequence.
 * As a small measure of efficiency, these objects get recycled from one
 * sequence to the next.
 */
function input_state () {
    this.fallthrough = {};
}
input_state.prototype = {
    constructor: input_state,
    continuation: null,
    fallthrough: null
};


/**
 * input_stack is a stack of input_states, which is to say a stack of
 * recursed sequences.  input recursion happens, for example, when a
 * minibuffer read takes place in the middle of another sequence.
 */
function input_stack () {
    this.push(new input_state());
}
input_stack.prototype = {
    constructor: input_stack,
    __proto__: Array.prototype,

    help_timer: null,
    help_displayed: false,

    toString: function () {
        return "[input_stack ("+this.length+")]";
    },
    get current () {
        return this[this.length - 1];
    },
    begin_recursion: function () {
        this.push(new input_state());
    },
    end_recursion: function () {
        this.pop();
    }
};


function input_help_timer_clear (window) {
    if (window.input.help_timer != null) {
        timer_cancel(window.input.help_timer);
        window.input.help_timer = null;
    }
}


function input_show_partial_sequence (window, I) {
    if (window.input.help_displayed)
        window.minibuffer.show(I.key_sequence.join(" "));
    else {
        window.input.help_timer = call_after_timeout(function () {
            window.minibuffer.show(I.key_sequence.join(" "));
            window.input.help_displayed = true;
            window.input.help_timer = null;
        }, keyboard_key_sequence_help_timeout);
    }
}


define_window_local_hook("keypress_hook", RUN_HOOK_UNTIL_SUCCESS,
    "A run-until-success hook available for special keypress "+
    "handling.  Handlers receive as arguments the window, an "+
    "interactive context, and the real keypress event.  The "+
    "handler is responsible for stopping event propagation, if "+
    "that is desired.");


/**
 * get_current_keymaps returns the keymap stack for the current focus
 * context of the given window.  This is the top-level keymap stack, not
 * the stack that represents any on-going key sequence.
 */
function get_current_keymaps (window) {
    var m = window.minibuffer;
    var s = m.current_state;
    if (m.active && s.keymaps)
        return s.keymaps;
    return window.buffers.current.keymaps;
}


/**
 * input_handle_sequence is the main handler for all event types which
 * can be part of a sequence.  It is a coroutine procedure which gets
 * started and resumed by various EventListeners, some of which have
 * additional, special tasks.
 */
function input_handle_sequence (event) {
    try {
        var window = this;
        var state = window.input.current;
        state.continuation = yield CONTINUATION;
        var I = new interactive_context(window.buffers.current);
        I.key_sequence = [];
        I.sticky_modifiers = 0;
        var keymaps = get_current_keymaps(window);
sequence:
        while (true) {
            switch (event.type) {
            case "keydown":
                //try the fallthrough predicates in our current keymap
                if (keymap_lookup_fallthrough(keymaps[keymaps.length - 1], event)) {
                    //XXX: need to take account of modifers, too!
                    state.fallthrough[event.keyCode] = true;
                } else
                    event_kill(event);
                break;
            case "keypress":
                window.minibuffer.clear();
                window.input.help_displayed = false;
                input_help_timer_clear(window);

                // prepare the clone
                var clone = new event_clone(event);
                clone.sticky_modifiers = I.sticky_modifiers;
                I.sticky_modifiers = 0;
                if (key_bindings_ignore_capslock && clone.charCode) {
                    let c = String.fromCharCode(clone.charCode);
                    if (clone.shiftKey)
                        clone.charCode = c.toUpperCase().charCodeAt(0);
                    else
                        clone.charCode = c.toLowerCase().charCodeAt(0);
                }

                // make the combo string
                var combo = format_key_combo(clone);
                var canabort = I.key_sequence.push(combo) > 1;
                I.combo = combo;
                I.event = clone;

                // make active keymaps visible to commands
                I.keymaps = keymaps;

                if (keypress_hook.run(window, I, event))
                    break;

                var overlay_keymap = I.overlay_keymap;

                var binding =
                    (canabort && keymap_lookup([sequence_abort_keymap], combo, event)) ||
                    (overlay_keymap && keymap_lookup([overlay_keymap], combo, event)) ||
                    keymap_lookup(keymaps, combo, event) ||
                    keymap_lookup([sequence_help_keymap], combo, event);

                // kill event for any unbound key, or any bound key which
                // is not marked fallthrough
                if (!binding || !binding.fallthrough)
                    event_kill(event);

                if (binding) {
                    if (binding.browser_object != null)
                        I.binding_browser_object = binding.browser_object;
                    if (binding.constructor == Array) {
                        keymaps = binding;
                        input_show_partial_sequence(window, I);
                    } else if (binding.command) {
                        let command = binding.command;
                        if (I.repeat == command)
                            command = binding.repeat;
                        yield call_interactively(I, command);
                        if (typeof command == "string" &&
                            interactive_commands.get(command).prefix)
                        {
                            keymaps = get_current_keymaps(window); //back to top keymap
                            input_show_partial_sequence(window, I);
                            if (binding.repeat)
                                I.repeat = command;
                        } else {
                            break sequence;
                        }
                    } else {
                        break sequence; //reachable by keypress fallthroughs
                    }
                } else {
                    window.minibuffer.message(I.key_sequence.join(" ") + " is undefined");
                    break sequence;
                }
                break;
            case "command":
                let (command = event.command) {
                    window.input.help_displayed = false;
                    input_help_timer_clear(window);
                    window.minibuffer.clear();
                    yield call_interactively(I, command);
                    if (! interactive_commands.get(command).prefix)
                        break sequence;
                }
                break;
            }
            // should we expect more events?
            event = null;
            event = yield SUSPEND;
        }
    } catch (e) {
        dump_error(e);
    } finally {
        // sequence is done
        delete state.continuation;
    }
}


function input_handle_keydown (event) {
    if (event.keyCode == 0 ||
        event.keyCode == vk_name_to_keycode.shift ||
        event.keyCode == vk_name_to_keycode.control ||
        event.keyCode == vk_name_to_keycode.alt ||
        event.keyCode == vk_name_to_keycode.caps_lock)
        return event_kill(event);
    var window = this;
    var state = window.input.current;
    if (state.continuation)
        state.continuation(event);
    else
        co_call(input_handle_sequence.call(window, event));
}


function input_handle_keypress (event) {
    if (event.keyCode == 0 && event.charCode == 0 ||
        event.keyCode == vk_name_to_keycode.caps_lock)
        return event_kill(event);
    var window = this;
    var state = window.input.current;
    if (state.continuation)
        state.continuation(event);
    else
        co_call(input_handle_sequence.call(window, event));
}


function input_handle_keyup (event) {
    if (event.keyCode == 0 ||
        event.keyCode == vk_name_to_keycode.shift ||
        event.keyCode == vk_name_to_keycode.control ||
        event.keyCode == vk_name_to_keycode.alt ||
        event.keyCode == vk_name_to_keycode.caps_lock)
        return event_kill(event);
    var window = this;
    var state = window.input.current;
    if (state.fallthrough[event.keyCode])
        delete state.fallthrough[event.keyCode];
    else
        event_kill(event);
}


// handler for command_event special events
function input_handle_command (event) {
    var window = this;
    var state = window.input.current;
    if (typeof event == 'string')
        event = new command_event(event);
    if (state.continuation)
        state.continuation(event);
    else
        co_call(input_handle_sequence.call(window, event));
}


// handler for special abort event
function input_sequence_abort (message) {
    var window = this;
    window.input.help_displayed = false;
    input_help_timer_clear(window);
    window.minibuffer.clear();
    if (message)
        window.minibuffer.show(message);
    delete window.input.current.continuation;
}


function input_initialize_window (window) {
    window.input = new input_stack();
    //window.addEventListener("keydown", input_handle_keydown, true);
    window.addEventListener("keypress", input_handle_keypress, true);
    //window.addEventListener("keyup", input_handle_keyup, true);
    //TO-DO: mousedown, mouseup, click, dblclick
}

add_hook("window_initialize_hook", input_initialize_window);


interactive("sequence-abort",
    "Abort an ongoing key sequence.",
    function (I) { I.minibuffer.message("abort sequence"); });

provide("input");
