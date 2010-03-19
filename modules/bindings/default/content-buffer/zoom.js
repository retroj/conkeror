/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

define_key(content_buffer_normal_keymap, "+", "zoom-in-text");
define_key(content_buffer_normal_keymap, "=", "zoom-reset-text");
define_key(content_buffer_normal_keymap, "-", "zoom-out-text");

define_key(content_buffer_normal_keymap, "C-+", "zoom-in-full");
define_key(content_buffer_normal_keymap, "C-=", "zoom-reset-full");
define_key(content_buffer_normal_keymap, "C--", "zoom-out-full");



define_key(content_buffer_normal_keymap, "z i", "zoom-in-text");
define_key(content_buffer_normal_keymap, "z m", "zoom-in-text-more");
define_key(content_buffer_normal_keymap, "z z", "zoom-reset-text");
define_key(content_buffer_normal_keymap, "z o", "zoom-out-text");
define_key(content_buffer_normal_keymap, "z r", "zoom-out-text-more");


define_key(content_buffer_normal_keymap, "z I", "zoom-in-full");
define_key(content_buffer_normal_keymap, "z M", "zoom-in-full-more");
define_key(content_buffer_normal_keymap, "z Z", "zoom-reset-full");
define_key(content_buffer_normal_keymap, "z O", "zoom-out-full");
define_key(content_buffer_normal_keymap, "z R", "zoom-out-full-more");
