/**
 * (C) Copyright 2008 David Glasser
 * (C) Copyright 2008 Will Farrington
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("content-buffer.js");
require("bindings/default/content-buffer/normal.js");
require("bindings/default/content-buffer/richedit.js");
require("bindings/default/content-buffer/text.js");
require("bindings/default/content-buffer/textarea.js");

define_keymap("gmail_keymap", $parent = content_buffer_normal_keymap);

function gmail_label_go(buffer, label)
{
    buffer.window.content.location.hash = "#label/" + encodeURIComponent(label);
}
interactive("gmail-label-go",
            "Go to a GMail label.",
            function(I) {
              gmail_label_go(I.buffer, (yield I.minibuffer.read($prompt = "Go to label: ")));
            });

{
    let gmail_bind_common = function (keymap) {
        define_key(keymap, "C-c C-g", "gmail-label-go");

        // Rebind overridden commands
        define_key(keymap, "C-c g", "find-url");
        define_key(keymap, "C-c c", "copy");
        define_key(keymap, "C-c x", "shell-command-on-file");
        define_key(keymap, "C-c s", "save");
        define_key(keymap, "C-c r", "reload");
        define_key(keymap, "C-c f", "follow");
        define_key(keymap, "C-c t", "follow-top");

        define_key(keymap, "tab", null, $fallthrough);
        define_key(keymap, "escape", "gmail-focus-primary-frame");
    }

    gmail_bind_common(gmail_keymap);

    // Jumping
    define_key(gmail_keymap, "g", null, $fallthrough);
    define_key(gmail_keymap, "i", null, $fallthrough);
    define_key(gmail_keymap, "t", null, $fallthrough);
    define_key(gmail_keymap, "d", null, $fallthrough);
    define_key(gmail_keymap, "a", null, $fallthrough);

    // Threadlist
    define_key(gmail_keymap, "*", null, $fallthrough);

    // Navigation
    define_key(gmail_keymap, "u", null, $fallthrough);
    define_key(gmail_keymap, "j", null, $fallthrough);
    define_key(gmail_keymap, "k", null, $fallthrough);
    define_key(gmail_keymap, "o", null, $fallthrough);
    define_key(gmail_keymap, "n", null, $fallthrough);
    define_key(gmail_keymap, "p", null, $fallthrough);

    // Application
    define_key(gmail_keymap, "c", null, $fallthrough);
    define_key(gmail_keymap, "/", null, $fallthrough);
    define_key(gmail_keymap, "q", null, $fallthrough);
    define_key(gmail_keymap, "?", null, $fallthrough);

    // Actions
    define_key(gmail_keymap, "x", null, $fallthrough);
    define_key(gmail_keymap, "s", null, $fallthrough);
    define_key(gmail_keymap, "y", null, $fallthrough);
    define_key(gmail_keymap, "e", null, $fallthrough);
    define_key(gmail_keymap, "m", null, $fallthrough);
    define_key(gmail_keymap, "!", null, $fallthrough);
    define_key(gmail_keymap, "#", null, $fallthrough);
    define_key(gmail_keymap, "r", null, $fallthrough);
    define_key(gmail_keymap, "f", null, $fallthrough);
    define_key(gmail_keymap, "S-n", null, $fallthrough);
    define_key(gmail_keymap, ".", null, $fallthrough);
    define_key(gmail_keymap, "S-i", null, $fallthrough);
    define_key(gmail_keymap, "S-u", null, $fallthrough);
    define_key(gmail_keymap, "]", null, $fallthrough);
    define_key(gmail_keymap, "[", null, $fallthrough);

    define_keymap("gmail_richedit_keymap", $parent = content_buffer_richedit_keymap);
    gmail_bind_common(gmail_richedit_keymap);

    define_keymap("gmail_text_keymap", $parent = content_buffer_text_keymap);
    gmail_bind_common(gmail_text_keymap);

    define_keymap("gmail_textarea_keymap", $parent = content_buffer_textarea_keymap);
    gmail_bind_common(gmail_textarea_keymap);
}

function gmail_focus_primary_frame(buffer) {
    var frames = buffer.top_frame.frames;
    if (frames.length >= 3)
        buffer.top_frame.frames[2].focus();
}
interactive("gmail-focus-primary-frame", "Focus the main GMail frame.",
            function (I) {gmail_focus_primary_frame(I.buffer); unfocus(I.buffer);});

define_page_mode("gmail_mode", "GMail",
                 $enable = function (buffer) {
                     buffer.local_variables.content_buffer_normal_keymap = gmail_keymap;
                     buffer.local_variables.content_buffer_richedit_keymap = gmail_richedit_keymap;
                     buffer.local_variables.content_buffer_text_keymap = gmail_richedit_keymap;
                     buffer.local_variables.content_buffer_textarea_keymap = gmail_richedit_keymap;
                     add_hook.call(buffer, "buffer_dom_content_loaded_hook", gmail_focus_primary_frame);
                 },
                 $disable = function (buffer) {
                     remove_hook.call(buffer, "buffer_dom_content_loaded_hook", gmail_focus_primary_frame);
                 });

var gmail_re = build_url_regex($domain = "mail.google");
auto_mode_list.push([gmail_re, gmail_mode]);
