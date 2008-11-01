/**
 * (C) Copyright 2007-2008 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("bindings/default/content-buffer/normal.js");

define_keymap("content_buffer_form_keymap", $parent = content_buffer_normal_keymap);

define_key(content_buffer_form_keymap, "C-c C-c", "submit-form");

