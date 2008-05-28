/**
 * (C) Copyright 2008 Will Farrington
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("content-buffer.js");
require("bindings/default/content-buffer/normal.js");

define_keymap("google_reader_keymap", $parent = content_buffer_normal_keymap);

// Help
define_key(google_reader_keymap, "?", null, $fallthrough);

// Navigation
define_key(google_reader_keymap, "j", null, $fallthrough);
define_key(google_reader_keymap, "k", null, $fallthrough);
define_key(google_reader_keymap, "space", null, $fallthrough);
define_key(google_reader_keymap, "S-space", null, $fallthrough);
define_key(google_reader_keymap, "n", null, $fallthrough);
define_key(google_reader_keymap, "S-n", null, $fallthrough);
define_key(google_reader_keymap, "p", null, $fallthrough);
define_key(google_reader_keymap, "S-p", null, $fallthrough);
define_key(google_reader_keymap, "S-x", null, $fallthrough);
define_key(google_reader_keymap, "S-o", null, $fallthrough);

// Jumping
define_key(google_reader_keymap, "g", null, $fallthrough);
define_key(google_reader_keymap, "C-c g", "find-url");

// Acting
define_key(google_reader_keymap, "s", null, $fallthrough);
define_key(google_reader_keymap, "S-s", null, $fallthrough);
define_key(google_reader_keymap, "C-c s", "save");
define_key(google_reader_keymap, "v", null, $fallthrough);
define_key(google_reader_keymap, "t", null, $fallthrough);
define_key(google_reader_keymap, "C-c t", "follow-top");
define_key(google_reader_keymap, "m", null, $fallthrough);
define_key(google_reader_keymap, "o", null, $fallthrough);
define_key(google_reader_keymap, "S-a", null, $fallthrough);
define_key(google_reader_keymap, "e", null, $fallthrough);

// Application
define_key(google_reader_keymap, "r", null, $fallthrough);
define_key(google_reader_keymap, "C-c r", "reload");
define_key(google_reader_keymap, "u", null, $fallthrough);
define_key(google_reader_keymap, "1", null, $fallthrough);
define_key(google_reader_keymap, "2", null, $fallthrough);
define_key(google_reader_keymap, "/", null, $fallthrough);
define_key(google_reader_keymap, "a", null, $fallthrough);

define_page_mode("google_reader_mode", "Google Reader", $enable = function (buffer) {
    buffer.local_variables.content_buffer_normal_keymap = google_reader_keymap;
});

var google_reader_re = build_url_regex($domain = "google",
                                       $allow_www = true,
                                       $path = "reader/");
auto_mode_list.push([google_reader_re, google_reader_mode]);
