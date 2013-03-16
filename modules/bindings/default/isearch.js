/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2009 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

define_fallthrough(isearch_keymap, match_any_unmodified_character);

define_key(isearch_keymap, match_any_unmodified_character, null, $fallthrough);

define_key(isearch_keymap, "back_space", "isearch-backspace");
define_key(isearch_keymap, "C-r", "isearch-continue-backward");
define_key(isearch_keymap, "C-s", "isearch-continue-forward");
define_key(isearch_keymap, "C-g", "minibuffer-abort");
define_key(isearch_keymap, "escape", "minibuffer-abort");
define_key(isearch_keymap, "M-escape", "minibuffer-abort");
define_key(isearch_keymap, "C-y", "yank");

define_key(isearch_keymap, match_any_key, "isearch-done");
