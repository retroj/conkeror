/**
 * (C) Copyright 2010 Vinh Q. Nguyen
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

require("content-buffer.js");


define_keymap("google_voice_keymap");
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

function google_voice_modality (buffer, element) {
    if (! buffer.input_mode)
        buffer.keymaps.push(google_voice_keymap);
}

define_page_mode("google_voice_mode",
                 $display_name = "Google Voice",
                 $enable = function (buffer) {
                     buffer.modalities.push(google_voice_modality);
                 },
                 $disable = function (buffer) {
                     var i = buffer.modalities.indexOf(google_voice_modality);
                     if (i > -1)
                         buffer.modalities.splice(i, 1);
                 });

var google_voice_re = build_url_regex($domain = "google",
                                      $allow_www = true,
                                      $path = "voice");
auto_mode_list.push([google_voice_re, google_voice_mode]);

provide("google-voice");
