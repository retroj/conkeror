/**
 * (C) Copyright 2010 Mike Fisher
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

require("content-buffer.js");

define_keymap("twitter_keymap", $display_name = "twitter");

// Help
define_key(twitter_keymap, "?", null, $fallthrough);

// Navigation
define_key(twitter_keymap, "j", null, $fallthrough);
define_key(twitter_keymap, "k", null, $fallthrough);
define_key(twitter_keymap, "space", null, $fallthrough);
define_key(twitter_keymap, "S-space", null, $fallthrough);
define_key(twitter_keymap, "/", null, $fallthrough);
define_key(twitter_keymap, ".", null, $fallthrough);

// Timelines
define_key(twitter_keymap, "g", null, $fallthrough);
define_key(twitter_keymap, "h", null, $fallthrough);
define_key(twitter_keymap, "r", null, $fallthrough);
define_key(twitter_keymap, "p", null, $fallthrough);
define_key(twitter_keymap, "f", null, $fallthrough);
define_key(twitter_keymap, "m", null, $fallthrough);
define_key(twitter_keymap, "u", null, $fallthrough);

// Acting
define_key(twitter_keymap, "f", null, $fallthrough);
define_key(twitter_keymap, "r", null, $fallthrough);
define_key(twitter_keymap, "t", null, $fallthrough);
define_key(twitter_keymap, "m", null, $fallthrough);
define_key(twitter_keymap, "n", null, $fallthrough);

define_key(twitter_keymap, "return", null, $fallthrough);

var twitter_modality = {
    normal: twitter_keymap
};

define_page_mode("twitter-mode",
    build_url_regexp($domain = "twitter",
                     $allow_www = true),
    function enable (buffer) {
        buffer.content_modalities.push(twitter_modality);
    },
    function disable (buffer) {
        var i = buffer.content_modalities.indexOf(twitter_modality);
        if (i > -1)
            buffer.content_modalities.splice(i, 1);
    },
    $display_name = "Twitter");

page_mode_activate(twitter_mode);

provide("twitter");
