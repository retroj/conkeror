/**
 * (C) Copyright 2008 Martin Dybdal
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("bindings/default/content-buffer/normal.js");

/* Keymap for checkboxes and radiobuttons */
define_keymap("content_buffer_checkbox_keymap", $parent = content_buffer_normal_keymap);

define_key(content_buffer_checkbox_keymap, "space", null, $fallthrough);

