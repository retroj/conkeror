
/* debugging prefs */

// enable output for dump()
pref("browser.dom.window.dump.enabled", true);

pref("javascript.options.showInConsole", true);
pref("javascript.options.strict", true);

// There is no reason not to use the cache within a session, though
//pref("nglayout.debug.disable_xul_cache", true);

// This prevents cached versions of XUL and JavaScript files from being saved to disk
pref("nglayout.debug.disable_xul_fastload", true);
