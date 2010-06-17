/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2009 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 * (C) Copyright 2009 Deniz Dogan
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

define_fallthrough(content_buffer_text_keymap, match_text_keys);

define_key(content_buffer_text_keymap, "C-i", "edit-current-field-in-external-editor");
define_key(content_buffer_text_keymap, "C-x x", "edit-current-field-in-external-editor");
