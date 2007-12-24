require("browser_elements.js");

var browser_elements_keymap = new keymap();
bind_universal_argument(browser_elements_keymap, "C-u");

define_key(browser_buffer_normal_keymap, "i", browser_elements_keymap,
           $hook = hints_object_class_selector("images"));

define_key(browser_buffer_normal_keymap, "n", browser_elements_keymap,
           $hook = hints_object_class_selector("links"));

define_key(browser_buffer_normal_keymap, "m", browser_elements_keymap,
           $hook = hints_object_class_selector("frames"));

function bind_element_operations(keymap) {
    define_key(keymap, "f", "browser-element-follow");
    define_key(keymap, "F", "browser-element-follow-other-buffer");
    define_key(keymap, ";", "browser-element-focus");
    define_key(keymap, "t", "browser-element-show-top");
    define_key(keymap, "s", "browser-element-save");
    define_key(keymap, "c", "browser-element-copy");
}

bind_element_operations(browser_buffer_normal_keymap);
bind_element_operations(browser_elements_keymap);
