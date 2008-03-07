require("bindings/default/universal_argument.js");

var default_base_keymap = new keymap();

/**
 * Note: Most buffer keymaps should set this as the parent.
 */
var default_global_keymap = new keymap($parent = default_base_keymap);
var default_help_keymap = new keymap();

bind_universal_argument(default_base_keymap, "C-u");

define_key(default_global_keymap, "M-S-;","eval-expression");

define_key(default_global_keymap, "C-x C-c", "quit");

define_key(default_global_keymap, "C-x b", "switch-to-buffer");
define_key(default_global_keymap, "C-x k", "kill-buffer");
define_key(default_global_keymap, "C-x 5 f", "find-url-other-buffer");
define_key(default_global_keymap, "C-x 5 2", "make-window");
define_key(default_global_keymap, "C-x 5 0", "delete-window");

define_key (default_base_keymap, "C-m", "send-ret");

define_key(default_base_keymap, "C-h", default_help_keymap);
define_key(default_help_keymap, "b", "describe-bindings");
define_key(default_help_keymap, "f", "describe-command");
define_key(default_help_keymap, "k", "describe-key");
define_key(default_help_keymap, "i", "help-page");
define_key(default_help_keymap, "t", "help-with-tutorial");
define_key(default_help_keymap, "w", "where-is");

define_key(default_global_keymap, "M-x", "execute-extended-command");

define_key(default_global_keymap, "M-p", "buffer-previous");
define_key(default_global_keymap, "M-n", "buffer-next");

define_key(default_global_keymap, "C-x C-f", "find-url");

define_key(default_global_keymap, "M-S-1", "shell-command");

// I-search
define_key(default_global_keymap, "C-s", "isearch-forward");
define_key(default_global_keymap, "C-r", "isearch-backward");
