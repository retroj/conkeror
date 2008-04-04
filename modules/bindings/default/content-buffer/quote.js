
var content_buffer_quote_next_keymap = new keymap();
var content_buffer_quote_keymap = new keymap();

define_key(content_buffer_quote_next_keymap, match_any_key, "normal-input-mode", $fallthrough);

define_key(content_buffer_quote_keymap, "escape", "normal-input-mode", null);
define_key(content_buffer_quote_keymap, match_any_key, null, $fallthrough);
