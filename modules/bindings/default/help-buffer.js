require("bindings/default/global.js");
require("bindings/default/basic-commands.js");

var help_buffer_keymap = new keymap($parent = default_global_keymap);

bind_scroll_keys(help_buffer_keymap);
bind_selection_keys(help_buffer_keymap);

define_key(help_buffer_keymap, "q", "kill-current-buffer");

define_key(help_buffer_keymap, "back_slash", "view-referenced-source-code");
