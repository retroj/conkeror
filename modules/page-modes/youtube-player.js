/**
 * (C) Copyright 2012 Scott Jaderholm
 * (C) Copyright 2013 Joren Van Onder
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("content-buffer.js");

define_keymap("youtube_player_keymap", $display_name = "youtube-player");

function youtube_player_display_error_message (I, error_message) {
    I.minibuffer.message(error_message + ", ensure html5 is enabled for youtube by visiting http://youtube.com/html5");
}

function youtube_player_change_speed (slower) {
    return function (I) {
        var buf = I.buffer;

        // get settings control rows
        var settings_control_rows = buf.document.querySelectorAll(".ytp-menu-row");

        var speed_buttons = null;
        // find speed buttons
        for (var i = 0, n = settings_control_rows.length; i < n && ! speed_buttons; ++i) {
            if (settings_control_rows[i].innerHTML.indexOf("Speed") != -1) {
                speed_buttons = settings_control_rows[i].querySelectorAll(
                    ".ytp-drop-down-menu-content .ytp-drop-down-menu-button");
            }
        }

        if (! speed_buttons) {
            youtube_player_display_error_message(I, "No speed buttons found");
            return;
        }

        var current_speed_found = false;
        for (var i = 0, n = speed_buttons.length; i < n; ++i) {
            if (speed_buttons[i].className.indexOf("ytp-drop-down-menu-button-checked") != -1) {
                // current speed
                current_speed_found = true;

                if (slower && i != 0) {
                    dom_node_click(speed_buttons[i - 1], 1, 1);
                } else if (! slower && i != speed_buttons.length - 1) {
                    dom_node_click(speed_buttons[i + 1], 1, 1);
                }

                break;
            }
        }

        if (! current_speed_found) {
            youtube_player_display_error_message(I, "Current speed button not found");
        }
    }
}

function youtube_player_click_command (selector, error_message) {
    return function (I) {
        var buf = I.buffer;
        var elem = buf.document.querySelector(selector);
        if (elem)
            dom_node_click(elem, 1, 1);
        else
            youtube_player_display_error_message(I, error_message);
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

interactive("youtube-player-speed-down",
    "Slow down the Youtube html5 player.",
    youtube_player_change_speed(true));

interactive("youtube-player-speed-up",
    "Speed up the Youtube html5 player.",
    youtube_player_change_speed(false));

define_key(youtube_player_keymap, "C-c return", "youtube-player-play-or-pause");
define_key(youtube_player_keymap, "C-c C-m", "youtube-player-mute");
define_key(youtube_player_keymap, "C-c C-f", "youtube-player-fullscreen");
define_key(youtube_player_keymap, "C-c C-[", "youtube-player-speed-down");
define_key(youtube_player_keymap, "C-c C-]", "youtube-player-speed-up");

define_keymaps_page_mode("youtube-player-mode",
    build_url_regexp($domain = "youtube", $allow_www = true),
    { normal: youtube_player_keymap },
    $display_name = "Youtube-Player");

page_mode_activate(youtube_player_mode);

provide("youtube-player");
