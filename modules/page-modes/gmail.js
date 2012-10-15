/**
 * (C) Copyright 2008 David Glasser
 * (C) Copyright 2008 Will Farrington
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 * (C) Copyright 2009-2010 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("content-buffer.js");

define_keymap("gmail_keymap", $display_name = "gmail");

// Jumping
define_key(gmail_keymap, "g", null, $fallthrough);
define_key(gmail_keymap, "i", null, $fallthrough);
define_key(gmail_keymap, "t", null, $fallthrough);
define_key(gmail_keymap, "d", null, $fallthrough);
define_key(gmail_keymap, "a", null, $fallthrough);
define_key(gmail_keymap, "b", null, $fallthrough);

// Threadlist
define_key(gmail_keymap, "*", null, $fallthrough);

// Navigation
define_key(gmail_keymap, "u", null, $fallthrough);
define_key(gmail_keymap, "j", null, $fallthrough);
define_key(gmail_keymap, "k", null, $fallthrough);
define_key(gmail_keymap, "o", null, $fallthrough);
define_key(gmail_keymap, "n", null, $fallthrough);
define_key(gmail_keymap, "p", null, $fallthrough);

// Application
define_key(gmail_keymap, "c", null, $fallthrough);
define_key(gmail_keymap, "C", null, $fallthrough);
define_key(gmail_keymap, "/", null, $fallthrough);
define_key(gmail_keymap, "q", null, $fallthrough);
define_key(gmail_keymap, "?", null, $fallthrough);

// Actions
define_key(gmail_keymap, "s", null, $fallthrough);
define_key(gmail_keymap, "e", null, $fallthrough);
define_key(gmail_keymap, "x", null, $fallthrough);
define_key(gmail_keymap, "y", null, $fallthrough);
define_key(gmail_keymap, "!", null, $fallthrough);
define_key(gmail_keymap, "m", null, $fallthrough);
define_key(gmail_keymap, "#", null, $fallthrough);
define_key(gmail_keymap, "r", null, $fallthrough);
define_key(gmail_keymap, "f", null, $fallthrough);
define_key(gmail_keymap, "N", null, $fallthrough);
define_key(gmail_keymap, ".", null, $fallthrough);
define_key(gmail_keymap, "I", null, $fallthrough);
define_key(gmail_keymap, "U", null, $fallthrough);
define_key(gmail_keymap, "]", null, $fallthrough);
define_key(gmail_keymap, "[", null, $fallthrough);
define_key(gmail_keymap, "l", null, $fallthrough);
define_key(gmail_keymap, "return", null, $fallthrough);
define_key(gmail_keymap, "tab", null, $fallthrough);


define_keymaps_page_mode("gmail-mode",
    build_url_regexp($domain = "mail.google",
                     $path = new RegExp('(?!support)')),
    { normal: gmail_keymap },
    $display_name = "GMail");

page_mode_activate(gmail_mode);

provide("gmail");
