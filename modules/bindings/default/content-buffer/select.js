/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

define_key(content_buffer_select_keymap, "up", null, $fallthrough);
define_key(content_buffer_select_keymap, "down", null, $fallthrough);
define_key(content_buffer_select_keymap, "left", null, $fallthrough);
define_key(content_buffer_select_keymap, "right", null, $fallthrough);

define_key(content_buffer_select_keymap, "S-up", null, $fallthrough);
define_key(content_buffer_select_keymap, "S-down", null, $fallthrough);
define_key(content_buffer_select_keymap, "S-left", null, $fallthrough);
define_key(content_buffer_select_keymap, "S-right", null, $fallthrough);

define_key(content_buffer_select_keymap, "C-up", null, $fallthrough);
define_key(content_buffer_select_keymap, "C-down", null, $fallthrough);
define_key(content_buffer_select_keymap, "C-left", null, $fallthrough);
define_key(content_buffer_select_keymap, "C-right", null, $fallthrough);

define_key(content_buffer_select_keymap, "home", null, $fallthrough);
define_key(content_buffer_select_keymap, "end", null, $fallthrough);

define_key(content_buffer_select_keymap, "return", null, $fallthrough);

define_key(content_buffer_select_keymap, match_any_unmodified_character, null, $fallthrough);
//define_key(content_buffer_select_keymap, match_any_key, null, $fallthrough);

define_key(content_buffer_select_keymap, "escape", "unfocus"); // leave text input mode
define_key(content_buffer_select_keymap, "M-escape", "unfocus");
