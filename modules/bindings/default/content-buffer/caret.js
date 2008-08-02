/**
 * (C) Copyright 2008 Nelson Elhage
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("bindings/default/content-buffer/normal.js");

define_keymap("content_buffer_caret_keymap", $parent = content_buffer_normal_keymap);

define_key(content_buffer_caret_keymap, "C-a", "caret-beginning-of-line", $category = "Movement");
define_key(content_buffer_caret_keymap, "C-e", "caret-end-of-line", $category = "Movement");
define_key(content_buffer_caret_keymap, "C-b", "caret-backward-char", $category = "Movement");
define_key(content_buffer_caret_keymap, "left", "caret-backward-char", $category = "Movement");
define_key(content_buffer_caret_keymap, "M-b", "caret-backward-word", $category = "Movement");
define_key(content_buffer_caret_keymap, "C-left", "caret-backward-word", $category = "Movement");
define_key(content_buffer_caret_keymap, "M-left", "caret-backward-word", $category = "Movement");
define_key(content_buffer_caret_keymap, "C-f", "caret-forward-char", $category = "Movement");
define_key(content_buffer_caret_keymap, "right", "caret-forward-char", $category = "Movement");
define_key(content_buffer_caret_keymap, "M-f", "caret-forward-word", $category = "Movement");
define_key(content_buffer_caret_keymap, "C-right", "caret-forward-word", $category = "Movement");
define_key(content_buffer_caret_keymap, "M-right", "caret-forward-word", $category = "Movement");
define_key(content_buffer_caret_keymap, "M-w", "cmd_copy", $category = "Selection");

// 101 keys
define_key(content_buffer_caret_keymap, "home", "caret-beginning-of-line", $category = "Movement");
define_key(content_buffer_caret_keymap, "end", "caret-end-of-line", $category = "Movement");
define_key(content_buffer_caret_keymap, "S-home", "cmd_selectBeginLine", $category = "Selection");
define_key(content_buffer_caret_keymap, "S-end", "cmd_selectEndLine", $category = "Selection");
define_key(content_buffer_caret_keymap, "C-S-left", "cmd_selectWordPrevious", $category = "Selection");
define_key(content_buffer_caret_keymap, "C-S-right", "cmd_selectWordNext", $category = "Selection");
define_key(content_buffer_caret_keymap, "S-insert", "paste-x-primary-selection", $category = "Selection");

define_key(content_buffer_caret_keymap, "C-space", "set-mark", $category = "Selection");

define_key(content_buffer_caret_keymap, "C-n", "caret-forward-line", $category = "Movement");
define_key(content_buffer_caret_keymap, "down", "caret-forward-line", $category = "Movement");
define_key(content_buffer_caret_keymap, "C-p", "caret-backward-line", $category = "Movement");
define_key(content_buffer_caret_keymap, "up", "caret-backward-line", $category = "Movement");
define_key(content_buffer_caret_keymap, "M-<", "caret-beginning-of-first-line", $category = "Movement");
define_key(content_buffer_caret_keymap, "M->", "caret-end-of-last-line", $category = "Movement");
define_key(content_buffer_caret_keymap, "M-v", "caret-backward-page", $category = "Movement");
define_key(content_buffer_caret_keymap, "page_up", "caret-backward-page", $category = "Movement");
