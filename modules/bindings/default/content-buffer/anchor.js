/**
 * (C) Copyright 2009 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

define_key(content_buffer_anchor_keymap, "return", "follow",
           $browser_object = browser_object_focused_element);
define_key(content_buffer_anchor_keymap, "o", "follow-new-buffer",
           $browser_object = browser_object_focused_element);
