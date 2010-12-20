/**
 * (C) Copyright 2010 Desmond O. Chang <dochang@gmail.com>
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

require("content-buffer.js");

define_keymap("github_keymap", $display_name = "github");

interactive("github-keyboard-shortcuts", null, function (I) {
    var d = I.buffer.document;
    var js = d.createElement("script");
    js.setAttribute("type", "text/javascript");
    js.textContent = "jQuery('#main a.keyboard-shortcuts').click();";
    d.body.appendChild(js);
});

[// Site-wide shortcuts
 "s",                        // Focus site search
 "?",                        // Bring up this help dialog
 // Commit list
 "j",                        // Move selected down
 "k",                        // Move selected up
 "t",                        // Open tree
 "p",                        // Open parent
 "c", "o", "return",         // Open commit
 // Pull request list
 "j",                        // Move selected down
 "k",                        // Move selected up
 "o", "return",              // Open issue
 // Issues
 "j",                        // Move selected down
 "k",                        // Move selected up
 "x",                        // Toggle select target
 "o", "return",              // Open issue
 "I",                        // Mark selected as read
 "U",                        // Mark selected as unread
 "e",                        // Close selected
 "y",                        // Remove selected from view
 "c",                        // Create issue
 "l",                        // Create label
 "i",                        // Back to inbox
 "u",                        // Back to issues
 "/",                        // Focus issues search
 // Network Graph
 "left", "h",                // Scroll left
 "right", "l",               // Scroll right
 "up", "k",                  // Scroll up
 "down", "j",                // Scroll down
 "t",                        // Toggle visibility of head labels
 "S-left", "H",              // Scroll all the way left
 "S-right", "L",             // Scroll all the way right
 "S-up", "K",                // Scroll all the way up
 "S-down", "J"]              // Scroll all the way down
    .map(function (x) define_key(github_keymap, x, null, $fallthrough));

define_key(github_keymap, "?", "github-keyboard-shortcuts");


var github_modality = {
    normal: github_keymap
};

define_page_mode("github_mode",
    $enable = function (buffer) {
        buffer.content_modalities.push(github_modality);
    },
    $disable = function (buffer) {
        var i = buffer.content_modalities.indexOf(github_modality);
        if (i > -1)
            buffer.content_modalities.splice(i, 1);
    },
    $display_name = "Github"
);

auto_mode_list.push([
    build_url_regex($domain = "github", $allow_www = true),
    github_mode
]);

provide("github");
