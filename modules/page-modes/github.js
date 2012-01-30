/**
 * (C) Copyright 2010 Desmond O. Chang <dochang@gmail.com>
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("content-buffer.js");

define_keymap("github_keymap", $display_name = "github");

interactive("github-keyboard-shortcuts", null, function (I) {
    var buf = I.buffer;
    var elem = buf.document.querySelector("#main a.keyboard-shortcuts");
    if (elem)
        browser_object_follow(buf, FOLLOW_DEFAULT, elem);
    else
        I.minibuffer.message("No keyboard shortcuts help link found on this page");
});

interactive("github-focus-site-search", null, function (I) {
    var buf = I.buffer;
    var elem = buf.document.querySelector("#top_search_form input[name=q]");
    if (elem)
        browser_element_focus(buf, elem);
    else
        I.minibuffer.message("Site search box not found");
});

interactive("github-focus-issues-search", null, function (I) {
    var buf = I.buffer;
    var elem = buf.document.querySelector("#issues span.search input[name=q]");
    if (elem)
        browser_element_focus(buf, elem);
    else
        I.minibuffer.message("Issues search box not found");
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
define_key(github_keymap, "s", "github-focus-site-search");
define_key(github_keymap, "/", "github-focus-issues-search");

define_keymaps_page_mode("github-mode",
    build_url_regexp($domain = "github", $allow_www = true),
    { normal: github_keymap },
    $display_name = "Github");

page_mode_activate(github_mode);

provide("github");
