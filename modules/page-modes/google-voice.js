/**
 * (C) Copyright 2010 Vinh Q. Nguyen
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("content-buffer.js");


define_keymap("google_voice_keymap", $display_name = "google-voice");
define_fallthrough(google_voice_keymap, match_any_unmodified_character);

// Shortcuts
define_key(google_voice_keymap, "c", null, $fallthrough);
define_key(google_voice_keymap, "m", null, $fallthrough);
define_key(google_voice_keymap, "escape", null, $fallthrough);
define_key(google_voice_keymap, "/", null, $fallthrough);
define_key(google_voice_keymap, "right", null, $fallthrough);
define_key(google_voice_keymap, "n", null, $fallthrough);
define_key(google_voice_keymap, "left", null, $fallthrough);
define_key(google_voice_keymap, "p", null, $fallthrough);
define_key(google_voice_keymap, "#", null, $fallthrough);
define_key(google_voice_keymap, "!", null, $fallthrough);
define_key(google_voice_keymap, "I", null, $fallthrough);
define_key(google_voice_keymap, "U", null, $fallthrough);

// Combo keys
define_key(google_voice_keymap, "g i", null, $fallthrough);
define_key(google_voice_keymap, "g s", null, $fallthrough);
define_key(google_voice_keymap, "g h", null, $fallthrough);
define_key(google_voice_keymap, "g i", null, $fallthrough);
define_key(google_voice_keymap, "g r", null, $fallthrough);
define_key(google_voice_keymap, "g m", null, $fallthrough);
define_key(google_voice_keymap, "g c", null, $fallthrough);
define_key(google_voice_keymap, "g u", null, $fallthrough);
define_key(google_voice_keymap, "* a", null, $fallthrough);
define_key(google_voice_keymap, "* n", null, $fallthrough);
define_key(google_voice_keymap, "* r", null, $fallthrough);
define_key(google_voice_keymap, "* u", null, $fallthrough);

define_keymaps_page_mode("google-voice-mode",
    build_url_regexp($domain = "google",
                     $allow_www = true,
                     $path = "voice"),
    { normal: google_voice_keymap },
    $display_name = "Google Voice");

page_mode_activate(google_voice_mode);

provide("google-voice");
