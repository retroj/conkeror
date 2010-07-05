/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2010 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

define_fallthrough(minibuffer_base_keymap, match_any_unmodified_character);


/*
 * minibuffer_keymap
 */
define_fallthrough(minibuffer_keymap, match_any_unmodified_character);

define_key(minibuffer_keymap, "return", "exit-minibuffer");
define_key(minibuffer_keymap, "M-p", "minibuffer-history-previous");
define_key(minibuffer_keymap, "M-n", "minibuffer-history-next");
define_key(minibuffer_keymap, "C-g", "minibuffer-abort");
define_key(minibuffer_keymap, "tab", "minibuffer-complete");
define_key(minibuffer_keymap, "S-tab", "minibuffer-complete-previous");

define_key(minibuffer_keymap, "down", "minibuffer-complete");
define_key(minibuffer_keymap, "up", "minibuffer-complete-previous");
define_key(minibuffer_keymap, "C-n", "minibuffer-complete");
define_key(minibuffer_keymap, "C-p", "minibuffer-complete-previous");

define_key(minibuffer_keymap, "escape", "minibuffer-abort");
define_key(minibuffer_keymap, "M-escape", "minibuffer-abort");


/*
 * minibuffer_space_completion_keymap
 */
define_fallthrough(minibuffer_space_completion_keymap, match_any_unmodified_character);

define_key(minibuffer_space_completion_keymap, "space", "minibuffer-complete");


/*
 * single_character_options_minibuffer_keymap
 */
define_key(single_character_options_minibuffer_keymap, "C-g", "minibuffer-abort");
define_key(single_character_options_minibuffer_keymap, match_any_unmodified_character,
           "single-character-options-enter-character");
define_key(single_character_options_minibuffer_keymap, "escape", "minibuffer-abort");
define_key(single_character_options_minibuffer_keymap, "M-escape", "minibuffer-abort");


/*
 * minibuffer_message_keymap
 */
define_key(minibuffer_message_keymap, "C-g", "minibuffer-abort");


/*
 * read_buffer_keymap
 */
define_fallthrough(read_buffer_keymap, match_any_unmodified_character);

define_key(read_buffer_keymap, "C-k", "read-buffer-kill-buffer");

