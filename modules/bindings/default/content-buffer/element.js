/**
 * (C) Copyright 2007-2008 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("bindings/default/content-buffer/normal.js");
require("element.js");

define_key(content_buffer_normal_keymap, "i", "browser-object-class-images");

define_key(content_buffer_normal_keymap, "n", "browser-object-class-links");

define_key(content_buffer_normal_keymap, "m", "browser-object-class-frames");

define_key(content_buffer_normal_keymap, "e", "browser-object-class-media");

define_key(content_buffer_normal_keymap, "S-8 e", "browser-object-class-media");

define_key(content_buffer_normal_keymap, "S-8 i", "browser-object-class-images");

define_key(content_buffer_normal_keymap, "S-8 n", "browser-object-class-links");

define_key(content_buffer_normal_keymap, "S-8 m", "browser-object-class-frames");

define_key(content_buffer_normal_keymap, "S-8 M", "browser-object-class-mathml");

define_key(content_buffer_normal_keymap, "S-8 u", "browser-object-class-url");

define_key(content_buffer_normal_keymap, "S-8 a", "browser-object-class-alt");
define_key(content_buffer_normal_keymap, "S-8 t", "browser-object-class-title");
define_key(content_buffer_normal_keymap, "S-8 T", "browser-object-class-title-or-alt");


function bind_element_operations(keymap) {
    define_key(keymap, "f", "follow", $category = "Browser object");
    define_key(keymap, ";", "focus", $category = "Browser object");
    define_key(keymap, "t", "follow-top", $category = "Browser object");
    define_key(keymap, "s", "save", $category = "Browser object");
    define_key(keymap, "c", "copy", $category = "Browser object");
    define_key(keymap, "back_slash", "view-source", $category = "Browser object");
    define_key(keymap, "x", "shell-command-on-file", $category = "Browser object");
    define_key(keymap, "X", "shell-command-on-url", $category = "Browser object");
    define_key(keymap, "b", "bookmark", $category = "Browser object");
    define_key(keymap, "v", "view-as-mime-type", $category = "Browser object");
}

bind_element_operations(content_buffer_normal_keymap);
