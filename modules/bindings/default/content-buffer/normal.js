/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2009 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

bind_scroll_keys(content_buffer_normal_keymap);
bind_selection_keys(content_buffer_normal_keymap);

// URL
define_key(content_buffer_normal_keymap, "u", "up");
define_key(content_buffer_normal_keymap, "F", "forward");
define_key(content_buffer_normal_keymap, "B", "back");
define_key(content_buffer_normal_keymap, "l", "back");
define_key(content_buffer_normal_keymap, "r", "reload");
define_key(content_buffer_normal_keymap, "g", "find-url");
define_key(content_buffer_normal_keymap, "G", "find-alternate-url");
define_key(content_buffer_normal_keymap, "C-y", "paste-url");
define_key(content_buffer_normal_keymap, "C-x C-v", "find-alternate-url");
define_key(content_buffer_normal_keymap, "C-x C-s", "save-page");
define_key(content_buffer_normal_keymap, "C-x h", "cmd_selectAll");

define_key(content_buffer_normal_keymap, "C-g", "stop-loading");

define_key(content_buffer_normal_keymap, "escape", "unfocus");
define_key(content_buffer_normal_keymap, "M-escape", "unfocus");

define_key(content_buffer_normal_keymap, "tab", "browser-focus-next-form-field");
define_key(content_buffer_normal_keymap, "S-tab", "browser-focus-previous-form-field");

// isearch (non-interactive)
define_key(content_buffer_normal_keymap, "S", "isearch-continue-forward");
define_key(content_buffer_normal_keymap, "R", "isearch-continue-backward");

define_key(content_buffer_normal_keymap, "C-x return c", "charset-prefix");
define_key(content_buffer_normal_keymap, "C-x return r", "reload-with-charset");
