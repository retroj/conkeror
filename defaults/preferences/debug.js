/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2008 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

/* debugging prefs */

// enable output for dump()
pref("browser.dom.window.dump.enabled", true);

pref("javascript.options.showInConsole", true);
pref("javascript.options.strict", true);

// There is no reason not to use the cache within a session, though
//pref("nglayout.debug.disable_xul_cache", true);

// This prevents cached versions of XUL and JavaScript files from being saved to disk
pref("nglayout.debug.disable_xul_fastload", true);
