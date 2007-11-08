
var KeyEvent = Components.interfaces.nsIDOMKeyEvent;

var keycode_to_name = [];
var name_to_keycode = new Object();
var charcode_to_keycode = [];


/* This function is a hack to map charCodes to key codes. */
function generate_charcode_to_keycode_table()
{
    // Check if the user preferences contain a mapping table already
    var data = null;
    try {
        data = conkeror.preferences.getCharPref("conkeror.charCodeMappingData");
    } catch (e) { }
    if (data)
    {
        var entries = data.split(",");
        for (var i = 0; i < entries.length; i += 2)
        {
            var num1 = parseInt(entries[i]);
            if (num1 != entries[i])
                continue;
            var num2 = parseInt(entries[i+1]);
            if (num2 != entries[i+1])
                continue;
            charcode_to_keycode[num1] = num2;
        }
        return;
    }

    // Add the letters and digits as a default, since they are sure to
    // be correct.
    var code_a = 'a'.charCodeAt(0);
    var code_z = 'z'.charCodeAt(0);

    var code_A = 'A'.charCodeAt(0);
    var code_Z = 'Z'.charCodeAt(0);

    var code_0 = '0'.charCodeAt(0);
    var code_9 = '9'.charCodeAt(0);

    for (var i = code_a; i <= code_z; ++i)
        charcode_to_keycode[i] = i - code_a + code_A;

    for (var i = code_A; i <= code_Z; ++i)
        charcode_to_keycode[i] = i;

    for (var i = code_0; i <= code_9; ++i)
        charcode_to_keycode[i] = i;
}


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
    generate_charcode_to_keycode_table();
}

generate_key_tables();

var context_kmaps = [];
var top_kmap = null;
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
function define_key (kmap, key, cmd, fallthrough)
{
    // Allow the user to specify a string as a key
    if (typeof key == "string")
        key = kbd(key);

    /* Replace `bind' with the binding specified by (cmd, fallthrough) */
    function replace_binding(bind)
    {
        if (typeof cmd == "string" || typeof cmd == "function")
        {
            bind.command = cmd;
            bind.keymap = null;
        } else {
            bind.command = null;
            bind.keymap = cmd;
        }
        bind.fallthrough = fallthrough;
    }

    function make_binding()
    {
        var bind = { key: key, fallthrough: fallthrough };
        if (typeof cmd == "string" || typeof cmd == "function")
            bind.command = cmd;
        else
            bind.keymap = cmd;
        return bind;
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
                return;
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
            return;
        } else if (!arr)
        {
            arr = (keycode_binds[key.keyCode] = []);
        }
        arr[key.modifiers] = make_binding();
    }
}

function make_keymap ()
{
    /* For efficiency, a table indexed by the key code, and then by
     * the modifiers is used to lookup key bindings, rather than
     * looping through all bindings in the key map to find one.  The
     * array keycode_bindings is indexed by the keyCode; if the
     * corresponding element for a keyCode is non-null, it is itself
     * an array indexed by the result of get_modifiers (i.e. from 0 to 7).
     * As before, match_function-based bindings are stored as a simple
     * list, predicate_bindings. */
    var k = { parent: null,
              keycode_bindings : [],
              predicate_bindings : [] };
    return k;
}

function make_context_keymap (predicate)
{
    var k = make_keymap();
    k.predicate = predicate;
    return k;
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
    window.g_last_key_down_event = copy_event(event);
    window.g_last_char_code = null;
    window.g_last_key_code = null;
}

