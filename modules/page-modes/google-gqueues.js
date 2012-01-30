/**
 * (C) Copyright 2010 Vinh Q. Nguyen
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("content-buffer.js");


define_keymap("google_gqueues_keymap", $display_name = "google-gqueues");
define_fallthrough(google_gqueues_keymap, match_any_unmodified_character);

// Current Item
define_key(google_gqueues_keymap, "e", null, $fallthrough);
define_key(google_gqueues_keymap, "n", null, $fallthrough);
define_key(google_gqueues_keymap, "t", null, $fallthrough);
define_key(google_gqueues_keymap, "c", null, $fallthrough);
define_key(google_gqueues_keymap, "s", null, $fallthrough);
define_key(google_gqueues_keymap, "x", null, $fallthrough);
define_key(google_gqueues_keymap, "d", null, $fallthrough);
define_key(google_gqueues_keymap, "D", null, $fallthrough);
define_key(google_gqueues_keymap, "i", null, $fallthrough);

// Editing
define_key(google_gqueues_keymap, "tab", null, $fallthrough);
define_key(google_gqueues_keymap, "S-tab", null, $fallthrough);

// Navigation
define_key(google_gqueues_keymap, "up", null, $fallthrough);
define_key(google_gqueues_keymap, "down", null, $fallthrough);
define_key(google_gqueues_keymap, "left", null, $fallthrough);
define_key(google_gqueues_keymap, "right", null, $fallthrough);
define_key(google_gqueues_keymap, "S-up", null, $fallthrough);
define_key(google_gqueues_keymap, "S-down", null, $fallthrough);
define_key(google_gqueues_keymap, "j", null, $fallthrough);
define_key(google_gqueues_keymap, "k", null, $fallthrough);
define_key(google_gqueues_keymap, "l", null, $fallthrough);
define_key(google_gqueues_keymap, "h", null, $fallthrough);
define_key(google_gqueues_keymap, "J", null, $fallthrough);
define_key(google_gqueues_keymap, "K", null, $fallthrough);

define_keymaps_page_mode("google-gqueues-mode",
    build_url_regexp($domain = "gqueues",
                     $allow_www = true,
                     $path = "main"),
    { normal: google_gqueues_keymap },
    $display_name = "Google GQueues");

page_mode_activate("google_gqueues_mode");

provide("google-gqueues");
