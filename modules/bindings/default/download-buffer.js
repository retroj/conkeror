/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 * (C) Copyright 2009 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

define_key(download_buffer_keymap, "d", "download-cancel");
define_key(download_buffer_keymap, "r", "download-retry-or-resume");
define_key(download_buffer_keymap, "p", "download-pause-or-resume");
define_key(download_buffer_keymap, "delete", "download-remove");
define_key(download_buffer_keymap, "C-d", "download-remove");
define_key(download_buffer_keymap, "x", "download-shell-command");
define_key(download_buffer_keymap, "o", "download-shell-command");
