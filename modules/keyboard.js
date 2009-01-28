/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2008 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("window.js");
require("command-line.js");

define_variable("key_bindings_ignore_capslock", false,
    "When true, the case of characters in key bindings will be based "+
    "only on whether shift was pressed--upper-case if yes, lower-case if "+
    "no.  Effectively, this overrides the capslock key.  This option has "+
    "no effect on ordinary typing in input fields.");

/* Generate vk name table  */
var keycode_to_vk_name = [];
var vk_name_to_keycode = {};
{
    let KeyEvent = Ci.nsIDOMKeyEvent;
    let prefix = "DOM_VK_";
    for (var i in KeyEvent) {
        /* Check if this is a key binding */
        if (i.substr(0, prefix.length) == prefix) {
            let name = i.substr(prefix.length).toLowerCase();
            let code = KeyEvent[i];
            keycode_to_vk_name[code] = name;
            vk_name_to_keycode[name] = code;
        }
    }
}

var abort_key = null;


/*
 * Modifiers
 */

function modifier (in_event_p, set_in_event) {
    this.in_event_p = in_event_p;
    this.set_in_event = set_in_event;
}

var modifiers = {
    A: new modifier(function (event) { return event.altKey; },
                    function (event) { event.altKey = true; }),
    C: new modifier(function (event) { return event.ctrlKey; },
                    function (event) { event.ctrlKey = true; }),
    M: new modifier(function (event) { return event.metaKey; },
                    function (event) { event.metaKey = true; }),
    S: new modifier(function (event) {
                        return (event.keyCode &&
                                event.charCode == 0 &&
                                event.shiftKey);
                    },
                    function (event) { event.shiftKey = true; })
};
var modifier_order = ['C', 'M', 'S'];

// check the platform and guess whether we should treat Alt as Meta
if (get_os() == 'Darwin') {
    // In OS X, alt is a shift-like modifier, in that we
    // only care about it for non-character events.
    modifiers.A = new modifier(
        function (event) {
            return (event.keyCode &&
                    event.charCode == 0 &&
                    event.altKey);
        },
        function (event) { event.altKey = true; });
    modifier_order = ['C', 'M', 'A', 'S'];
} else {
    modifiers.M = modifiers.A;
}



/*
 * Keymap datatype
 */

define_keywords("$parent", "$help", "$name", "$anonymous");
function keymap ()
{
    keywords(arguments);
    this.parent = arguments.$parent;
    this.bindings = {};
    this.predicate_bindings = [];
    this.help = arguments.$help;
    this.name = arguments.$name;
    this.anonymous = arguments.$anonymous;
}

function define_keymap(name) {
    keywords(arguments);
    this[name] = new keymap($name = name, forward_keywords(arguments));
}



/*
 * Key Match Predicates.
 *
 *  Predicate bindings are tried for a match after the ordinary key-combo
 * bindings.  They are predicate functions on the keypress event object.
 * When such a predicate returns a true value, its associated command,
 * keymap, or fallthrough declaration is performed.
 */

function match_any_key (event)
{
    return true;
}

function match_any_unmodified_key (event)
{
    //XXX: the meaning of "unmodified" is platform dependent. for example,
    // on OS X, Alt is used in combination with the character keys to type
    // an alternate character.  A possible solution is to set the altKey
    // property of the event to null for all keypress events on OS X.
    try {
        return event.charCode
            && !event.altKey
            && !event.metaKey
            && !event.ctrlKey
            && !event.sticky_modifiers;
    } catch (e) {return false; }
}


/*
 */

function format_key_spec(key) {
    if (key.match_function) {
        if (key.match_function == match_any_key)
            return "<any-key>";
        if (key.match_function == match_any_unmodified_key)
            return "<any-unmodified-key>";
        return "<match-function>";
    }
    return key;
}

function format_binding_sequence(seq) {
    return seq.map(function (x) {
            return format_key_spec(x.key);
        }).join(" ");
}


