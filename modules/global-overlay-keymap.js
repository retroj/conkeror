/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("keyboard.js");

var global_overlay_keymap = new keymap();

function global_overlay_keymap_handler(window, ctx, true_event) {
    var binding = lookup_key_binding(global_overlay_keymap, ctx.event);
    if (!binding)
        return false;
    if (!binding.fallthrough)
    {
        true_event.preventDefault();
        true_event.stopPropagation();
    }

    if (binding.command)
        call_interactively(ctx, binding.command);

    return true;
}

define_global_mode("global_overlay_keymap_mode",
                   function () {
                       add_hook("key_press_hook", global_overlay_keymap_handler);
                   },
                   function () {
                       remove_hook("key_press_hook", global_overlay_keymap_handler);
                   });

function define_key_alias(typed_key, generated_key) {
    typed_key = kbd(typed_key);
    generated_key = kbd(generated_key);
    var formatted = format_key_spec(generated_key[0]);
    var name = "generate-key-event:" + formatted;
    interactive(name,
                "Generate a fake key press event for the key: " + formatted,
                function (I) {
                    send_key_as_event(I.window, I.buffer.focused_element, generated_key);
                });
    define_key(global_overlay_keymap, typed_key, name);
    global_overlay_keymap_mode(true);
}
ignore_function_for_get_caller_source_code_reference("define_key_alias");


function define_sticky_modifier(typed_key, modifiers) {
    typed_key = kbd(typed_key);
    var mod_str = "";
    for (var i = 0; i < modifier_names.length; ++i)
    {
        if (modifiers & (1 << i)) {
            if (mod_str.length > 0)
                mod_str = mod_str + "-";
            mod_str = mod_str + modifier_names[i];
        }
    }
    if (mod_str.length == 0)
        throw new Error("Invalid modifiers: " + modifiers);
    var name = "sticky-modifiers:" + mod_str;
    interactive(name, "Set sticky modifiers: " + mod_str, function (I) {
        I.sticky_modifiers |= modifiers;
    });
    define_key(global_overlay_keymap, typed_key, name);
    global_overlay_keymap_mode(true);
}
ignore_function_for_get_caller_source_code_reference("define_sticky_modifier");
