/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 * (C) Copyright 2009 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("bindings/default/content-buffer/textarea.js");

define_keymap("content_buffer_richedit_keymap", $parent = content_buffer_textarea_keymap);
define_fallthrough(content_buffer_richedit_keymap, match_text_keys);
