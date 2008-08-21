/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

define_key(default_base_keymap, "C-u", null, $hook = universal_argument);

for (var i = 0; i <= 9; ++i)
    define_key(universal_argument_keymap, String(i), null, $hook = universal_digit);
define_key(universal_argument_keymap, "subtract", null, $hook = universal_negate);

