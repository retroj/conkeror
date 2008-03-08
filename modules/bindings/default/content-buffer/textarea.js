require("bindings/default/content-buffer/text.js");

var content_buffer_textarea_keymap = new keymap($parent = content_buffer_text_keymap);

// textarea keys
define_key(content_buffer_textarea_keymap, "C-n", "forward-line");
define_key(content_buffer_textarea_keymap, "down", "forward-line");
define_key(content_buffer_textarea_keymap, "C-p", "backward-line");
define_key(content_buffer_textarea_keymap, "up", "backward-line");
define_key(content_buffer_textarea_keymap, "M-<", "beginning-of-first-line");
define_key(content_buffer_textarea_keymap, "M->", "end-of-last-line");
define_key(content_buffer_textarea_keymap, "M-v", "backward-page");
define_key(content_buffer_textarea_keymap, "page_up", "backward-page");

define_key(content_buffer_textarea_keymap, "C-v", "forward-page");
define_key(content_buffer_textarea_keymap, "page_down", "forward-page");

// 101 keys
define_key(content_buffer_textarea_keymap, "S-page_up", "cmd_selectPageUp");
define_key(content_buffer_textarea_keymap, "S-page_down", "cmd_selectPageDown");
