require("window.js");

var keycode_to_name = [];
var name_to_keycode = new Object();
var shifted_keycode_to_name = [];
var name_to_shifted_keycode = [];

/* Generate keyCode to string  and string to keyCode mapping tables.  */
function generate_key_tables()
{
    var KeyEvent = Ci.nsIDOMKeyEvent;
    function map(code, name) {
        keycode_to_name[code] = name;
        name_to_keycode[name] = code;
    }

    var prefix = "DOM_VK_";
    for (i in KeyEvent)
    {
        /* Check if this is a key binding */
        if (i.substr(0, prefix.length) == prefix)
        {
            var name = i.substr(prefix.length).toLowerCase();
            var code = KeyEvent[i];
            keycode_to_name[code] = name;
            name_to_keycode[name] = code;
        }
    }

    /* Add additional mappings for improved display */
    map(KeyEvent.DOM_VK_BACK_SLASH, "\\");
    map(KeyEvent.DOM_VK_OPEN_BRACKET, "[");
    map(KeyEvent.DOM_VK_CLOSE_BRACKET, "]");
    map(KeyEvent.DOM_VK_SEMICOLON, ";");
    map(KeyEvent.DOM_VK_COMMA, ",");
    map(KeyEvent.DOM_VK_PERIOD, ".");
    map(KeyEvent.DOM_VK_SLASH, "/");
    map(KeyEvent.DOM_VK_SUBTRACT, "-");
    map(KeyEvent.DOM_VK_PAGE_DOWN, "pgdn");
    map(KeyEvent.DOM_VK_PAGE_UP, "pgup");
    map(KeyEvent.DOM_VK_EQUALS, "=");


    /* Add additional shifted keycodes for improved display */
    function smap(code, name) {
        shifted_keycode_to_name[code] = name;
        name_to_shifted_keycode[name] = code;
    }

    for (var i = 0; i < 26; ++i) {
        var code = KeyEvent.DOM_VK_A + i;
        var name = String.fromCharCode(i + "A".charCodeAt(0));
        smap(code, name);
    }
    smap(KeyEvent.DOM_VK_SEMICOLON, ":");
    smap(KeyEvent.DOM_VK_1, "!");
    smap(KeyEvent.DOM_VK_2, "@");
    smap(KeyEvent.DOM_VK_3, "#");
    smap(KeyEvent.DOM_VK_4, "$");
    smap(KeyEvent.DOM_VK_5, "%");
    smap(KeyEvent.DOM_VK_6, "^");
    smap(KeyEvent.DOM_VK_7, "&");
    smap(KeyEvent.DOM_VK_8, "*");
    smap(KeyEvent.DOM_VK_9, "(");
    smap(KeyEvent.DOM_VK_0, ")");
    smap(KeyEvent.DOM_VK_EQUALS, "+");
    smap(KeyEvent.DOM_VK_SUBTRACT, "_");
    smap(KeyEvent.DOM_VK_COMMA, "<");
    smap(KeyEvent.DOM_VK_PERIOD, ">");
    smap(KeyEvent.DOM_VK_SLASH, "?");

}

generate_key_tables();

var abort_key = null;

const MOD_CTRL = 0x1;
const MOD_META = 0x2;
const MOD_SHIFT = 0x4;

// Note: For elements of the modifier_names array, an element at index
// i should correspond to the modifier mask (1 << i).
var modifier_names = ["C", "M", "S"];

function format_key_press(code, modifiers)
{
    if (code == 0)
        return "<invalid>";
    var name;
    if ((modifiers & MOD_SHIFT) && (code in shifted_keycode_to_name))  {
        name = shifted_keycode_to_name[code];
        modifiers &= ~MOD_SHIFT;
    } else
        name = keycode_to_name[code];
    if (!name)
        name = String.fromCharCode(code);
    var out = "";
    if (modifiers)
    {
        for (var i = 0; i < modifier_names.length; ++i)
        {
            if (modifiers & (1 << i))
                out = out + modifier_names[i] + "-";
        }
    }
    out = out + name;
    return out;
}

function format_key_spec(key) {
    if (key.match_function) {
        if (key.match_function == match_any_key)
            return "<any-key>";
        if (key.match_function == match_any_unmodified_key)
            return "<any-unmodified-key>";
        return "<match-function>";
    }
    return format_key_press(key.keyCode, key.modifiers);
}

