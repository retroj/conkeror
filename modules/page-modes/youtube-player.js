/**
 * (C) Copyright 2012 Scott Jaderholm
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("content-buffer.js");

define_keymap("youtube_player_keymap", $display_name = "youtube-player");

function youtube_player_click_command (selector, error_message) {
    return function (I) {
        var buf = I.buffer;
        var elem = buf.document.querySelector(selector);
        if (elem)
            dom_node_click(elem, 1, 1);
        else
            I.minibuffer.message(error_message + ", ensure html5 is enabled for youtube by visiting http://youtube.com/html5");
    };
}

interactive("youtube-player-play-or-pause",
    "Click the Youtube html5 player play/pause button.",
    youtube_player_click_command(".ytp-button-pause, .ytp-button-play",
                                 "No play or pause button found"));

interactive("youtube-player-mute",
    "Click the Youtube html5 player mute button.",
    youtube_player_click_command("button.html5-volume-button",
                                 "No mute button found"));

interactive("youtube-player-fullscreen",
    "Click the Youtube html5 player fullscreen button.",
    youtube_player_click_command(".ytp-button-fullscreen-enter, .ytp-button-fullscreen-exit",
                                 "No fullscreen button found"));

define_key(youtube_player_keymap, "C-c return", "youtube-player-play-or-pause");
define_key(youtube_player_keymap, "C-c C-m", "youtube-player-mute");
define_key(youtube_player_keymap, "C-c C-f", "youtube-player-fullscreen");

define_keymaps_page_mode("youtube-player-mode",
    build_url_regexp($domain = "youtube", $allow_www = true),
    { normal: youtube_player_keymap },
    $display_name = "Youtube-Player");

page_mode_activate(youtube_player_mode);

provide("youtube-player");
