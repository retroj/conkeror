
var content_buffer_quote_next_keymap = new keymap();
var content_buffer_quote_keymap = new keymap();

define_key(content_buffer_quote_next_keymap, match_any_key, "browser-buffer-normal-input-mode", $fallthrough);

define_key(content_buffer_quote_keymap, "escape", "browser-buffer-normal-input-mode", null);
define_key(content_buffer_quote_keymap, match_any_key, null, $fallthrough);