function format_key_event(event)
{
    return format_key_press(event.keyCode, get_modifiers(event));
}

function format_binding_sequence(seq) {
    return seq.map(function (x) {
            return format_key_spec(x.key);
        }).join(" ");
}

// Key Matching Functions.  These are functions that may be passed to kbd
// in place of key code or char code.  They take an event object as their
// argument and turn true if the event matches the class of keys that they
// represent.
//
function match_any_key (event)
{
    return true;
}

function meta_pressed (event)
{
    return event.altKey || event.metaKey;
}

function get_modifiers(event)
{
    // Shift is always included in the modifiers, if it is included in
    // the event.
    return (event.ctrlKey ? MOD_CTRL:0) |
        (meta_pressed(event) ? MOD_META:0) |
        (event.shiftKey ? MOD_SHIFT: 0) |
        event.sticky_modifiers;
}

/* This function is no longer used for normal keymap lookups.  It is
 * only used to check if the current key matches the abort key. */
function match_binding(key, event)
{
    return (key.keyCode
            && event.keyCode == key.keyCode
            && get_modifiers(event) == key.modifiers)
        || (key.match_function && key.match_function (event));
}

function lookup_key_binding(kmap, event)
{
    do {
        // Check if the key matches the keycode table
        var mods = get_modifiers(event);
        var keycode_binds = kmap.keycode_bindings;
        var arr;;
        var bind;
        if ((arr = keycode_binds[event.keyCode]) != null &&
            (bind = arr[mods]) != null)
            return bind;

        // Check if the key matches a predicate
        var pred_binds = kmap.predicate_bindings;
        for (var i = 0; i < pred_binds.length; ++i)
        {
            var bind = pred_binds[i];
            if (bind.key.match_function(event))
                return bind;
        }
        kmap = kmap.parent;
    } while (kmap);
    return null;
}

function match_any_unmodified_key (event)
{
    try {
        return event.charCode
            && !meta_pressed(event)
            && !event.ctrlKey;
    } catch (e) {return false; }
}

function kbd (spec, mods)
{
    if (typeof(spec) == "object")
        return spec;
    var key = {};
    if (typeof spec == "function")
        key.match_function = spec;
    else if (typeof spec == "string")
    {
        /* Attempt to parse a key specification.  In order to allow
         * the user to specify the "-" key literally, special case the
         * parsing of that. */
        var parts;
        if (spec.substr(spec.length - 1) == "-")
        {
            parts = spec.substr(0, spec.length - 1).split("-");
            parts.push("-");
        } else
            parts = spec.split("-");
        var parsed_modifiers = 0;
        if (parts.length > 1)
        {
            // Attempt to parse modifiers
            for (var i = 0; i < parts.length - 1; ++i)
            {
                var k = modifier_names.indexOf(parts[i]);
                if (k < 0)
                    continue;
                var mod = 1 << k;
                parsed_modifiers |= mod;
            }
        }
        // Attempt to lookup keycode
        var name = parts[parts.length - 1];
        var code = null;
        if (name in name_to_keycode)
            code = name_to_keycode[name];
        else if (name in name_to_shifted_keycode) {
            code = name_to_shifted_keycode[name];
            parsed_modifiers |= MOD_SHIFT;
        } else
            throw "Invalid key specification: " + spec;
        key.keyCode = code;
        if (mods)
            parsed_modifiers |= mods;
        key.modifiers = parsed_modifiers;
    }
    else {
        key.keyCode = spec;
        if (mods)
            key.modifiers = mods;
        else
            key.modifiers = 0;
    }

    return key;
}

