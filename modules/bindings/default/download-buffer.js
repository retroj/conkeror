require("bindings/default/global.js");

var download_buffer_keymap = new keymap($parent = default_global_keymap);

bind_scroll_keys(download_buffer_keymap);
bind_selection_keys(download_buffer_keymap);

define_key(download_buffer_keymap, "q", "kill-current-buffer");

define_key(download_buffer_keymap, "C-g", "download-cancel");
define_key(download_buffer_keymap, "r", "download-retry-or-resume");
define_key(download_buffer_keymap, "p", "download-pause-or-resume");
define_key(download_buffer_keymap, "delete", "download-remove");
define_key(download_buffer_keymap, "C-d", "download-remove");
define_key(download_buffer_keymap, "x", "download-shell-command");
define_key(download_buffer_keymap, "o", "download-shell-command");
