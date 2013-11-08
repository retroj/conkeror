/**
 * (C) Copyright 2013 Artur Malabarba
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("content-buffer.js");

define_keymap("feedly_keymap");

// Help menu
define_key(feedly_keymap, "?", null, $fallthrough); // keyboard shortcuts

// Navigation
define_key(feedly_keymap, "h", null, $fallthrough); // home
define_key(feedly_keymap, "g", null, $fallthrough); // magic bar
define_key(feedly_keymap, "l", null, $fallthrough); // saved article
define_key(feedly_keymap, "a", null, $fallthrough); // add content
define_key(feedly_keymap, "r", null, $fallthrough); // refresh
define_key(feedly_keymap, "J", null, $fallthrough); // next feed/category
define_key(feedly_keymap, "K", null, $fallthrough); // previous feed/category

// Lists
define_key(feedly_keymap, "j", null, $fallthrough); // inline next article
define_key(feedly_keymap, "k", null, $fallthrough); // inline previous
define_key(feedly_keymap, "n", null, $fallthrough); // select next article
define_key(feedly_keymap, "p", null, $fallthrough); // select previous
define_key(feedly_keymap, "o", null, $fallthrough); // inline/close
define_key(feedly_keymap, "A", null, $fallthrough); // mark all as read
define_key(feedly_keymap, "v", null, $fallthrough); // view original new tab

// Selected Article
define_key(feedly_keymap, "m", null, $fallthrough); // toggle mark as read
define_key(feedly_keymap, "x", null, $fallthrough); // minimize and hide
define_key(feedly_keymap, "s", null, $fallthrough); // save for later
define_key(feedly_keymap, "b", null, $fallthrough); // buffer
define_key(feedly_keymap, "c", null, $fallthrough); // clip to evernote
define_key(feedly_keymap, "V", null, $fallthrough); // preview

define_keymaps_page_mode("feedly-mode",
    build_url_regexp($domain = "cloud.feedly"),
    { normal: feedly_keymap },
    $display_name = "Feedly");

page_mode_activate(feedly_mode);

provide("feedly");
