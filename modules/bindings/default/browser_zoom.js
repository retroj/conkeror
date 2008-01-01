
require("bindings/default/content_buffer_normal.js");

define_key(content_buffer_normal_keymap, "S-equals", "zoom-in-text");
define_key(content_buffer_normal_keymap, "equals", "zoom-reset-text");
define_key(content_buffer_normal_keymap, "subtract", "zoom-out-text");

define_key(content_buffer_normal_keymap, "C-S-equals", "zoom-in-full");
define_key(content_buffer_normal_keymap, "C-equals", "zoom-reset-full");
define_key(content_buffer_normal_keymap, "C-subtract", "zoom-out-full");



define_key(content_buffer_normal_keymap, "z i", "zoom-in-text");
define_key(content_buffer_normal_keymap, "z m", "zoom-in-text-more");
define_key(content_buffer_normal_keymap, "z z", "zoom-reset-text");
define_key(content_buffer_normal_keymap, "z o", "zoom-out-text");
define_key(content_buffer_normal_keymap, "z r", "zoom-out-text-more");


define_key(content_buffer_normal_keymap, "z I", "zoom-in-full");
define_key(content_buffer_normal_keymap, "z M", "zoom-in-full-more");
define_key(content_buffer_normal_keymap, "z Z", "zoom-reset-full");
define_key(content_buffer_normal_keymap, "z O", "zoom-out-full");
define_key(content_buffer_normal_keymap, "z R", "zoom-out-full-more");
