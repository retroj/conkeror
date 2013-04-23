/**
 * (C) Copyright 2013 Raimon Grau
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("content-buffer.js");

define_keymap("facebook_keymap", $display_name = "facebook");

// Navigation
define_key(facebook_keymap, "j", null, $fallthrough);
define_key(facebook_keymap, "k", null, $fallthrough);
define_key(facebook_keymap, "return", null, $fallthrough);

define_keymaps_page_mode("facebook-mode",
    build_url_regexp($domain = "facebook",
                     $allow_www = true),
    { normal: facebook_keymap },
    $display_name = "Facebook");

page_mode_activate(facebook_mode);

provide("facebook");
