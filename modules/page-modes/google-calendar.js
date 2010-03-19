/**
 * (C) Copyright 2008 Nelson Elhage
 * (C) Copyright 2009 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

require("content-buffer.js");

define_keymap("google_calendar_keymap");

define_key(google_calendar_keymap, "c", null, $fallthrough);
define_key(google_calendar_keymap, "C-c c", "copy");//BAD

define_key(google_calendar_keymap, "/", null, $fallthrough);
define_key(google_calendar_keymap, "p", null, $fallthrough);
define_key(google_calendar_keymap, "j", null, $fallthrough);
define_key(google_calendar_keymap, "n", null, $fallthrough);
define_key(google_calendar_keymap, "k", null, $fallthrough);
define_key(google_calendar_keymap, "t", null, $fallthrough);
define_key(google_calendar_keymap, "C-c t", "follow-top");//BAD

define_key(google_calendar_keymap, "d", null, $fallthrough);
define_key(google_calendar_keymap, "x", null, $fallthrough);
define_key(google_calendar_keymap, "C-c x", "shell-command-on-file");//BAD
define_key(google_calendar_keymap, "w", null, $fallthrough);
define_key(google_calendar_keymap, "m", null, $fallthrough);
define_key(google_calendar_keymap, "a", null, $fallthrough);
define_key(google_calendar_keymap, "q", null, $fallthrough);
define_key(google_calendar_keymap, "s", null, $fallthrough);
define_key(google_calendar_keymap, "C-c s", "save");//BAD
define_key(google_calendar_keymap, "u", null, $fallthrough);
define_key(google_calendar_keymap, "C-c u", "up");//BAD
define_key(google_calendar_keymap, "return", null, $fallthrough);
define_key(google_calendar_keymap, "tab", null, $fallthrough);//PROBABLY BAD
define_key(google_calendar_keymap, "M-s", null, $fallthrough);
define_key(google_calendar_keymap, "escape", null, $fallthrough);

function google_calendar_modality (buffer, element) {
    if (! buffer.input_mode)
        buffer.keymaps.push(google_calendar_keymap);
}

define_page_mode("google_calendar_mode",
    $display_name = "Google Calendar",
    $enable = function (buffer) {
        buffer.modalities.push(google_calendar_modality);
    },
    $disable = function (buffer) {
        var i = buffer.modalities.indexOf(google_calendar_modality);
        if (i > -1)
            buffer.modalities.splice(i, 1);
    });

let (re = build_url_regex($domain = "google",
                          $path   = "calendar/",
                          $allow_www = true)) {
    auto_mode_list.push([re, google_calendar_mode]);
}

provide("google-calendar");
