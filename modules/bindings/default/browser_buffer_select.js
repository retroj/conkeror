require("bindings/default/browser_buffer_normal.js");

var browser_buffer_select_keymap = new keymap($parent = browser_buffer_normal_keymap);

define_key(browser_buffer_select_keymap, "up", null, $fallthrough);
define_key(browser_buffer_select_keymap, "down", null, $fallthrough);
define_key(browser_buffer_select_keymap, "left", null, $fallthrough);
define_key(browser_buffer_select_keymap, "right", null, $fallthrough);

define_key(browser_buffer_select_keymap, "S-up", null, $fallthrough);
define_key(browser_buffer_select_keymap, "S-down", null, $fallthrough);
define_key(browser_buffer_select_keymap, "S-left", null, $fallthrough);
define_key(browser_buffer_select_keymap, "S-right", null, $fallthrough);

define_key(browser_buffer_select_keymap, "C-up", null, $fallthrough);
define_key(browser_buffer_select_keymap, "C-down", null, $fallthrough);
define_key(browser_buffer_select_keymap, "C-left", null, $fallthrough);
define_key(browser_buffer_select_keymap, "C-right", null, $fallthrough);

define_key(browser_buffer_select_keymap, "home", null, $fallthrough);
define_key(browser_buffer_select_keymap, "end", null, $fallthrough);

define_key(browser_buffer_select_keymap, "return", null, $fallthrough);

define_key(browser_buffer_select_keymap, match_any_unmodified_key, null, $fallthrough);
//define_key(browser_buffer_select_keymap, match_any_key, null, $fallthrough);

define_key(browser_buffer_select_keymap, "escape", "unfocus"); // leave text input mode
