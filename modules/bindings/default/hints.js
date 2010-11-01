/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 * (C) Copyright 2009-2010 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

define_fallthrough(hint_keymap, match_any_unmodified_character);

define_key(hint_keymap, match_hint_digit, "hints-handle-number");
define_key(hint_keymap, match_any_unmodified_character, null, $fallthrough);

define_key(hint_keymap, "back_space", "hints-backspace");
define_key(hint_keymap, "tab", "hints-next");
define_key(hint_keymap, "down", "hints-next");
define_key(hint_keymap, "C-s", "hints-next");
define_key(hint_keymap, "C-n", "hints-next");
define_key(hint_keymap, "S-tab", "hints-previous");
define_key(hint_keymap, "up", "hints-previous");
define_key(hint_keymap, "C-r", "hints-previous");
define_key(hint_keymap, "C-p", "hints-previous");
define_key(hint_keymap, "escape", "minibuffer-abort");
define_key(hint_keymap, "M-escape", "minibuffer-abort");
define_key(hint_keymap, "C-g", "minibuffer-abort");
define_key(hint_keymap, "return", "hints-exit");
define_key(hint_keymap, "C-q", "hints-quote-next");


define_fallthrough(hint_quote_next_keymap, match_any_unmodified_character);
define_key(hint_quote_next_keymap, match_any_unmodified_character, null, $fallthrough);