function lookup_key_binding(kmap, combo, event)
{
    do {
        // Check if the key matches the keycode table
        // var mods = get_modifiers(event);
        var bindings = kmap.bindings;
        var bind;
        if ((bind = bindings[combo]) != null)
            return bind;

        // Check if the key matches a predicate
        var pred_binds = kmap.predicate_bindings;
        for (var i = 0; i < pred_binds.length; ++i) {
            bind = pred_binds[i];
            if (bind.key(event))
                return bind;
        }
        kmap = kmap.parent;
    } while (kmap);
    return null;
}


/*
 * $fallthrough and $repeat are as for define_key.
 *
 * ref is the source code reference of the call to define_key.
 *
 * kmap is the keymap in which the binding is to be defined.
 *
 * keys is the key sequence being bound.  it may be necessary
 * to auto-generate new keymaps to accomodate the key sequence.
 *
 * only one of new_command and new_keymap will be given.
 * the one that is given is the thing being bound to.
 */
define_keywords("$fallthrough", "$repeat");
function define_key_internal(ref, kmap, keys, new_command, new_keymap)
{
    keywords(arguments);
    var args = arguments;
    var parent_kmap = kmap.parent;
    var final_binding; // flag to indicate the final key combo in the sequence.
    var key; // current key combo as we iterate through the sequence.

    /* Replace `bind' with the binding specified by (cmd, fallthrough) */
    function replace_binding (bind) {
        if (final_binding) {
            bind.command = new_command;
            bind.keymap = new_keymap;
            bind.fallthrough = args.$fallthrough;
            bind.source_code_reference = ref;
            bind.repeat = args.$repeat;
        } else {
            if (!bind.keymap)
                throw new Error("Key sequence has a non-keymap in prefix");
            kmap = bind.keymap;
        }
    }

    function make_binding () {
        if (final_binding) {
            return {key: key,
                    fallthrough: args.$fallthrough,
                    command: new_command,
                    keymap: new_keymap,
                    source_code_reference: ref,
                    repeat: args.$repeat,
                    bound_in: kmap};
        } else {
            let old_kmap = kmap;
            // Check for a corresponding binding a parent
            kmap = new keymap($parent = parent_kmap, $anonymous,
                              $name = old_kmap.name + " " + format_key_spec(key));
            kmap.bound_in = old_kmap;
            return {key: key,
                    keymap: kmap,
                    source_code_reference: ref,
                    bound_in: old_kmap};
        }
    }

outer:
    for (var i = 0; i < keys.length; ++i) {
        key = keys[i];
        final_binding = (i == keys.length - 1);

        // Check if the specified binding is already present in the kmap
        if (typeof(key) == "function") { // it's a match predicate
            var pred_binds = kmap.predicate_bindings;
            for (var j = 0; j < pred_binds.length; j++) {
                if (pred_binds[j].key == key) {
                    replace_binding(pred_binds[j]);
                    continue outer;
                }
            }

            if (!final_binding && parent_kmap) {
                var parent_pred_binds = parent_kmap.predicate_bindings;
                parent_kmap = null;
                for (j = 0; j < parent_pred_binds.length; j++) {
                    if (parent_pred_binds[j].key == key &&
                        parent_pred_binds[j].keymap)
                    {
                        parent_kmap = parent_pred_binds[j].keymap;
                        break;
                    }
                }
            }
            // Not already present, must be added
            pred_binds.push(make_binding());
        } else {
            var bindings = kmap.bindings;
            var binding = bindings[key];

            if (binding) {
                replace_binding(binding);
                continue outer;
            }

            if (!final_binding) {
                let temp_parent = parent_kmap;
                parent_kmap = null;
                while (temp_parent) {
                    let p_bindings = temp_parent.bindings;
                    let p_binding = p_bindings[key];
                    if (p_binding && p_binding.keymap) {
                        parent_kmap = p_binding.keymap;
                        break;
                    } else {
                        temp_parent = temp_parent.parent;
                    }
                }
            }

            bindings[key] = make_binding();
        }
    }
}

