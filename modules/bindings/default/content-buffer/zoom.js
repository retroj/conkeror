/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("bindings/default/content-buffer/normal.js");

define_key(content_buffer_normal_keymap, "+", "zoom-in-text", $category = "Zoom (text)");
define_key(content_buffer_normal_keymap, "=", "zoom-reset-text", $category = "Zoom (text)");
define_key(content_buffer_normal_keymap, "-", "zoom-out-text", $category = "Zoom (text)");

define_key(content_buffer_normal_keymap, "C-+", "zoom-in-full", $category = "Zoom (full)");
define_key(content_buffer_normal_keymap, "C-=", "zoom-reset-full", $category = "Zoom (full)");
define_key(content_buffer_normal_keymap, "C--", "zoom-out-full", $category = "Zoom (full)");



define_key(content_buffer_normal_keymap, "z i", "zoom-in-text", $category = "Zoom (text)");
define_key(content_buffer_normal_keymap, "z m", "zoom-in-text-more", $category = "Zoom (text)");
define_key(content_buffer_normal_keymap, "z z", "zoom-reset-text", $category = "Zoom (text)");
define_key(content_buffer_normal_keymap, "z o", "zoom-out-text", $category = "Zoom (text)");
define_key(content_buffer_normal_keymap, "z r", "zoom-out-text-more", $category = "Zoom (text)");


define_key(content_buffer_normal_keymap, "z I", "zoom-in-full", $category = "Zoom (full)");
define_key(content_buffer_normal_keymap, "z M", "zoom-in-full-more", $category = "Zoom (full)");
define_key(content_buffer_normal_keymap, "z Z", "zoom-reset-full", $category = "Zoom (full)");
define_key(content_buffer_normal_keymap, "z O", "zoom-out-full", $category = "Zoom (full)");
define_key(content_buffer_normal_keymap, "z R", "zoom-out-full-more", $category = "Zoom (full)");
