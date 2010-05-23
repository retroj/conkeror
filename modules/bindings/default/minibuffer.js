/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2009 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

define_fallthrough(minibuffer_base_keymap, match_any_unmodified_character);

define_key(minibuffer_base_keymap, match_any_unmodified_character, null, $fallthrough);


/*
 * minibuffer_base_keymap
 */
define_key(minibuffer_base_keymap, "C-a", "minibuffer-beginning-of-line");
define_key(minibuffer_base_keymap, "C-e", "minibuffer-end-of-line");
define_key(minibuffer_base_keymap, "back_space", "minibuffer-cmd_deleteCharBackward");
define_key(minibuffer_base_keymap, "S-back_space", "minibuffer-cmd_deleteCharBackward");
define_key(minibuffer_base_keymap, "M-back_space", "minibuffer-cmd_deleteWordBackward");
define_key(minibuffer_base_keymap, "C-back_space", "minibuffer-cmd_deleteWordBackward");
define_key(minibuffer_base_keymap, "C-d", "minibuffer-cmd_deleteCharForward");
define_key(minibuffer_base_keymap, "delete", "minibuffer-cmd_deleteCharForward");
define_key(minibuffer_base_keymap, "M-d", "minibuffer-cmd_deleteWordForward");
define_key(minibuffer_base_keymap, "C-delete", "minibuffer-cmd_deleteWordForward");
define_key(minibuffer_base_keymap, "C-t", "transpose-chars");
define_key(minibuffer_base_keymap, "C-b", "minibuffer-backward-char");
define_key(minibuffer_base_keymap, "left", "minibuffer-backward-char");
define_key(minibuffer_base_keymap, "M-b", "minibuffer-backward-word");
define_key(minibuffer_base_keymap, "C-left", "minibuffer-backward-word");
define_key(minibuffer_base_keymap, "M-left", "minibuffer-backward-word");
define_key(minibuffer_base_keymap, "C-f", "minibuffer-forward-char");
define_key(minibuffer_base_keymap, "right", "minibuffer-forward-char");
define_key(minibuffer_base_keymap, "M-f", "minibuffer-forward-word");
define_key(minibuffer_base_keymap, "C-right", "minibuffer-forward-word");
define_key(minibuffer_base_keymap, "M-right", "minibuffer-forward-word");
define_key(minibuffer_base_keymap, "C-y", "minibuffer-cmd_paste");
define_key(minibuffer_base_keymap, "M-w", "minibuffer-cmd_copy");
define_key(minibuffer_base_keymap, "C-w", "minibuffer-cmd_cut");
define_key(minibuffer_base_keymap, "C-k", "minibuffer-cmd_deleteToEndOfLine");

define_key(minibuffer_base_keymap, "home", "minibuffer-beginning-of-line");
define_key(minibuffer_base_keymap, "end", "minibuffer-end-of-line");
define_key(minibuffer_base_keymap, "S-home", "minibuffer-cmd_selectBeginLine");
define_key(minibuffer_base_keymap, "S-end", "minibuffer-cmd_selectEndLine");
define_key(minibuffer_base_keymap, "S-left", "minibuffer-cmd_selectCharPrevious");
define_key(minibuffer_base_keymap, "S-right", "minibuffer-cmd_selectCharNext");
define_key(minibuffer_base_keymap, "C-S-left", "minibuffer-cmd_selectWordPrevious");
define_key(minibuffer_base_keymap, "C-S-right", "minibuffer-cmd_selectWordNext");
define_key(minibuffer_base_keymap, "S-insert", "paste-x-primary-selection");
define_key(minibuffer_base_keymap, "M-(", "insert-parentheses");

define_key(minibuffer_base_keymap, "C-space", "minibuffer-set-mark");
define_key(minibuffer_base_keymap, "C-@", "minibuffer-set-mark");

define_key(minibuffer_base_keymap, "C-r", "minibuffer-cmd_redo");


/*
 * minibuffer_keymap
 */
define_keymap("minibuffer_keymap", $parent = minibuffer_base_keymap);
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
 * single_character_options_minibuffer_keymap
 */
define_keymap("single_character_options_minibuffer_keymap", $parent = default_base_keymap);

define_key(single_character_options_minibuffer_keymap, "C-g", "minibuffer-abort");
define_key(single_character_options_minibuffer_keymap, match_any_unmodified_character,
           "single-character-options-enter-character");
define_key(single_character_options_minibuffer_keymap, "escape", "minibuffer-abort");
define_key(single_character_options_minibuffer_keymap, "M-escape", "minibuffer-abort");


/*
 * minibuffer_message_keymap
 */
define_keymap("minibuffer_message_keymap");
define_key(minibuffer_message_keymap, "C-g", "minibuffer-abort");


/*
 * read_buffer_keymap
 */
define_keymap('read_buffer_keymap', $parent = minibuffer_keymap);
define_fallthrough(read_buffer_keymap, match_any_unmodified_character);

define_key(read_buffer_keymap, "C-k", "read-buffer-kill-buffer");

