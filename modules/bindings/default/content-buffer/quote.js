
define_keymap("content_buffer_quote_next_keymap");
define_keymap("content_buffer_quote_keymap");

define_key(content_buffer_quote_next_keymap, match_any_key, "content-buffer-update-input-mode-for-focus", $fallthrough);

define_key(content_buffer_quote_keymap, "escape", "content-buffer-update-input-mode-for-focus", null);
define_key(content_buffer_quote_keymap, match_any_key, null, $fallthrough);
