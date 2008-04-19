/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2008 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("bindings/default/content-buffer/text.js");

define_keymap("content_buffer_textarea_keymap", $parent = content_buffer_text_keymap);

// textarea keys
define_key(content_buffer_textarea_keymap, "C-n", "forward-line", $category = "Movement");
define_key(content_buffer_textarea_keymap, "down", "forward-line", $category = "Movement");
define_key(content_buffer_textarea_keymap, "C-p", "backward-line", $category = "Movement");
define_key(content_buffer_textarea_keymap, "up", "backward-line", $category = "Movement");
define_key(content_buffer_textarea_keymap, "M-<", "beginning-of-first-line", $category = "Movement");
define_key(content_buffer_textarea_keymap, "M->", "end-of-last-line", $category = "Movement");
define_key(content_buffer_textarea_keymap, "M-v", "backward-page", $category = "Movement");
define_key(content_buffer_textarea_keymap, "page_up", "backward-page", $category = "Movement");

define_key(content_buffer_textarea_keymap, "C-v", "forward-page", $category = "Movement");
define_key(content_buffer_textarea_keymap, "page_down", "forward-page", $category = "Movement");

// 101 keys
define_key(content_buffer_textarea_keymap, "S-page_up", "cmd_selectPageUp", $category = "Selection");
define_key(content_buffer_textarea_keymap, "S-page_down", "cmd_selectPageDown", $category = "Selection");
