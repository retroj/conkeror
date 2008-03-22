require("element.js");

var browser_elements_keymap = new keymap();

define_key(content_buffer_normal_keymap, "i", browser_elements_keymap,
           $hook = hints_object_class_selector("images"));

define_key(content_buffer_normal_keymap, "n", browser_elements_keymap,
           $hook = hints_object_class_selector("links"));

define_key(content_buffer_normal_keymap, "m", browser_elements_keymap,
           $hook = hints_object_class_selector("frames"));

define_key(content_buffer_normal_keymap, "e", browser_elements_keymap,
           $hook = hints_object_class_selector("media"));

define_key(content_buffer_normal_keymap, "S-8 e", browser_elements_keymap,
           $hook = hints_object_class_selector("media"));

define_key(content_buffer_normal_keymap, "S-8 i", browser_elements_keymap,
           $hook = hints_object_class_selector("images"));

define_key(content_buffer_normal_keymap, "S-8 n", browser_elements_keymap,
           $hook = hints_object_class_selector("links"));

define_key(content_buffer_normal_keymap, "S-8 m", browser_elements_keymap,
           $hook = hints_object_class_selector("frames"));

define_key(content_buffer_normal_keymap, "S-8 M", browser_elements_keymap,
           $hook = hints_object_class_selector("mathml"));


function bind_element_operations(keymap) {
    define_key(keymap, "f", "follow");
    define_key(keymap, ";", "focus");
    define_key(keymap, "t", "follow-top");
    define_key(keymap, "s", "save");
    define_key(keymap, "c", "copy");
    define_key(keymap, "back_slash", "view-source");
    define_key(keymap, "x", "shell-command-on-file");
    define_key(keymap, "X", "shell-command-on-url");
    define_key(keymap, "k", "bookmark");
}

bind_element_operations(content_buffer_normal_keymap);
