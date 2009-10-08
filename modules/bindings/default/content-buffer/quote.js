/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 * (C) Copyright 2009 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

define_keymap("content_buffer_quote_next_keymap");
define_keymap("content_buffer_quote_keymap");

define_fallthrough(content_buffer_quote_next_keymap, match_any_key);
define_key(content_buffer_quote_next_keymap, match_any_key, "content-buffer-update-input-mode-for-focus", $fallthrough);

define_fallthrough(content_buffer_quote_keymap, match_not_escape_key);
define_key(content_buffer_quote_keymap, "escape", "content-buffer-update-input-mode-for-focus");
define_key(content_buffer_quote_keymap, "M-escape", "content-buffer-update-input-mode-for-focus");
define_key(content_buffer_quote_keymap, match_any_key, null, $fallthrough);
