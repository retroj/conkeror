require("content-buffer.js");
require("bindings/default/content-buffer/normal.js");

define_keymap("google_reader_keymap", $parent = content_buffer_normal_keymap);

define_key(google_reader_keymap, "j", null, $fallthrough);
define_key(google_reader_keymap, "k", null, $fallthrough);
define_key(google_reader_keymap, "u", null, $fallthrough);
define_key(google_reader_keymap, "n", null, $fallthrough);
define_key(google_reader_keymap, "p", null, $fallthrough);
define_key(google_reader_keymap, "o", null, $fallthrough);
define_key(google_reader_keymap, "g", null, $fallthrough);
define_key(google_reader_keymap, "C-c g", "open-url");
define_key(google_reader_keymap, "r", null, $fallthrough);
define_key(google_reader_keymap, "C-c r", "reload");
define_key(google_reader_keymap, "a", null, $fallthrough);

define_page_mode("google_reader_mode", "Google Reader", $enable = function (buffer) {
    buffer.local_variables.content_buffer_normal_keymap = google_reader_keymap;
});

auto_mode_list.push([/^https?:\/\/www\.google\.com\/reader\//, google_reader_mode]);
