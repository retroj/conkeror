/**
 * (C) Copyright 2007-2008 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("bindings/default/content-buffer/normal.js");
require("element.js");

define_key(content_buffer_normal_keymap, "i", "browser-object-images");
define_key(content_buffer_normal_keymap, "n", "browser-object-links");
define_key(content_buffer_normal_keymap, "m", "browser-object-frames");
define_key(content_buffer_normal_keymap, "e", "browser-object-media");


define_key(content_buffer_normal_keymap, "S-8 e", "browser-object-media");
define_key(content_buffer_normal_keymap, "S-8 i", "browser-object-images");
define_key(content_buffer_normal_keymap, "S-8 n", "browser-object-links");
define_key(content_buffer_normal_keymap, "S-8 m", "browser-object-frames");
define_key(content_buffer_normal_keymap, "S-8 M", "browser-object-mathml");
define_key(content_buffer_normal_keymap, "S-8 u", "browser-object-url");
define_key(content_buffer_normal_keymap, "S-8 a", "browser-object-alt");
define_key(content_buffer_normal_keymap, "S-8 t", "browser-object-title");
define_key(content_buffer_normal_keymap, "S-8 T", "browser-object-title-or-alt");


define_key(content_buffer_normal_keymap, "open_bracket",
           new context_case(
               function (I) { return I._browser_object_class; }, "follow",
               function (I) { return true; }, "browser-object-relationship-previous"));
define_key(content_buffer_normal_keymap, "close_bracket",
           new context_case(
               function (I) { return I._browser_object_class; }, "follow",
               function (I) { return true; }, "browser-object-relationship-next"));


define_key(content_buffer_normal_keymap, "f", "follow", $category = "Browser object");
define_key(content_buffer_normal_keymap, ";", "focus", $category = "Browser object");
define_key(content_buffer_normal_keymap, "t", "follow-top", $category = "Browser object");
define_key(content_buffer_normal_keymap, "s", "save", $category = "Browser object");
define_key(content_buffer_normal_keymap, "c", "copy", $category = "Browser object");
define_key(content_buffer_normal_keymap, "back_slash", "view-source", $category = "Browser object");
define_key(content_buffer_normal_keymap, "x", "shell-command-on-file", $category = "Browser object");
define_key(content_buffer_normal_keymap, "X", "shell-command-on-url", $category = "Browser object");
define_key(content_buffer_normal_keymap, "b", "bookmark", $category = "Browser object");
define_key(content_buffer_normal_keymap, "v", "view-as-mime-type", $category = "Browser object");

