/**
 * (C) Copyright 2008 Nelson Elhage
 * (C) Copyright 2009-2010 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("content-buffer.js");

define_keymap("google_calendar_keymap", $display_name = "google-calendar");

define_key(google_calendar_keymap, "c", null, $fallthrough);

define_key(google_calendar_keymap, "/", null, $fallthrough);
define_key(google_calendar_keymap, "p", null, $fallthrough);
define_key(google_calendar_keymap, "j", null, $fallthrough);
define_key(google_calendar_keymap, "n", null, $fallthrough);
define_key(google_calendar_keymap, "k", null, $fallthrough);
define_key(google_calendar_keymap, "t", null, $fallthrough);

define_key(google_calendar_keymap, "d", null, $fallthrough);
define_key(google_calendar_keymap, "x", null, $fallthrough);
define_key(google_calendar_keymap, "w", null, $fallthrough);
define_key(google_calendar_keymap, "m", null, $fallthrough);
define_key(google_calendar_keymap, "a", null, $fallthrough);
define_key(google_calendar_keymap, "q", null, $fallthrough);
define_key(google_calendar_keymap, "s", null, $fallthrough);
define_key(google_calendar_keymap, "u", null, $fallthrough);
define_key(google_calendar_keymap, "return", null, $fallthrough);
define_key(google_calendar_keymap, "tab", null, $fallthrough);//PROBABLY BAD
define_key(google_calendar_keymap, "M-s", null, $fallthrough);
define_key(google_calendar_keymap, "escape", null, $fallthrough);

define_keymaps_page_mode("google-calendar-mode",
    build_url_regexp($domain = "google",
                     $path   = "calendar/",
                     $allow_www = true),
    { normal: google_calendar_keymap },
    $display_name = "Google Calendar");

page_mode_activate(google_calendar_mode);

provide("google-calendar");
