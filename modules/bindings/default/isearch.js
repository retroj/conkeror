require("bindings/default/global.js");

define_keymap("isearch_keymap", $parent = default_base_keymap);

define_key(isearch_keymap, "back_space",    "isearch-backspace");
define_key(isearch_keymap, "C-r",           "isearch-continue-backward");
define_key(isearch_keymap, "C-s",           "isearch-continue-forward");
define_key(isearch_keymap, "C-g",           "minibuffer-abort");
define_key(isearch_keymap, "escape",        "minibuffer-abort");

define_key(isearch_keymap, match_any_unmodified_key, null, $fallthrough);
define_key(isearch_keymap, match_any_key, "isearch-done");
