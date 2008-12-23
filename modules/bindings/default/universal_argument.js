/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 * (C) Copyright 2008 John Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

define_key(default_base_keymap, "C-u", "universal-argument");

for (var i = 0; i <= 9; ++i)
    define_key(universal_argument_keymap, String(i), "universal-digit");

define_key(universal_argument_keymap, "-", "universal-negate");

