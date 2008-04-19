/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2008 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

// Scripts & Windows prefs
pref("dom.disable_open_during_load",              true);
pref("javascript.options.showInConsole",          false);
// Make the status bar reliably present and unaffected by pages
pref("dom.disable_window_open_feature.status",    true);
// This is the pref to control the location bar, change this to true to
// force this instead of or in addition to the status bar - this makes
// the origin of popup windows more obvious to avoid spoofing but we
// cannot do it by default because it affects UE for web applications.
pref("dom.disable_window_open_feature.location",  true);
pref("dom.disable_window_status_change",          true);
// allow JS to move and resize existing windows
pref("dom.disable_window_move_resize",            true);
// prevent JS from monkeying with window focus, etc
pref("dom.disable_window_flip",                   true);


/* keypress must be included in this list for even popups created by
 * Conkeror's built-in follow command to be permitted.
 */
pref("dom.popup_allowed_events", "change click dblclick mouseup reset submit keypress");
