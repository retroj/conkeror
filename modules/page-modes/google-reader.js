/**
 * (C) Copyright 2008 Will Farrington
 * (C) Copyright 2009-2010 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

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
define_key(google_reader_keymap, "C-c g", "find-url");//BAD

// Acting
define_key(google_reader_keymap, "s", null, $fallthrough);
define_key(google_reader_keymap, "S", null, $fallthrough);
define_key(google_reader_keymap, "C-c s", "save");//BAD
define_key(google_reader_keymap, "v", null, $fallthrough);
define_key(google_reader_keymap, "t", null, $fallthrough);
define_key(google_reader_keymap, "C-c t", "follow-top");//BAD
define_key(google_reader_keymap, "m", null, $fallthrough);
define_key(google_reader_keymap, "o", null, $fallthrough);
define_key(google_reader_keymap, "A", null, $fallthrough);
define_key(google_reader_keymap, "e", null, $fallthrough);

// Application
define_key(google_reader_keymap, "r", null, $fallthrough);
define_key(google_reader_keymap, "C-c r", "reload");//BAD
define_key(google_reader_keymap, "u", null, $fallthrough);
define_key(google_reader_keymap, "1", null, $fallthrough);
define_key(google_reader_keymap, "2", null, $fallthrough);
define_key(google_reader_keymap, "/", null, $fallthrough);
define_key(google_reader_keymap, "a", null, $fallthrough);


var google_reader_modality = {
    normal: google_reader_keymap
};

define_page_mode("google_reader_mode",
                 $display_name = "Google Reader",
                 $enable = function (buffer) {
                     buffer.content_modalities.push(google_reader_modality);
                 },
                 $disable = function (buffer) {
                     var i = buffer.content_modalities.indexOf(google_reader_modality);
                     if (i > -1)
                         buffer.content_modalities.splice(i, 1);
                 });

var google_reader_re = build_url_regex($domain = "google",
                                       $tlds = ["com", "co.uk"],
                                       $allow_www = true,
                                       $path = "reader/");
auto_mode_list.push([google_reader_re, google_reader_mode]);

provide("google-reader");