// bind key to either the keymap or command in the keymap, kmap
// keywords:
//
//  $fallthrough: (bool) let this key be process by the web page
//      or gecko.
//
//  $repeat: (commnand name) shortcut command to call if a prefix
//      command key is pressed twice in a row.
//
define_keywords("$fallthrough", "$repeat");
function define_key(kmap, keys, cmd)
{
    keywords(arguments);
    var orig_keys = keys;
    try {
        var ref = get_caller_source_code_reference();

        if (typeof(keys) == "string" && keys.length > 1)
            keys = keys.split(" ");

        if (!(typeof(keys) == "object") || !(keys instanceof Array))
            keys = [keys];

        // normalize the order of modifiers in string key combos
        keys = keys.map(
            function (k) {
                if (typeof(k) == "string")
                    return format_key_combo(unformat_key_combo(k));
                else
                    return k;
            });

        var new_command = null, new_keymap = null;
        if (typeof(cmd) == "string" || typeof(cmd) == "function")
            new_command = cmd;
        else if (cmd instanceof keymap)
            new_keymap = cmd;
        else if (cmd != null)
            throw new Error("Invalid `cmd' argument: " + cmd);

        define_key_internal(ref, kmap, keys, new_command, new_keymap,
                            forward_keywords(arguments));

    } catch (e if (typeof(e) == "string")) {
        dumpln("Warning: Error occurred while binding keys: " + orig_keys);
        dumpln(e);
    }
}



/*
 * Keypress Handler
 */

define_variable("keyboard_key_sequence_help_timeout", 0,
                "Delay (in millseconds) before the current key sequence "+
                "prefix is displayed in the minibuffer.");

define_window_local_hook("keypress_hook", RUN_HOOK_UNTIL_SUCCESS);



function copy_event (event) {
    var ev = {};
    ev.keyCode = event.keyCode;
    ev.charCode = event.charCode;
    ev.ctrlKey = event.ctrlKey;
    ev.metaKey = event.metaKey;
    ev.altKey = event.altKey;
    ev.shiftKey = event.shiftKey;
    ev.sticky_modifiers = event.sticky_modifiers;
    return ev;
}

function show_partial_key_sequence (window, state, ctx) {
    if (!state.help_displayed)
    {
        state.help_timer_ID = window.setTimeout(
            function () {
                window.minibuffer.show(ctx.key_sequence.join(" "));
                state.help_displayed = true;
                state.help_timer_ID = null;
            }, keyboard_key_sequence_help_timeout);
    }
    else
        window.minibuffer.show(ctx.key_sequence.join(" "));
}

function format_key_combo (event) {
    var combo = '';
    for each (var M in modifier_order) {
        if (modifiers[M].in_event_p(event) ||
            (event.sticky_modifiers &&
             event.sticky_modifiers.indexOf(M) != -1))
        {
            combo += (M + '-');
        }
    }
    if (event.charCode) {
        if (event.charCode == 32) {
            combo += 'space';
        } else {
            combo += String.fromCharCode(event.charCode);
        }
    } else if (event.keyCode) {
        combo += keycode_to_vk_name[event.keyCode];
    }
    return combo;
}

function unformat_key_combo (combo) {
    var event = {
        keyCode: 0,
        charCode: 0,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false
    };
    var M;
    var i = 0;
    while (combo[i+1] == '-') {
        M = combo[i];
        modifiers[M].set_in_event(event);
        i+=2;
    }
    var key = combo.substring(i);
    if (key.length == 1) {
        event.charCode = key.charCodeAt(0);
    } else if (key == 'space') {
        event.charCode = 32;
    } else {
        event.keyCode = vk_name_to_keycode[key];
    }
    return event;
}

