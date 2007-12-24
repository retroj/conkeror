require("bindings/default/universal_argument.js");

/**
 * Note: Most buffer keymaps should set this as the parent.
 */
var default_global_keymap = new keymap();
var default_help_keymap = new keymap();

bind_universal_argument(default_global_keymap, "C-u");

define_key(default_global_keymap, "M-S-;","eval-expression");

define_key(default_global_keymap, "C-x C-c", "quit");

define_key(default_global_keymap, "C-x b", "switch-to-buffer");
define_key(default_global_keymap, "C-x k", "kill-buffer");
define_key(default_global_keymap, "C-x 5 f", "find-url-other-buffer");
define_key(default_global_keymap, "C-x 5 2", "make-frame-command");
define_key(default_global_keymap, "C-x 5 0", "delete-frame");

define_key(default_global_keymap, "C-h", default_help_keymap);
define_key(default_help_keymap, "b", "describe-bindings");
define_key(default_help_keymap, "i", "help-page");
define_key(default_help_keymap,"t", "help-with-tutorial");

define_key(default_global_keymap, "M-x", "execute-extended-command");
