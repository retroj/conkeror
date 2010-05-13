/**
 * (C) Copyright 2008 David Glasser
 * (C) Copyright 2008 Will Farrington
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 * (C) Copyright 2009 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

require("content-buffer.js");

define_keymap("gmail_base_keymap");
define_key(gmail_base_keymap, "C-c g", "find-url");
define_key(gmail_base_keymap, "C-c c", "copy");
define_key(gmail_base_keymap, "C-c x", "shell-command-on-file");
define_key(gmail_base_keymap, "C-c s", "save");
define_key(gmail_base_keymap, "C-c r", "reload");
define_key(gmail_base_keymap, "C-c f", "follow");
define_key(gmail_base_keymap, "C-c t", "follow-top");
define_key(gmail_base_keymap, "C-c b", "bookmark");
define_key(gmail_base_keymap, "tab", null, $fallthrough);


define_keymap("gmail_keymap", $parent = gmail_base_keymap);

// Jumping
define_key(gmail_keymap, "g", null, $fallthrough);
define_key(gmail_keymap, "i", null, $fallthrough);
define_key(gmail_keymap, "t", null, $fallthrough);
define_key(gmail_keymap, "d", null, $fallthrough);
define_key(gmail_keymap, "a", null, $fallthrough);
define_key(gmail_keymap, "b", null, $fallthrough);

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
define_key(gmail_keymap, "C", null, $fallthrough);
define_key(gmail_keymap, "/", null, $fallthrough);
define_key(gmail_keymap, "q", null, $fallthrough);
define_key(gmail_keymap, "?", null, $fallthrough);

// Actions
define_key(gmail_keymap, "s", null, $fallthrough);
define_key(gmail_keymap, "e", null, $fallthrough);
define_key(gmail_keymap, "x", null, $fallthrough);
define_key(gmail_keymap, "y", null, $fallthrough);
define_key(gmail_keymap, "!", null, $fallthrough);
define_key(gmail_keymap, "m", null, $fallthrough);
define_key(gmail_keymap, "#", null, $fallthrough);
define_key(gmail_keymap, "r", null, $fallthrough);
define_key(gmail_keymap, "f", null, $fallthrough);
define_key(gmail_keymap, "N", null, $fallthrough);
define_key(gmail_keymap, ".", null, $fallthrough);
define_key(gmail_keymap, "I", null, $fallthrough);
define_key(gmail_keymap, "U", null, $fallthrough);
define_key(gmail_keymap, "]", null, $fallthrough);
define_key(gmail_keymap, "[", null, $fallthrough);
define_key(gmail_keymap, "l", null, $fallthrough);

define_keymap("gmail_edit_keymap", $parent = gmail_base_keymap);//BAD
define_fallthrough(gmail_edit_keymap, match_text_keys);

function gmail_modality (buffer, element) {
    if (! buffer.input_mode)
        buffer.keymaps.push(gmail_keymap);
    else
        buffer.keymaps.push(gmail_edit_keymap);
}

function gmail_focus_primary_frame (buffer) {
    var frames = buffer.top_frame.frames;
    if (frames.length >= 4)
        buffer.top_frame.frames[3].focus();
}

define_page_mode("gmail_mode",
                 $display_name = "GMail",
                 $enable = function (buffer) {
                     add_hook.call(buffer, "buffer_dom_content_loaded_hook",
                                   gmail_focus_primary_frame);
                     add_hook.call(buffer, "unfocus_hook", gmail_focus_primary_frame);
                     buffer.modalities.push(gmail_modality);
                 },
                 $disable = function (buffer) {
                     remove_hook.call(buffer, "buffer_dom_content_loaded_hook",
                                      gmail_focus_primary_frame);
                     remove_hook.call(buffer, "unfocus_hook", gmail_focus_primary_frame);
                     var i = buffer.modalities.indexOf(gmail_modality);
                     if (i > -1)
                         buffer.modalities.splice(i, 1);
                 });

var gmail_re = build_url_regex($domain = "mail.google",
                               $path = new RegExp('(?!support)'));
auto_mode_list.push([gmail_re, gmail_mode]);

provide("gmail");
