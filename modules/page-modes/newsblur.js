/**
 * NewBlur mode (for https://www.newsblur.com RSS news reader)
 * (C) Copyright 2012 Benjamin Slade
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("content-buffer.js");


define_keymap("newsblur_keymap", $display_name = "newsblur");
define_fallthrough(newsblur_keymap, match_any_unmodified_character);

// Help
define_key(newsblur_keymap, "?", null, $fallthrough); // open help

// Navigation
define_key(newsblur_keymap, "d", null, $fallthrough); // dashboard
define_key(newsblur_keymap, "g", null, $fallthrough); // find feed by name
define_key(newsblur_keymap, "j", null, $fallthrough); // next story
define_key(newsblur_keymap, "k", null, $fallthrough); // previous story
define_key(newsblur_keymap, "J", null, $fallthrough); // next site
define_key(newsblur_keymap, "S-up", null, $fallthrough); // next site
define_key(newsblur_keymap, "K", null, $fallthrough); // previous site
define_key(newsblur_keymap, "S-down", null, $fallthrough); // previous site
define_key(newsblur_keymap, "E", null, $fallthrough); // fetch everything (fetch all unread stories)
define_key(newsblur_keymap, "space", null, $fallthrough); // scroll down
define_key(newsblur_keymap, "S-space", null, $fallthrough); // scroll up
define_key(newsblur_keymap, "n", null, $fallthrough); // next unread story
define_key(newsblur_keymap, "m", null, $fallthrough); // find oldest unread story
define_key(newsblur_keymap, "left", null, $fallthrough); // switch views (original|feed|story)
define_key(newsblur_keymap, "right", null, $fallthrough); // switch views (original|feed|story)


// Acting
define_key(newsblur_keymap, "u", null, $fallthrough); // toggle unread/read on current story
define_key(newsblur_keymap, "s", null, $fallthrough); // toggle save/unsave story
define_key(newsblur_keymap, "o", null, $fallthrough); // open story in new window
define_key(newsblur_keymap, "A", null, $fallthrough); // mark all stories as read
define_key(newsblur_keymap, "S", null, $fallthrough); // share story
define_key(newsblur_keymap, "C-return", null, $fallthrough); // save comments
define_key(newsblur_keymap, "e", null, $fallthrough); // email story

// Application
define_key(newsblur_keymap, "U", null, $fallthrough); // hide sites
define_key(newsblur_keymap, "T", null, $fallthrough); // hide story titles
define_key(newsblur_keymap, "a", null, $fallthrough); // add new rss feed
define_key(newsblur_keymap, "t", null, $fallthrough); // open story trainer
define_key(newsblur_keymap, "f", null, $fallthrough); // open site/feed trainer
define_key(newsblur_keymap, "+", null, $fallthrough); // change intelligence
define_key(newsblur_keymap, "-", null, $fallthrough); // change intelligence


define_keymaps_page_mode("newsblur-mode",
    build_url_regexp($domain = /(?:[a-z]+\.)?newsblur/),
    { normal: newsblur_keymap },
    $display_name = "Newsblur");

page_mode_activate(newsblur_mode);

provide("newsblur");
