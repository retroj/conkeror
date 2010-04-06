/**
 * (C) Copyright 2007-2010 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

default_pref("general.useragent.extra.conkeror", "Conkeror/"+version);

function set_user_agent (str) {
    session_pref("general.useragent.override", str);
}


