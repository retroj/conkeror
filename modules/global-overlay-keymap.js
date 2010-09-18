/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 * (C) Copyright 2008-2009 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

require("input.js");

define_keymap("global_overlay_keymap");


function global_overlay_keymap_handler (window, I, true_event) {
    var binding = keymap_lookup([global_overlay_keymap], I.combo, I.event);
    if (!binding)
        return false;
    if (!binding.fallthrough)
        event_kill(true_event);
    I.key_sequence.pop();
    if (binding.command)
        co_call(call_interactively(I, binding.command));
    return true;
}


define_global_mode("global_overlay_keymap_mode",
                   function () {
                       add_hook("keypress_hook", global_overlay_keymap_handler);
                   },
                   function () {
                       remove_hook("keypress_hook", global_overlay_keymap_handler);
                   });


function define_key_alias (typed_key, generated_key) {
    var name = "generate-key-event:"+generated_key;
    interactive(name,
        "Generate a fake key press event for the key: "+generated_key,
        function (I) {
            call_after_timeout(function () {
                send_key_as_event(I.window,
                                  I.buffer.focused_element,
                                  generated_key);
            }, 0);
        });
    define_key(global_overlay_keymap, typed_key, name);
    global_overlay_keymap_mode(true);
}
ignore_function_for_get_caller_source_code_reference("define_key_alias");


function define_sticky_modifier (typed_key, modifiers) {
    var name = "sticky-modifiers:"+modifiers;
    interactive(name, "Set sticky modifiers: "+modifiers,
                function (I) {
                    I.sticky_modifiers = modifiers;
                });
    define_key(global_overlay_keymap, typed_key, name);
    global_overlay_keymap_mode(true);
}
ignore_function_for_get_caller_source_code_reference("define_sticky_modifier");

provide("global-overlay-keymap");
