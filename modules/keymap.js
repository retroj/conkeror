/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2010 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

/* Generate vk name table  */
var keycode_to_vk_name = [];
var vk_name_to_keycode = {};
let (KeyEvent = Ci.nsIDOMKeyEvent,
     prefix = "DOM_VK_") {
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
                        if (event.shiftKey) {
                            var name;
                            if (event.keyCode)
                                name = keycode_to_vk_name[event.keyCode];
                            return ((name && name.length > 1) ||
                                    (event.charCode == 32) ||
                                    (event.button != null));
                        }
                        return false;
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
            if (event.altKey) {
                var name;
                if (event.keyCode)
                    name = keycode_to_vk_name[event.keyCode];
                return ((name && name.length > 1) ||
                        (event.charCode == 32) ||
                        (event.button != null));
            }
            return false;
        },
        function (event) { event.altKey = true; });
    modifier_order = ['C', 'M', 'A', 'S'];
} else {
    modifiers.M = modifiers.A;
}



/*
 * Combos
 */

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
        if (event.charCode == 32)
            combo += 'space';
        else
            combo += String.fromCharCode(event.charCode);
    } else if (event.keyCode) {
        combo += keycode_to_vk_name[event.keyCode];
    } else if (event.button != null) {
        combo += "mouse" + (event.button + 1);
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
    var len = combo.length - 2;
    var res;
    while (i < len && combo[i+1] == '-') {
        M = combo[i];
        modifiers[M].set_in_event(event);
        i+=2;
    }
    var key = combo.substring(i);
    if (key.length == 1)
        event.charCode = key.charCodeAt(0);
    else if (key == 'space')
        event.charCode = 32;
    else if (vk_name_to_keycode[key])
        event.keyCode = vk_name_to_keycode[key];
    else if (key.substring(0, 5) == 'mouse')
        event.button = parseInt(key.substring(5));
    return event;
}



/*
 * Keymap datatype
 */

define_keywords("$parent", "$help", "$name", "$anonymous");
function keymap () {
    keywords(arguments);
    this.parent = arguments.$parent;
    this.bindings = {};
    this.predicate_bindings = [];
    this.fallthrough = [];
    this.help = arguments.$help;
    this.name = arguments.$name;
    this.anonymous = arguments.$anonymous;
}

function define_keymap (name) {
    keywords(arguments);
    this[name] = new keymap($name = name, forward_keywords(arguments));
}



/*
 * Key Match Predicates.
 */

function define_key_match_predicate (name, description, predicate) {
    conkeror[name] = predicate;
    conkeror[name].name = name;
    conkeror[name].description = description;
    return conkeror[name];
}

define_key_match_predicate('match_any_key', 'any key',
    function (event) true);

// should be renamed to match_any_unmodified_character
define_key_match_predicate('match_any_unmodified_character', 'any unmodified character',
    function (event) {
        // this predicate can be used for both keypress and keydown
        // fallthroughs.
        try {
            return ((event.type == 'keypress' && event.charCode)
                    || event.keyCode > 31)
                && !modifiers.A.in_event_p(event)
                && !event.metaKey
                && !event.ctrlKey
                && !event.sticky_modifiers;
        } catch (e) { return false; }
    });

define_key_match_predicate('match_checkbox_keys', 'checkbox keys',
    function (event) {
        return event.keyCode == 32
            && !event.shiftKey
            && !event.metaKey
            && !event.altKey
            && !event.ctrlKey;
        //XXX: keycode fallthroughs don't support sticky modifiers
    });

define_key_match_predicate('match_text_keys', 'text editing keys',
    function (event) {
        return ((event.type == 'keypress' && event.charCode)
                || event.keyCode == 13 || event.keyCode > 31)
            && !event.ctrlKey
            && !event.metaKey
            && !modifiers.A.in_event_p(event);
        //XXX: keycode fallthroughs don't support sticky modifiers
    });


/*
 */

function format_key_spec (key) {
    if (key instanceof Function) {
        if (key.description)
            return "<"+key.description+">";
        if (key.name)
            return "<"+key.name+">";
        return "<anonymous match function>";
    }
    return key;
}

function format_binding_sequence (seq) {
    return seq.map(function (x) {
            return format_key_spec(x.key);
        }).join(" ");
}


function keymap_lookup (keymaps, combo, event) {
    var i = keymaps.length - 1;
    var kmap = keymaps[i];
    var new_kmaps;
    while (true) {
        var bindings = kmap.bindings;
        var bind = bindings[combo];
        if (new_kmaps) {
            if (bind) {
                if (bind.keymap)
                    new_kmaps.unshift(bind.keymap);
                else
                    return new_kmaps;
            }
        } else if (bind) {
            if (bind.keymap)
                new_kmaps = [bind.keymap];
            else
                return bind;
        } else {
            var pred_binds = kmap.predicate_bindings;
            for (var j = 0, pblen = pred_binds.length; j < pblen; ++j) {
                bind = pred_binds[j];
                if (bind.key(event))
                    return bind;
            }
        }
        if (kmap.parent)
            kmap = kmap.parent;
        else if (i > 0)
            kmap = keymaps[--i];
        else if (new_kmaps)
            return new_kmaps
        else
            return null;
    }
}