function key_press_handler(trueEvent)
{
    var window = this;
    //window.dumpln("key press: " + trueEvent.charCode);
    // Always ignore the current event --- just use gCommandLastEvent
    if (!window.g_last_key_down_event)
        return;
    var event = window.g_last_key_down_event;
    // Augment event with the charCode from the keypress
    event.charCode = trueEvent.charCode;
    if (trueEvent.keyCode)
        event.keyCode = trueEvent.keyCode;
    else if (window.g_last_char_code != null
        && (window.g_last_char_code != trueEvent.charCode
            || window.g_last_key_code != trueEvent.keyCode))
    {
        /* Mozilla failed to give us a key down event; use hack to get a keyCode anyway */
        event.keyCode = charcode_to_keycode[trueEvent.charCode];
        //window.dumpln("bug turned up: fake keyCode: " + event.keyCode);
    }
    window.g_last_char_code = trueEvent.charCode;
    window.g_last_key_code = trueEvent.keyCode;
    //window.dumpln("Processing key: " + conkeror.format_key_press(event.keyCode, conkeror.get_modifiers(event)));
    try {
        // kmap contains the keys and commands we're looking for.

        /* The current key map is a per-frame property; there is no
           reason to try to duplicate Emacs behavior here, since it is
           counter-intuitive. */
        var kmap = window.current_kmap;
        if (!kmap) kmap = conkeror.top_kmap;

        var binding = null;
        var done = true;

        window.clearMessage();

        // Make a fake event
        window.gCommandLastEvent = event;


        // First check if there's an overlay kmap
        if (window.overlay_kmap != null) {
            binding = conkeror.lookup_key_binding (window.overlay_kmap, event);
            if (binding == null) {
                // disengage the universal keymap.
                /* The overlay kmap is also per-frame */
                window.overlay_kmap = null;
                //alert (gPrefixArg);
            }
        }

        ///XXX: context can override overlay.  is this right?
        ///
        /// consider: you hit C-u, thus enabling an overlay map.  then you hit `1'.
        ///           There is a good case to be made that this character key should
        ///           go to the gui control, not the overlay map.
        ///
        ///
        if (kmap == conkeror.top_kmap) {
            // If we are not in the middle of a key sequence, context keymaps
            // get a chance to take the key.
            //
            // Try the predicate of each context keymap until we find one that
            // matches.
            //
//             if (document.commandDispatcher.focusedElement)
//                 dumpln (conkeror.dump_obj (document.commandDispatcher.focusedElement));
            for (var i = 0; i < conkeror.context_kmaps.length; i++) {
                /* Predicates are passed the top-level frame on which
                   the event occurred, since all key handling is
                   per-frame. */
                if (conkeror.context_kmaps[i].predicate (window, window.document.commandDispatcher.focusedElement)) {
                    binding = conkeror.lookup_key_binding(conkeror.context_kmaps[i], event);
                    //alert (window.dump_obj (binding));
                    break;
                }
            }
        }

        // Finally, top_kmap and friends get dibs.
        //
        if (binding == null) {
            binding = conkeror.lookup_key_binding (kmap, event);
        }

        // Should we stop this event from being processed by the gui?
        //
        // 1) we have a binding, and the binding's fallthrough property is not
        //    true.
        //
        // 2) we are in the middle of a key sequence, and we need to say that
        //    the key sequence given has no command.
        //
        if ((binding && ! binding.fallthrough) ||
            kmap != conkeror.top_kmap)
        {
            trueEvent.preventDefault();
            trueEvent.stopPropagation();
        }

        // Finally, process the binding.
        if (binding) {
            if (binding.keymap) {
                window.current_kmap = binding.keymap;
                window.gKeySeq.push(conkeror.format_key_press(event.keyCode, conkeror.get_modifiers(event)));
                if (!window.gKeyTimeout)
                    window.gKeyTimerID = window.setTimeout(function () {
                            window.message(window.gKeySeq.join(" "));
                            window.gKeyTimeout = true;
                            window.gKeyTimerID = null;
                        }, 2000);
                else
                    window.message(window.gKeySeq.join(" "));
                // We're going for another round
                done = false;
            } else if (binding.command) {
                conkeror.call_interactively.call (window, binding.command);
            }
        } else {
            // No binding was found.  If this is the universal abort_key, then
            // abort().
            if (conkeror.match_binding(conkeror.abort_key, event))
                window.abort();

            else if (window.current_kmap)
            {
                window.gKeySeq.push(conkeror.format_key_press(event.keyCode, conkeror.get_modifiers(event)));
                window.message(window.gKeySeq.join(" ") + " is undefined");
            }

            /*
            window.dumpln("No match for key press: "
                          + conkeror.format_key_press(event.keyCode, conkeror.get_modifiers(event)));
            */
        }

        // Clean up if we're done
        if (done) {
            if (window.gKeyTimerID != null)
            {
                window.clearTimeout(window.gKeyTimerID);
                window.gKeyTimerID = null;
            }
            window.gKeySeq = [];
            window.current_kmap = null;
        }

    } catch(e){window.alert(e);}
}
