require("bindings/default/content_buffer_text.js");

var content_buffer_textarea_keymap = new keymap($parent = content_buffer_text_keymap);

// textarea keys
define_key(content_buffer_textarea_keymap, "C-n", "cmd_lineNext");
define_key(content_buffer_textarea_keymap, "down", "cmd_lineNext");
define_key(content_buffer_textarea_keymap, "C-p", "cmd_linePrevious");
define_key(content_buffer_textarea_keymap, "up", "cmd_linePrevious");
define_key(content_buffer_textarea_keymap, "M-<", "cmd_moveTop");
define_key(content_buffer_textarea_keymap, "M->", "cmd_moveBottom");
define_key(content_buffer_textarea_keymap, "M-v", "cmd_movePageUp");
define_key(content_buffer_textarea_keymap, "page_up", "cmd_movePageUp");

define_key(content_buffer_textarea_keymap, "C-v", "cmd_movePageDown");
define_key(content_buffer_textarea_keymap, "page_down", "cmd_movePageDown");
define_key(content_buffer_textarea_keymap, "M-space", "yank-to-clipboard");

// 101 keys
define_key(content_buffer_textarea_keymap, "S-page_up", "cmd_selectPageUp");
define_key(content_buffer_textarea_keymap, "S-page_down", "cmd_selectPageDown");