function keymap_lookup_fallthrough (keymap, event) {
    var predicates = keymap.fallthrough;
    for (var i = 0, plen = predicates.length; i < plen; ++i) {
        if (predicates[i](event))
            return true;
    }
    return false;
}


function for_each_key_binding (keymaps, callback) {
    var binding_sequence = [];
    function helper (keymap) {
        var binding;
        for each (binding in keymap.bindings) {
            binding_sequence.push(binding);
            callback(binding_sequence);
            if (binding.keymap)
                helper(binding.keymap);
            binding_sequence.pop();
        }
        for each (binding in keymap.predicate_bindings) {
            binding_sequence.push(binding);
            callback(binding_sequence);
            if (binding.keymap)
                helper(binding.keymap);
            binding_sequence.pop();
        }
    }
    //outer loop is to go down the parent-chain of keymaps
    var i = keymaps.length - 1;
    var keymap = keymaps[i];
    while (true) {
        helper(keymap);
        if (keymap.parent)
            keymap = keymap.parent;
        else if (i > 0)
            keymap = keymaps[--i];
        else
            break;
    }
}


function keymap_lookup_command (keymaps, command) {
    var list = [];
    for_each_key_binding(keymaps, function (bind_seq) {
            var bind = bind_seq[bind_seq.length - 1];
            if (bind.command == command)
                list.push(format_binding_sequence(bind_seq));
        });
    return list;
}






/*
 * $fallthrough, $repeat and $browser_object are as for define_key.
 *
 * ref is the source code reference of the call to define_key.
 *
 * kmap is the keymap in which the binding is to be defined.
 *
 * seq is the key sequence being bound.  it may be necessary
 * to auto-generate new keymaps to accomodate the key sequence.
 *
 * only one of new_command and new_keymap will be given.
 * the one that is given is the thing being bound to.
 */
define_keywords("$fallthrough", "$repeat", "$browser_object");
function define_key_internal (ref, kmap, seq, new_command, new_keymap) {
    keywords(arguments);
    var args = arguments;
    var last_in_sequence; // flag to indicate the final key combo in the sequence.
    var key; // current key combo as we iterate through the sequence.
    var undefine_key = (new_command == null) &&
        (new_keymap == null) &&
        (! args.$fallthrough);

    /* Replace `bind' with the binding specified by (cmd, fallthrough) */
    function replace_binding (bind) {
        if (last_in_sequence) {
            bind.command = new_command;
            bind.keymap = new_keymap;
            bind.fallthrough = args.$fallthrough;
            bind.source_code_reference = ref;
            bind.repeat = args.$repeat;
            bind.browser_object = args.$browser_object;
        } else {
            if (!bind.keymap)
                throw new Error("Key sequence has a non-keymap in prefix");
            kmap = bind.keymap;
        }
    }

    function make_binding () {
        if (last_in_sequence) {
            return { key: key,
                     fallthrough: args.$fallthrough,
                     command: new_command,
                     keymap: new_keymap,
                     source_code_reference: ref,
                     repeat: args.$repeat,
                     browser_object: args.$browser_object,
                     bound_in: kmap };
        } else {
            let old_kmap = kmap;
            kmap = new keymap($anonymous,
                              $name = old_kmap.name + " " + format_key_spec(key));
            kmap.bound_in = old_kmap;
            return { key: key,
                     keymap: kmap,
                     source_code_reference: ref,
                     bound_in: old_kmap };
        }
    }

sequence:
    for (var i = 0, slen = seq.length; i < slen; ++i) {
        key = seq[i];
        last_in_sequence = (i == slen - 1);

        if (typeof key == "function") { // it's a match predicate
            // Check if the binding is already present in the keymap
            var pred_binds = kmap.predicate_bindings;
            for (var j = 0, pblen = pred_binds.length; j < pblen; j++) {
                if (pred_binds[j].key == key) {
                    if (last_in_sequence && undefine_key)
                        pred_binds.splice(j, 1);
                    else
                        replace_binding(pred_binds[j]);
                    continue sequence;
                }
            }
            if (! undefine_key)
                pred_binds.push(make_binding());
        } else {
            // Check if the binding is already present in the keymap
            var bindings = kmap.bindings;
            var binding = bindings[key];
            if (binding) {
                if (last_in_sequence && undefine_key)
                    delete bindings[key];
                else
                    replace_binding(binding);
                continue sequence;
            }
            if (! undefine_key)
                bindings[key] = make_binding();
        }
    }
}

