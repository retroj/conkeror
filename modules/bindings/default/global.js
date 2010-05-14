/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

define_key(default_help_keymap, "a", "apropos-command");
define_key(default_help_keymap, "b", "describe-bindings");
define_key(default_help_keymap, "f", "describe-command");
define_key(default_help_keymap, "v", "describe-variable");
define_key(default_help_keymap, "k", "describe-key");
define_key(default_help_keymap, "c", "describe-key-briefly");
define_key(default_help_keymap, "p", "describe-preference");
define_key(default_help_keymap, "i", "help-page");
define_key(default_help_keymap, "t", "tutorial");
define_key(default_help_keymap, "w", "where-is");

define_key(default_base_keymap, "C-h", default_help_keymap);
define_key(default_base_keymap, "f1", default_help_keymap);


define_key(sequence_help_keymap, "C-h", "describe-active-bindings");


define_key(sequence_abort_keymap, "C-g", "sequence-abort");


/**
 * Note: Most buffer keymaps should set this as the parent.
 */
define_key(default_global_keymap, "M-x", "execute-extended-command");
define_key(default_global_keymap, "M-:", "eval-expression");
define_key(default_global_keymap, "M-!", "shell-command");

define_key(default_global_keymap, "C-x C-c", "quit");
define_key(default_global_keymap, "C-x b", "switch-to-buffer");

define_key(default_global_keymap, "q", "kill-current-buffer");
define_key(default_global_keymap, "C-x k", "kill-buffer");
define_key(default_global_keymap, "C-x 5 f", "find-url-new-window");
define_key(default_global_keymap, "C-x 5 2", "make-window");
define_key(default_global_keymap, "C-x 5 0", "delete-window");
define_key(default_global_keymap, "C-x left", "buffer-previous");
define_key(default_global_keymap, "C-x right", "buffer-next");
define_key(default_global_keymap, "M-p", "buffer-previous");
define_key(default_global_keymap, "M-n", "buffer-next");
define_key(default_global_keymap, "C-x C-f", "find-url-new-buffer");
define_key(default_global_keymap, "C-s", "isearch-forward");
define_key(default_global_keymap, "C-r", "isearch-backward");

define_key(default_global_keymap, "C-q", "quote-next-input-mode");
define_key(default_global_keymap, "C-M-q", "quote-mode");