// bind key to either the keymap or command in the keymap, kmap
define_keywords("$fallthrough", "$hook");
function define_key(kmap, keys, cmd)
{
    keywords(arguments);

    var ref = get_caller_source_code_reference();

    var args = arguments;
    
    if (typeof(keys) == "string" && keys.length > 1)
        keys = keys.split(" ");
    if (!(keys instanceof Array))
        keys = [keys];

    var new_command = null, new_keymap = null;
    if (typeof(cmd) == "string" || typeof(cmd) == "function")
        new_command = cmd;
    else if (cmd instanceof keymap)
        new_keymap = cmd;
    else if (cmd != null)
        throw new Error("Invalid `cmd' argument: " + cmd);

    var parent_kmap = kmap.parent;

outer:
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var final_binding = (i == keys.length - 1);

        if (typeof key == "string")
            key = kbd(key);
        else if (typeof key == "function")
            key = kbd(key);

        /* Replace `bind' with the binding specified by (cmd, fallthrough) */
        function replace_binding(bind)
        {
            if (final_binding) {
                bind.command = new_command;
                bind.keymap = new_keymap;
                bind.fallthrough = args.$fallthrough;
                bind.hook = args.$hook;
                bind.source_code_reference = ref;
            } else {
                if (!bind.keymap)
                    throw new Error("Key sequence has a non-keymap in prefix");
                kmap = bind.keymap;
            }
        }

        function make_binding()
        {
            if (final_binding) {
                return {key: key, fallthrough: args.$fallthrough, hook: args.$hook,
                        command: new_command, keymap: new_keymap,
                        source_code_reference: ref};
            }
            else
            {
                // Check for a corresponding binding a parent
                kmap = new keymap($parent = parent_kmap);
                return {key: key, keymap: kmap,
                        source_code_reference: ref};
            }
        }

        // Check if the specified binding is already present in the kmap
        if (key.match_function)
        {
            var pred_binds = kmap.predicate_bindings;
            for (var i = 0; i < pred_binds.length; i++)
            {
                var cur_bind = pred_binds[i];
                if (cur_bind.key.match_function == key.match_function)
                {
                    replace_binding(cur_bind);
                    continue outer;
                }
            }

            if (!final_binding && parent_kmap) {
                var parent_pred_binds = parent_kmap.predicate_bindings;
                parent_kmap = null;
                for (var i = 0; i < parent_pred_binds.length; i++)
                {
                    var cur_bind = parent_pred_binds[i];
                    if (cur_bind.key.match_function == key.match_function && cur_bind.keymap)
                    {
                        parent_kmap = cur_bind.keymap;
                        break;
                    }
                }
            }
            // Not already present, must be added
            pred_binds.push(make_binding());
        } else
        {
            // This is a binding by keycode: look it up in the table
            var keycode_binds = kmap.keycode_bindings;
            var arr = keycode_binds[key.keyCode];

            if (arr && arr[key.modifiers])
            {
                replace_binding(arr[key.modifiers]);
                continue outer;
            }

            if (!final_binding && parent_kmap) {
                var p_keycode_binds = parent_kmap.keycode_bindings;
                parent_kmap = null;
                var p_arr = p_keycode_binds[key.keyCode];
                var p_bind;
                if (p_arr && (p_bind = p_arr[key.modifiers]) != null && p_bind.keymap)
                    parent_kmap = p_bind.keymap;
            }

            if (!arr)
                arr = (keycode_binds[key.keyCode] = []);

            arr[key.modifiers] = make_binding();
        }
    }
}

define_keywords("$parent", "$help");
function keymap ()
{
    keywords(arguments);
    /* For efficiency, a table indexed by the key code, and then by
     * the modifiers is used to lookup key bindings, rather than
     * looping through all bindings in the key map to find one.  The
     * array keycode_bindings is indexed by the keyCode; if the
     * corresponding element for a keyCode is non-null, it is itself
     * an array indexed by the result of get_modifiers (i.e. from 0 to 7).
     * As before, match_function-based bindings are stored as a simple
     * list, predicate_bindings. */
    this.parent = arguments.$parent;
    this.keycode_bindings = [];
    this.predicate_bindings = [];
    this.help = arguments.$help;
}