function keypress_handler (true_event) {
    try{
        var window = this;
        var state = window.keyboard;

        var event = copy_event(true_event);

        /* Filter out events from keys like the Windows/Super/Hyper key */
        if (event.keyCode == 0 && event.charCode == 0 ||
            event.keyCode == vk_name_to_keycode.caps_lock)
            return;

        if (key_bindings_ignore_capslock && event.charCode) {
            let c = String.fromCharCode(event.charCode);
            if (event.shiftKey)
                event.charCode = c.toUpperCase().charCodeAt(0);
            else
                event.charCode = c.toLowerCase().charCodeAt(0);
        }

        /* Clear minibuffer message */
        window.minibuffer.clear();

        var binding = null;
        var done = true; // flag for end of key sequence

        var ctx;
        if (!state.current_context)
            ctx = state.current_context = { window: window, key_sequence: [], sticky_modifiers: 0 };
        else
            ctx = state.current_context;

        event.sticky_modifiers = ctx.sticky_modifiers;
        ctx.sticky_modifiers = 0;

        var combo = format_key_combo(event);
        ctx.combo = combo;
        ctx.event = event;

        // keypress_hook is used, for example, by key aliases
        if (keypress_hook.run(window, ctx, true_event))
            return;

        var top_keymap =
            state.override_keymap ||
            window.buffers.current.keymap;

        var active_keymap =
            state.active_keymap ||
            top_keymap;

        var overlay_keymap = ctx.overlay_keymap;

        binding =
            (overlay_keymap && lookup_key_binding(overlay_keymap, combo, event)) ||
            lookup_key_binding(active_keymap, combo, event);

        // Should we stop this event from being processed by the gui?
        //
        // 1) we have a binding, and the binding's fallthrough property is not
        //    true.
        //
        // 2) we are in the middle of a key sequence, and we need to say that
        //    the key sequence given has no command.
        //
        if (!binding || !binding.fallthrough)
        {
            true_event.preventDefault();
            true_event.stopPropagation();
        }

        // Finally, process the binding.
        ctx.key_sequence.push(combo);
        if (binding) {
            if (binding.keymap) {
                state.active_keymap = binding.keymap;
                show_partial_key_sequence(window, state, ctx);
                // We're going for another round
                done = false;
            } else if (binding.command) {
                let command = binding.command;
                if (ctx.repeat == command)
                    command = binding.repeat;
                call_interactively(ctx, command);
                if (typeof(command) == "string" &&
                    interactive_commands.get(command).prefix)
                {
                    state.active_keymap = null;
                    show_partial_key_sequence(window, state, ctx);
                    if (binding.repeat)
                        ctx.repeat = command;
                    done = false;
                }
            }
        } else {
            window.minibuffer.message(ctx.key_sequence.join(" ") + " is undefined");
        }

        // Clean up if we're done
        if (done)
        {
            if (state.help_timer_ID != null)
            {
                window.clearTimeout(state.help_timer_ID);
                state.help_timer_ID = null;
            }
            state.help_displayed = false;
            state.active_keymap = null;
            state.current_context = null;
        }
    } catch(e) { dump_error(e);}
}

function keyboard(window)
{
    this.window = window;
}

keyboard.prototype = {
    last_key_down_event : null,
    current_context : null,
    active_keymap : null,
    help_timer_ID : null,
    help_displayed : false,

    /* If this is non-null, it is used instead of the current buffer's
     * keymap. */
    override_keymap : null,

    set_override_keymap : function (keymap) {
        /* Clear out any in-progress key sequence. */
        this.active_keymap = null;
        this.current_context = null;
        if (this.help_timer_ID != null)
        {
            this.window.clearTimeout(this.help_timer_ID);
            this.help_timer_ID = null;
        }
        this.override_keymap = keymap;
    }
};


function keyboard_initialize_window(window)
{
    window.keyboard = new keyboard(window);

    window.addEventListener ("keypress", keypress_handler, true /* capture */,
                            false /* ignore untrusted events */);
}

add_hook("window_initialize_hook", keyboard_initialize_window);

