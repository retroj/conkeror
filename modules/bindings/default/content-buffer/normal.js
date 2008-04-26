/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2008 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("bindings/default/global.js");
require("bindings/default/basic-commands.js");

define_keymap("content_buffer_normal_keymap", $parent = default_global_keymap);

bind_scroll_keys(content_buffer_normal_keymap);
bind_selection_keys(content_buffer_normal_keymap);

// URL
define_key(content_buffer_normal_keymap, "u", "go-up");
define_key(content_buffer_normal_keymap, "F", "go-forward");
define_key(content_buffer_normal_keymap, "B", "go-back");
define_key(content_buffer_normal_keymap, "l", "go-back");
define_key(content_buffer_normal_keymap, "r", "reload");
define_key(content_buffer_normal_keymap, "g", "find-url");
define_key(content_buffer_normal_keymap, "C-x C-v", "find-alternate-url");


define_key(content_buffer_normal_keymap, "C-g", "stop-loading");


define_key(content_buffer_normal_keymap, "C-return", "follow-link-in-new-buffer");

define_key(content_buffer_normal_keymap, "escape", "unfocus");

define_key(content_buffer_normal_keymap, "C-q", "quote-next-input-mode");
define_key(content_buffer_normal_keymap, "C-M-q", "quote-input-mode");

define_key(content_buffer_normal_keymap, "close_bracket close_bracket", "follow-next");
define_key(content_buffer_normal_keymap, "open_bracket open_bracket", "follow-previous");

define_key(content_buffer_normal_keymap, "return", null, $fallthrough);

define_key(content_buffer_normal_keymap, "tab", "browser-focus-next-form-field");

define_key(content_buffer_normal_keymap, "S-tab", "browser-focus-previous-form-field");
