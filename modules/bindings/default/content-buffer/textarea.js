/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2009 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

define_fallthrough(content_buffer_textarea_keymap, match_text_keys);

// textarea keys
define_key(content_buffer_textarea_keymap, "C-n", "forward-line");
define_key(content_buffer_textarea_keymap, "down", "forward-line");
define_key(content_buffer_textarea_keymap, "C-p", "backward-line");
define_key(content_buffer_textarea_keymap, "up", "backward-line");
define_key(content_buffer_textarea_keymap, "M-<", "beginning-of-first-line");
define_key(content_buffer_textarea_keymap, "M->", "end-of-last-line");
define_key(content_buffer_textarea_keymap, "C-home", "beginning-of-first-line");
define_key(content_buffer_textarea_keymap, "C-end", "end-of-last-line");
define_key(content_buffer_textarea_keymap, "M-v", "backward-page");
define_key(content_buffer_textarea_keymap, "page_up", "backward-page");
define_key(content_buffer_textarea_keymap, "C-o", "open-line");

define_key(content_buffer_textarea_keymap, "C-v", "forward-page");
define_key(content_buffer_textarea_keymap, "page_down", "forward-page");

define_key(content_buffer_textarea_keymap, "S-page_up", "cmd_selectPageUp");
define_key(content_buffer_textarea_keymap, "S-page_down", "cmd_selectPageDown");
