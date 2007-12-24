

var browser_elements_keymap = new keymap();
bind_universal_argument(browser_elements_keymap, "C-u");

define_key(browser_buffer_normal_keymap, "f", "hinted-follow-element");
define_key(browser_buffer_normal_keymap, "i", browser_elements_keymap,
           $hook = hints_object_class_selector("images"));

define_key(browser_buffer_normal_keymap, "n", browser_elements_keymap,
           $hook = hints_object_class_selector("links"));

define_key(browser_buffer_normal_keymap, "m", browser_elements_keymap,
           $hook = hints_object_class_selector("frames"));

define_key(browser_elements_keymap, "f", "hinted-follow-element");
