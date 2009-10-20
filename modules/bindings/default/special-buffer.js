/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 * (C) Copyright 2009 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("bindings/default/global.js");

define_keymap("special_buffer_keymap", $parent = default_global_keymap);

bind_scroll_keys(special_buffer_keymap);
bind_selection_keys(special_buffer_keymap);
