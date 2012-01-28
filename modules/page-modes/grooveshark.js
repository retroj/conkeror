/**
 * (C) Copyright 2012 Scott Jaderholm
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

require("content-buffer.js");

define_keymap("grooveshark_keymap", $display_name = "grooveshark");

function grooveshark_click_command (selector, error_message) {
    return function (I) {
        var buf = I.buffer;
        var elem = buf.document.querySelector(selector);
        if (elem)
            dom_node_click(elem, 1, 1);
        else
            I.minibuffer.message(error_message);
    };
}

interactive("grooveshark-play-or-pause",
    "Click the Groovshark play/pause button.",
    grooveshark_click_command("button#player_play_pause",
                              "No play or pause button found"));

interactive("grooveshark-mute",
    "Click the Grooveshark mute button.",
    grooveshark_click_command("button#player_volume",
                              "No mute button found"));

interactive("grooveshark-previous",
    "Click the Grooveshark previous-video button.",
    grooveshark_click_command("button#player_previous",
                              "No previous button found"));

interactive("grooveshark-next",
    "Click the Grooveshark next-video button.",
    grooveshark_click_command("button#player_next",
                              "No next button found"));

define_key(grooveshark_keymap, "C-c return", "grooveshark-play-or-pause");
define_key(grooveshark_keymap, "C-c C-m", "grooveshark-mute");
define_key(grooveshark_keymap, "C-c C-n", "grooveshark-next");
define_key(grooveshark_keymap, "C-c C-p", "grooveshark-previous");

define_keymaps_page_mode("grooveshark-mode",
    build_url_regexp($domain = "grooveshark", $allow_www = true),
    { normal: grooveshark_keymap },
    $display_name = "Grooveshark");

page_mode_activate(grooveshark_mode);

provide("grooveshark");
