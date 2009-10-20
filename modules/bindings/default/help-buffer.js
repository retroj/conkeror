/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 * (C) Copyright 2009 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("bindings/default/special-buffer.js");

define_keymap("help_buffer_keymap", $parent = special_buffer_keymap);

define_key(help_buffer_keymap, "\\", "view-referenced-source-code");
