
var KeyEvent = Components.interfaces.nsIDOMKeyEvent;

var keycode_to_name = [];
var name_to_keycode = new Object();

/* Generate keyCode to string  and string to keyCode mapping tables.  */
function generate_key_tables()
{
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
    if (code  == 0)
        return "<invalid>";
    var name = keycode_to_name[code];
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
    if (key.match_function)
        return "<match-function>";
    return format_key_press(key.keyCode, key.modifiers);
}

function format_key_event(event)
{
    return format_key_press(event.keyCode, get_modifiers(event));
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
        (event.shiftKey ? MOD_SHIFT: 0);
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
        if (name.length == 1)
        {
            code = name.charCodeAt(0);
            var A_code = 'A'.charCodeAt(0);
            var Z_code = 'Z'.charCodeAt(0);
            var a_code = 'a'.charCodeAt(0);
            var z_code = 'z'.charCodeAt(0);
            if (code >= A_code && code <= Z_code)
            {
                // Automatically handle capital letters to mean S-letter.
                parsed_modifiers |= MOD_SHIFT;
            }
            else if (code >= a_code && code <= z_code)
            {
                // Lowercase letters must be mapped to uppercase
                // codes, since that is how key codes are defined.
                code = code + A_code - a_code;
            }
        } else {
            if (!(name in name_to_keycode))
                throw "Invalid key specification: " + spec;
            code = name_to_keycode[name.toLowerCase()];
        }
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
    var args = arguments;
    
    if (typeof(keys) == "string" && keys.length > 1)
        keys = keys.split(" ");
    if (!(keys instanceof Array))
        keys = [keys];

    var new_command = null, new_keymap = null;
    if (typeof(cmd) == "string")
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
                bind.fallthrough = args.$falllthrough;
                bind.hook = args.$hook;
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
                        command: new_command, keymap: new_keymap };
            }
            else
            {
                // Check for a corresponding binding a parent
                kmap = new keymap($parent = parent_kmap);
                return {key: key, keymap: kmap};
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

/* USER PREFERENCE */
var keyboard_key_sequence_help_timeout = 0;

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
            ctx = state.current_context = { window: window, key_sequence: [] };
        else
            ctx = state.current_context;

        ctx.event = event;

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

function keyboard()
{
}

keyboard.prototype = {
    last_key_down_event : null,
    current_context : null,
    active_keymap : null,
    help_timer_ID : null,
    help_displayed : false,

    /* If this is non-null, it is used instead of the current buffer's
     * keymap. */
    override_keymap : null
};


function keyboard_initialize_window(window)
{
    window.keyboard = new keyboard();

    window.addEventListener ("keydown", key_down_handler, true /* capture */,
                            false /* ignore untrusted events */);
    window.addEventListener ("keypress", key_press_handler, true /* capture */,
                            false /* ignore untrusted events */);
}

add_hook("window_initialize_hook", keyboard_initialize_window);
