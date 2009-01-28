/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2008 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("bindings/default/content-buffer/form.js");

define_keymap("content_buffer_text_keymap", $parent = content_buffer_form_keymap);

define_key(content_buffer_text_keymap, "C-a", "beginning-of-line");
define_key(content_buffer_text_keymap, "C-e", "end-of-line");
define_key(content_buffer_text_keymap, "S-back_space", "cmd_deleteCharBackward");
define_key(content_buffer_text_keymap, "back_space", "cmd_deleteCharBackward");
define_key(content_buffer_text_keymap, "M-back_space", "cmd_deleteWordBackward");
define_key(content_buffer_text_keymap, "C-d", "cmd_deleteCharForward");
define_key(content_buffer_text_keymap, "delete", "cmd_deleteCharForward");
define_key(content_buffer_text_keymap, "M-d", "cmd_deleteWordForward");
define_key(content_buffer_text_keymap, "C-delete", "cmd_deleteWordForward");
define_key(content_buffer_text_keymap, "C-b", "backward-char");
define_key(content_buffer_text_keymap, "left", "backward-char");
define_key(content_buffer_text_keymap, "M-b", "backward-word");
define_key(content_buffer_text_keymap, "C-left", "backward-word");
define_key(content_buffer_text_keymap, "M-left", "backward-word");
define_key(content_buffer_text_keymap, "C-f", "forward-char");
define_key(content_buffer_text_keymap, "right", "forward-char");
define_key(content_buffer_text_keymap, "M-f", "forward-word");
define_key(content_buffer_text_keymap, "C-right", "forward-word");
define_key(content_buffer_text_keymap, "M-right", "forward-word");
define_key(content_buffer_text_keymap, "M-w", "cmd_copy");
define_key(content_buffer_text_keymap, "C-k", "cut-to-end-of-line");
define_key(content_buffer_text_keymap, "C-t", "transpose-chars");

// 101 keys
define_key(content_buffer_text_keymap, "home", "beginning-of-line");
define_key(content_buffer_text_keymap, "end", "end-of-line");
define_key(content_buffer_text_keymap, "S-home", "cmd_selectBeginLine");
define_key(content_buffer_text_keymap, "S-end", "cmd_selectEndLine");
define_key(content_buffer_text_keymap, "C-back_space", "cmd_deleteWordBackward");
define_key(content_buffer_text_keymap, "C-S-left", "cmd_selectWordPrevious");
define_key(content_buffer_text_keymap, "C-S-right", "cmd_selectWordNext");
define_key(content_buffer_text_keymap, "S-insert", "paste-x-primary-selection");

// Nasty keys
define_key(content_buffer_text_keymap, "C-r","cmd_redo");


define_key(content_buffer_text_keymap, "C-_", "cmd_undo");
define_key(content_buffer_text_keymap, "C-x u", "cmd_undo");
define_key(content_buffer_text_keymap, "C-/", "cmd_undo");

define_key(content_buffer_text_keymap, "C-y", "cmd_paste");
define_key(content_buffer_text_keymap, "C-w", "cmd_cut");
define_key(content_buffer_text_keymap, "S-delete", "cmd_cut");
define_key(content_buffer_text_keymap, "C-x h", "cmd_selectAll");

define_key(content_buffer_text_keymap, "C-space", "set-mark");
define_key(content_buffer_text_keymap, "C-@", "set-mark");

define_key(content_buffer_text_keymap, "C-i", "edit-current-field-in-external-editor");

// This must be at the end of content_buffer_text_keymap defs so it's matched last.
define_key(content_buffer_text_keymap, match_any_unmodified_key, null, $fallthrough);
