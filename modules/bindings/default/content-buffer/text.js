/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2008 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("bindings/default/content-buffer/normal.js");

define_keymap("content_buffer_text_keymap", $parent = content_buffer_normal_keymap);

define_key(content_buffer_text_keymap, "C-a", "beginning-of-line", $category = "Movement");
define_key(content_buffer_text_keymap, "C-e", "end-of-line", $category = "Movement");
define_key(content_buffer_text_keymap, "back_space", "cmd_deleteCharBackward", $category = "Editing");
define_key(content_buffer_text_keymap, "M-back_space", "cmd_deleteWordBackward", $category = "Editing");
define_key(content_buffer_text_keymap, "C-d", "cmd_deleteCharForward", $category = "Editing");
define_key(content_buffer_text_keymap, "delete", "cmd_deleteCharForward", $category = "Editing");
define_key(content_buffer_text_keymap, "M-d", "cmd_deleteWordForward", $category = "Editing");
define_key(content_buffer_text_keymap, "C-b", "backward-char", $category = "Movement");
define_key(content_buffer_text_keymap, "left", "backward-char", $category = "Movement");
define_key(content_buffer_text_keymap, "M-b", "backward-word", $category = "Movement");
define_key(content_buffer_text_keymap, "C-left", "backward-word", $category = "Movement");
define_key(content_buffer_text_keymap, "M-left", "backward-word", $category = "Movement");
define_key(content_buffer_text_keymap, "C-f", "forward-char", $category = "Movement");
define_key(content_buffer_text_keymap, "right", "forward-char", $category = "Movement");
define_key(content_buffer_text_keymap, "M-f", "forward-word", $category = "Movement");
define_key(content_buffer_text_keymap, "C-right", "forward-word", $category = "Movement");
define_key(content_buffer_text_keymap, "M-right", "forward-word", $category = "Movement");
define_key(content_buffer_text_keymap, "M-w", "cmd_copy", $category = "Selection");
define_key(content_buffer_text_keymap, "C-k", "cut-to-end-of-line", $category = "Editing");

// 101 keys
define_key(content_buffer_text_keymap, "home", "beginning-of-line", $category = "Movement");
define_key(content_buffer_text_keymap, "end", "end-of-line", $category = "Movement");
define_key(content_buffer_text_keymap, "S-home", "cmd_selectBeginLine", $category = "Selection");
define_key(content_buffer_text_keymap, "S-end", "cmd_selectEndLine", $category = "Selection");
define_key(content_buffer_text_keymap, "C-back_space", "cmd_deleteWordBackward", $category = "Editing");
define_key(content_buffer_text_keymap, "C-S-left", "cmd_selectWordPrevious", $category = "Selection");
define_key(content_buffer_text_keymap, "C-S-right", "cmd_selectWordNext", $category = "Selection");
define_key(content_buffer_text_keymap, "S-insert", "paste-x-primary-selection", $category = "Selection");

// Nasty keys
define_key(content_buffer_text_keymap, "C-r","cmd_redo", $category = "Editing");


define_key(content_buffer_text_keymap, "C-S-subtract", "cmd_undo", $category = "Editing");
define_key(content_buffer_text_keymap, "C-x u", "cmd_undo", $category = "Editing");
define_key(content_buffer_text_keymap, "C-/", "cmd_undo", $category = "Editing");

define_key(content_buffer_text_keymap, "C-y", "cmd_paste", $category = "Selection");
define_key(content_buffer_text_keymap, "C-w", "cmd_cut", $category = "Selection");
define_key(content_buffer_text_keymap, "S-delete", "cmd_cut", $category = "Selection");
define_key(content_buffer_text_keymap, "C-x h", "cmd_selectAll", $category = "Selection");

define_key(content_buffer_text_keymap, "C-space", "set-mark", $category = "Selection");

define_key(content_buffer_text_keymap, "C-i", "edit-current-field-in-external-editor", $category = "Editing");

// This must be at the end of content_buffer_text_keymap defs so it's matched last.
define_key(content_buffer_text_keymap, match_any_unmodified_key, null, $fallthrough);