/**
 * bind SEQ to a keymap or command CMD in keymap KMAP.
 *
 *   If CMD is the special value `fallthrough', it will be bound as a
 * fallthrough key.
 *
 * keywords:
 *
 *  $fallthrough: specifies that the keypress event will fall through
 *      to gecko.  Note, by this method, only keypress will fall through.
 *      Keyup and keydown will still be blocked.
 *
 *  $repeat: (command name) shortcut command to call if a prefix
 *      command key is pressed twice in a row.
 *
 *  $browser_object: (browser object) Override the default
 *      browser-object for the command.
 */
define_keywords("$fallthrough", "$repeat", "$browser_object");
function define_key (kmap, seq, cmd) {
    keywords(arguments);
    var orig_seq = seq;
    try {
        var ref = get_caller_source_code_reference();

        if (typeof seq == "string" && seq.length > 1)
            seq = seq.split(" ");

        if (!(typeof seq == "object") || !(seq instanceof Array))
            seq = [seq];

        // normalize the order of modifiers in key combos
        seq = seq.map(
            function (k) {
                if (typeof(k) == "string")
                    return format_key_combo(unformat_key_combo(k));
                else
                    return k;
            });

        var new_command = null;
        var new_keymap = null;
        if (typeof cmd == "string" || typeof cmd == "function")
            new_command = cmd;
        else if (cmd instanceof keymap)
            new_keymap = cmd;
        else if (cmd != null)
            throw new Error("Invalid `cmd' argument: " + cmd);

        define_key_internal(ref, kmap, seq, new_command, new_keymap,
                            forward_keywords(arguments));

    } catch (e if (typeof e == "string")) {
        dumpln("Warning: Error occurred while binding sequence: " + orig_seq);
        dumpln(e);
    }
}


function undefine_key (kmap, seq) {
    define_key(kmap, seq);
}


/**
 * define_fallthrough
 *
 *   Takes a keymap and a predicate on an event.  Fallthroughs defined by
 * these means will cause all three of keydown, keypress, and keyup to
 * fall through to gecko, whereas those defined by the $fallthrough
 * keyword to define_key only affect keypress events.
 *
 *   The limitations of this method are that only the keyCode is available
 * to the predicate, not the charCode, and keymap inheritance is not
 * available for these "bindings".
 */
function define_fallthrough (keymap, predicate) {
    keymap.fallthrough.push(predicate);
}


/*
 * Minibuffer Read Key Binding
 */

define_keymap("key_binding_reader_keymap");
define_key(key_binding_reader_keymap, match_any_key, "read-key-binding-key");

define_keywords("$keymap");
function key_binding_reader (minibuffer, continuation) {
    keywords(arguments, $prompt = "Describe key:");
    minibuffer_input_state.call(this, minibuffer, key_binding_reader_keymap, arguments.$prompt);
    this.continuation = continuation;
    if (arguments.$keymap)
        this.target_keymap = arguments.$keymap;
    else
        this.target_keymap = get_current_keymaps(this.minibuffer.window).slice();
    this.key_sequence = [];
}
key_binding_reader.prototype = {
    constructor: key_binding_reader,
    __proto__: minibuffer_input_state.prototype,
    destroy: function () {
        if (this.continuation)
            this.continuation.throw(abort());
        minibuffer_input_state.prototype.destroy.call(this);
    }
};

function invalid_key_binding (seq) {
    var e = new Error(seq.join(" ") + " is undefined");
    e.key_sequence = seq;
    e.__proto__ = invalid_key_binding.prototype;
    return e;
}
invalid_key_binding.prototype = {
    constructor: invalid_key_binding,
    __proto__: interactive_error.prototype
};

function read_key_binding_key (window, state, event) {
    var combo = format_key_combo(event);
    var binding = keymap_lookup(state.target_keymap, combo, event);

    state.key_sequence.push(combo);

    if (binding == null) {
        var c = state.continuation;
        delete state.continuation;
        window.minibuffer.pop_state();
        c.throw(invalid_key_binding(state.key_sequence));
        return;
    }

    if (binding.constructor == Array) { //keymaps stack
        window.minibuffer._restore_normal_state();
        window.minibuffer._input_text = state.key_sequence.join(" ") + " ";
        state.target_keymap = binding;
        return;
    }

    var c = state.continuation;
    delete state.continuation;

    window.minibuffer.pop_state();

    if (c != null)
        c([state.key_sequence, binding]);
}
interactive("read-key-binding-key",
    "Handle a keystroke in the key binding reader minibuffer state.",
     function (I) {
         read_key_binding_key(I.window,
                              I.minibuffer.check_state(key_binding_reader),
                              I.event);
     });

minibuffer.prototype.read_key_binding = function () {
    keywords(arguments);
    var s = new key_binding_reader(this, (yield CONTINUATION), forward_keywords(arguments));
    this.push_state(s);
    var result = yield SUSPEND;
    yield co_return(result);
};

provide("keymap");