function for_each_key_binding(keymap_or_buffer, callback) {
    var keymap;
    if (keymap_or_buffer instanceof conkeror.buffer) {
        var buffer = keymap_or_buffer;
        var window = buffer.window;
        keymap = window.keyboard.override_keymap || buffer.keymap;
    } else {
        keymap = keymap_or_buffer;
    }
    var keymap_stack = [keymap];
    var binding_stack = [];
    function helper2(bind) {
        binding_stack.push(bind);
        callback(binding_stack);
        if (bind.keymap && keymap_stack.indexOf(bind.keymap) == -1) {
            keymap_stack.push(bind.keymap);
            helper();
            keymap_stack.pop();
        }
        binding_stack.pop();
    }
    function helper() {
        while (true) {
            var keymap = keymap_stack[keymap_stack.length - 1];
            for (var i in keymap.bindings) {
                var b = keymap.bindings[i];
                helper2(b);
            }
            for (i in  keymap.predicate_bindings) {
                var bind = keymap.predicate_bindings[i];
                helper2(bind);
                var p = bind.key;
                if (p == match_any_key)
                    return;
            }
            if (keymap.parent)
                keymap_stack[keymap_stack.length - 1] = keymap.parent;
            else
                break;
        }
    }
    helper();
}

function find_command_in_keymap(keymap_or_buffer, command) {
    var list = [];

    for_each_key_binding(keymap_or_buffer, function (bind_seq) {
            var bind = bind_seq[bind_seq.length - 1];
            if (bind.command == command)
                list.push(format_binding_sequence(bind_seq));
        });
    return list;
}

define_keymap("key_binding_reader_keymap");
define_key(key_binding_reader_keymap, match_any_key, "read-key-binding-key");

define_keywords("$buffer", "$keymap");
function key_binding_reader(continuation) {
    keywords(arguments, $prompt = "Describe key:");

    this.continuation = continuation;

    if (arguments.$keymap)
        this.target_keymap = arguments.$keymap;
    else {
        var buffer = arguments.$buffer;
        var window = buffer.window;
        this.target_keymap = window.keyboard.override_keymap || buffer.keymap;
    }

    this.key_sequence = [];

    minibuffer_input_state.call(this, key_binding_reader_keymap, arguments.$prompt);
}
key_binding_reader.prototype = {
    __proto__: minibuffer_input_state.prototype,
    destroy: function () {
        if (this.continuation)
            this.continuation.throw(abort());
    }
};

function invalid_key_binding(seq) {
    var e = new Error(seq.join(" ") + " is undefined");
    e.key_sequence = seq;
    e.__proto__ = invalid_key_binding.prototype;
    return e;
}
invalid_key_binding.prototype = {
    __proto__: interactive_error.prototype
};

function read_key_binding_key(window, state, event) {
    var combo = format_key_combo(event);
    var binding = lookup_key_binding(state.target_keymap, combo, event);

    state.key_sequence.push(combo);

    if (binding == null) {
        var c = state.continuation;
        delete state.continuation;
        window.minibuffer.pop_state();
        c.throw(invalid_key_binding(state.key_sequence));
        return;
    }

    if (binding.keymap) {
        window.minibuffer._restore_normal_state();
        window.minibuffer._input_text = state.key_sequence.join(" ") + " ";
        state.target_keymap = binding.keymap;
        return;
    }

    var c = state.continuation;
    delete state.continuation;

    window.minibuffer.pop_state();

    if (c != null)
        c([state.key_sequence, binding]);
}
interactive("read-key-binding-key", null, function (I) {
    read_key_binding_key(I.window, I.minibuffer.check_state(key_binding_reader), I.event);
});

minibuffer.prototype.read_key_binding = function () {
    keywords(arguments);
    var s = new key_binding_reader((yield CONTINUATION), forward_keywords(arguments));
    this.push_state(s);
    var result = yield SUSPEND;
    yield co_return(result);
};
