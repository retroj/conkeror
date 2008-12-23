/**
 * (C) Copyright 2008 Nelson Elhage
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("bindings/default/content-buffer/normal.js");

define_keymap("content_buffer_caret_keymap", $parent = content_buffer_normal_keymap);

define_key(content_buffer_caret_keymap, "C-a", "caret-beginning-of-line");
define_key(content_buffer_caret_keymap, "C-e", "caret-end-of-line");
define_key(content_buffer_caret_keymap, "C-b", "caret-backward-char");
define_key(content_buffer_caret_keymap, "left", "caret-backward-char");
define_key(content_buffer_caret_keymap, "M-b", "caret-backward-word");
define_key(content_buffer_caret_keymap, "C-left", "caret-backward-word");
define_key(content_buffer_caret_keymap, "M-left", "caret-backward-word");
define_key(content_buffer_caret_keymap, "C-f", "caret-forward-char");
define_key(content_buffer_caret_keymap, "right", "caret-forward-char");
define_key(content_buffer_caret_keymap, "M-f", "caret-forward-word");
define_key(content_buffer_caret_keymap, "C-right", "caret-forward-word");
define_key(content_buffer_caret_keymap, "M-right", "caret-forward-word");
define_key(content_buffer_caret_keymap, "M-w", "cmd_copy");

// 101 keys
define_key(content_buffer_caret_keymap, "home", "caret-beginning-of-line");
define_key(content_buffer_caret_keymap, "end", "caret-end-of-line");
define_key(content_buffer_caret_keymap, "S-home", "cmd_selectBeginLine");
define_key(content_buffer_caret_keymap, "S-end", "cmd_selectEndLine");
define_key(content_buffer_caret_keymap, "C-S-left", "cmd_selectWordPrevious");
define_key(content_buffer_caret_keymap, "C-S-right", "cmd_selectWordNext");

define_key(content_buffer_caret_keymap, "C-space", "set-mark");

define_key(content_buffer_caret_keymap, "C-n", "caret-forward-line");
define_key(content_buffer_caret_keymap, "down", "caret-forward-line");
define_key(content_buffer_caret_keymap, "C-p", "caret-backward-line");
define_key(content_buffer_caret_keymap, "up", "caret-backward-line");
define_key(content_buffer_caret_keymap, "M-<", "caret-beginning-of-first-line");
define_key(content_buffer_caret_keymap, "M->", "caret-end-of-last-line");
define_key(content_buffer_caret_keymap, "M-v", "caret-backward-page");
define_key(content_buffer_caret_keymap, "page_up", "caret-backward-page");
define_key(content_buffer_caret_keymap, "C-v", "caret-forward-page");
define_key(content_buffer_caret_keymap, "page_down", "caret-forward-page");
define_key(content_buffer_caret_keymap, "back_space", "caret-backward-page");
define_key(content_buffer_caret_keymap, "space","caret-forward-page");
