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
define_key(twitter_keymap, "C-c g", "find-url");//BAD
define_key(twitter_keymap, "h", null, $fallthrough);
define_key(twitter_keymap, "r", null, $fallthrough);
define_key(twitter_keymap, "C-c r", "reload");//BAD
define_key(twitter_keymap, "p", null, $fallthrough);
define_key(twitter_keymap, "f", null, $fallthrough);
define_key(twitter_keymap, "m", null, $fallthrough);
define_key(twitter_keymap, "u", null, $fallthrough);

// Acting
define_key(twitter_keymap, "f", null, $fallthrough);
define_key(twitter_keymap, "C-c f", "follow");//BAD
define_key(twitter_keymap, "r", null, $fallthrough);
define_key(twitter_keymap, "t", null, $fallthrough);
define_key(twitter_keymap, "C-c t", "follow-top");//BAD
define_key(twitter_keymap, "m", null, $fallthrough);
define_key(twitter_keymap, "n", null, $fallthrough);

var twitter_modality = {
    normal: twitter_keymap
};

define_page_mode("twitter_mode",
                 $display_name = "Twitter",
                 $enable = function (buffer) {
                     buffer.content_modalities.push(twitter_modality);
                 },
                 $disable = function (buffer) {
                     var i = buffer.content_modalities.indexOf(twitter_modality);
                     if (i > -1)
                         buffer.content_modalities.splice(i, 1);
                 });

let (re = build_url_regex($domain = "twitter",
                          $allow_www = true)) {
    auto_mode_list.push([re, twitter_mode]);
}

provide("twitter");