function copy_event(event)
{
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

function key_down_handler(event)
{
    var window = this;
    //window.dumpln("key down: " + conkeror.format_key_press(event.keyCode, conkeror.get_modifiers(event)));

    var state = window.keyboard;
    state.last_key_down_event = copy_event(event);
    state.last_char_code = null;
    state.last_key_code = null;
}

define_variable("keyboard_key_sequence_help_timeout", 0,
                "Delay (in millseconds) before the current key sequence prefix is displayed in the minibuffer.");

define_window_local_hook("key_press_hook", RUN_HOOK_UNTIL_SUCCESS);

function key_press_handler(true_event)
{
    try{
        var window = this;
        var state = window.keyboard;

        /* ASSERT(state.last_key_down_event != null); */

        var event = state.last_key_down_event;
        event.charCode = true_event.charCode;

        // If the true_event includes a keyCode, we can just use that
        if (true_event.keyCode)
            event.keyCode = true_event.keyCode;

        /* Filter out events from keys like the Windows/Super/Hyper key */
        if (event.keyCode == 0)
            return;

        /* Clear minibuffer message */
        window.minibuffer.clear();    

        var binding = null;
        var done = true;

        var ctx;
        if (!state.current_context)
            ctx = state.current_context = { window: window, key_sequence: [], sticky_modifiers: 0 };
        else
            ctx = state.current_context;

        event.sticky_modifiers = ctx.sticky_modifiers;
        ctx.sticky_modifiers = 0;

        ctx.event = event;

        if (key_press_hook.run(window, ctx, true_event))
            return;

        var active_keymap =
            state.active_keymap ||
            state.override_keymap ||
            window.buffers.current.keymap;
        var overlay_keymap = ctx.overlay_keymap;

        binding =
            lookup_key_binding(active_keymap, event) ||
            (overlay_keymap && lookup_key_binding(overlay_keymap, event));

        ctx.overlay_keymap = null;

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
        ctx.key_sequence.push(format_key_event(event));
        if (binding) {
            if (binding.keymap) {
                if (binding.hook)
                    binding.hook.call(null, ctx, active_keymap, overlay_keymap);
                state.active_keymap = binding.keymap;
                if (!state.help_displayed)
                {
                    state.help_timer_ID = window.setTimeout(function () {
                            window.minibuffer.show(ctx.key_sequence.join(" "));
                            state.help_displayed = true;
                            state.help_timer_ID = null;
                        }, keyboard_key_sequence_help_timeout);
                }
                else
                    window.minibuffer.show(ctx.key_sequence.join(" "));

                // We're going for another round
                done = false;
            } else if (binding.command) {
                call_interactively(ctx, binding.command);
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

    window.addEventListener ("keydown", key_down_handler, true /* capture */,
                            false /* ignore untrusted events */);
    window.addEventListener ("keypress", key_press_handler, true /* capture */,
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
        var modifier_keys_masked = false;
        var keycode_masks = [];
        while (true) {
            var keymap = keymap_stack[keymap_stack.length - 1];
            for (var i in keymap.keycode_bindings) {
                var b = keymap.keycode_bindings[i];
                if (!(i in keycode_masks))
                    keycode_masks[i] = [];
                for (var j in b) {
                    if (modifier_keys_masked && j != 0)
                        continue;
                    if (!keycode_masks[i][j]) {
                        helper2(b[j]);
                        keycode_masks[i][j] = true;
                    }
                }
            }
            for (var i in  keymap.predicate_bindings) {
                var bind = keymap.predicate_bindings[i];
                helper2(bind);
                var p = bind.key.match_function;
                if (p == match_any_key)
                    return;
                if (p == match_any_unmodified_key)
                    modifier_keys_masked = true;
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

var key_binding_reader_keymap = new keymap();
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
    
    minibuffer_state.call(this, key_binding_reader_keymap, arguments.$prompt);
}
key_binding_reader.prototype = {
    __proto__: minibuffer_state.prototype,
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
    var binding = lookup_key_binding(state.target_keymap, event);

    state.key_sequence.push(format_key_event(event));

    if (binding == null) {
        var c = state.continuation;
        delete state.continuation;
        window.minibuffer.pop_state();
        c.throw(invalid_key_binding(state.key_sequence));
        return;
    }

    if (binding.keymap) {
        window.minibuffer._ensure_input_area_showing();
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
interactive("read-key-binding-key", function (I) {
    read_key_binding_key(I.window, I.minibuffer.check_state(key_binding_reader), I.event);
});

minibuffer.prototype.read_key_binding = function () {
    keywords(arguments);
    var s = new key_binding_reader((yield CONTINUATION), forward_keywords(arguments));
    this.push_state(s);
    var result = yield SUSPEND;
    yield co_return(result);
};
