pref("browser.chromeURL", "chrome://conkeror/content/conkeror.xul");

pref("accessibility.typeaheadfind",               false);

// Make sure access keys do not override conkeror keys
pref("ui.key.generalAccessKey",                   0);


/* Show error pages instead of an alert window. */
pref("browser.xul.error_pages.enabled", true);

/* Surely preferred by most Conkeror users */
pref("plugin.expose_full_path", true);

/* Disable useless warnings */
pref("general.warnOnAboutConfig", false);
pref("security.warn_entering_secure", false);
pref("security.warn_entering_weak", false);
pref("security.warn_leaving_secure", false);
pref("security.warn_submit_insecure", false);
pref("security.warn_viewing_mixed", false);

pref("extensions.getMoreExtensionsURL", "about:blank");
pref("extensions.dss.enabled", false);
pref("extensions.dss.switchPending", false);
