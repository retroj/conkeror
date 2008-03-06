require("bindings/default/global.js");

var isearch_keymap = new keymap($parent = default_base_keymap);

define_key(isearch_keymap, "back_space",    "isearch-backspace");
define_key(isearch_keymap, "C-r",           "isearch-continue-backward");
define_key(isearch_keymap, "C-s",           "isearch-continue-forward");
define_key(isearch_keymap, "C-g",           "isearch-abort");
define_key(isearch_keymap, "escape",        "isearch-abort");

define_key(isearch_keymap, match_any_unmodified_key, "isearch-add-character");
define_key(isearch_keymap, "return", "isearch-done");
