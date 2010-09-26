/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 * (C) Copyright 2009-2010 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

define_fallthrough(quote_next_keymap, match_any_key);
define_key(quote_next_keymap, match_any_key, "quote-next-mode-disable", $fallthrough);

define_fallthrough(quote_keymap, match_not_escape_key);
define_key(quote_keymap, "escape", "quote-mode-disable");
define_key(quote_keymap, "M-escape", "quote-mode-disable");
define_key(quote_keymap, match_any_key, null, $fallthrough);
