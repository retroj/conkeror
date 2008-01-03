require("bindings/default/global.js");

var hint_keymap = new keymap();

define_key(hint_keymap, "C-h", default_help_keymap);

define_key(hint_keymap, kbd(match_any_unmodified_key), "hints-handle-character");
define_key(hint_keymap, "back_space", "hints-backspace");
define_key(hint_keymap, "tab", "hints-next");
define_key(hint_keymap, "right", "hints-next");
define_key(hint_keymap, "down", "hints-next");
define_key(hint_keymap, "S-tab", "hints-previous");
define_key(hint_keymap, "left", "hints-previous");
define_key(hint_keymap, "up", "hints-previous");
define_key(hint_keymap, "escape", "minibuffer-abort");
define_key(hint_keymap, "C-g", "minibuffer-abort");
define_key(hint_keymap, "return", "hints-exit");

// FIXME: this should probably be some better more general
// property, i.e. catch_all or something.
define_key(hint_keymap, kbd(match_any_key), null);
