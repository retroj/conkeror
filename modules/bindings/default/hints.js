/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("bindings/default/global.js");

define_keymap("hint_keymap", $parent = default_base_keymap);

define_key(hint_keymap, match_any_unmodified_key, null, $fallthrough);
for (let i = 0; i <= 9; ++i)
    define_key(hint_keymap, String.fromCharCode("0".charCodeAt(0) + i), "hints-handle-number");

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
