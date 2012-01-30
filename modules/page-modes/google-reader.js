/**
 * (C) Copyright 2008 Will Farrington
 * (C) Copyright 2009-2010 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("content-buffer.js");


define_keymap("google_reader_keymap", $display_name = "google-reader");
define_fallthrough(google_reader_keymap, match_any_unmodified_character);

// Help
define_key(google_reader_keymap, "?", null, $fallthrough);

// Navigation
define_key(google_reader_keymap, "j", null, $fallthrough);
define_key(google_reader_keymap, "k", null, $fallthrough);
define_key(google_reader_keymap, "space", null, $fallthrough);
define_key(google_reader_keymap, "S-space", null, $fallthrough);
define_key(google_reader_keymap, "n", null, $fallthrough);
define_key(google_reader_keymap, "N", null, $fallthrough);
define_key(google_reader_keymap, "p", null, $fallthrough);
define_key(google_reader_keymap, "P", null, $fallthrough);
define_key(google_reader_keymap, "X", null, $fallthrough);
define_key(google_reader_keymap, "O", null, $fallthrough);

// Jumping
define_key(google_reader_keymap, "g", null, $fallthrough);
define_key(google_reader_keymap, "h", null, $fallthrough);

// Acting
define_key(google_reader_keymap, "s", null, $fallthrough);
define_key(google_reader_keymap, "S", null, $fallthrough);
define_key(google_reader_keymap, "v", null, $fallthrough);
define_key(google_reader_keymap, "t", null, $fallthrough);
define_key(google_reader_keymap, "m", null, $fallthrough);
define_key(google_reader_keymap, "o", null, $fallthrough);
define_key(google_reader_keymap, "A", null, $fallthrough);
define_key(google_reader_keymap, "e", null, $fallthrough);

// Application
define_key(google_reader_keymap, "r", null, $fallthrough);
define_key(google_reader_keymap, "u", null, $fallthrough);
define_key(google_reader_keymap, "1", null, $fallthrough);
define_key(google_reader_keymap, "2", null, $fallthrough);
define_key(google_reader_keymap, "/", null, $fallthrough);
define_key(google_reader_keymap, "a", null, $fallthrough);

define_keymaps_page_mode("google-reader-mode",
    build_url_regexp($domain = "google",
                     $tlds = ["com", "co.uk"],
                     $allow_www = true,
                     $path = "reader/"),
    { normal: google_reader_keymap },
    $display_name = "Google Reader");

page_mode_activate(google_reader_mode);

provide("google-reader");
