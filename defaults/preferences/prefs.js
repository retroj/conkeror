/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 * (C) Copyright 2011 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

pref("app.vendorURL", "http://conkeror.org/");
pref("app.releaseNotesURL", "http://conkeror.org/BreakingChanges");

pref("browser.chromeURL", "chrome://conkeror-gui/content/conkeror.xul");

pref("accessibility.typeaheadfind", false);
pref("accessibility.typeaheadfind.flashBar", 1);

// Make sure access keys do not override conkeror keys
pref("ui.key.generalAccessKey", 0);


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


// Extensions
//
//  see https://developer.mozilla.org/en/XULRunner_tips#Extension_Manager
//
pref("xpinstall.dialog.confirm", "chrome://mozapps/content/xpinstall/xpinstallConfirm.xul");
pref("xpinstall.dialog.progress.skin", "chrome://mozapps/content/extensions/extensions.xul?type=themes");
pref("xpinstall.dialog.progress.chrome", "chrome://mozapps/content/extensions/extensions.xul?type=extensions");
pref("xpinstall.dialog.progress.type.skin", "Extension:Manager-themes");
pref("xpinstall.dialog.progress.type.chrome", "Extension:Manager-extensions");
pref("extensions.update.autoUpdateDefault", true);
pref("extensions.update.enabled", true);
pref("extensions.update.interval", 86400);
pref("extensions.dss.enabled", false);
pref("extensions.dss.switchPending", false);
pref("extensions.ignoreMTimeChanges", false);
pref("extensions.logging.enabled", false);
pref("general.skins.selectedSkin", "classic/1.0");
pref("extensions.update.url", "chrome://mozapps/locale/extensions/extensions.properties");
pref("extensions.getMoreExtensionsURL", "chrome://mozapps/locale/extensions/extensions.properties");
pref("extensions.getMoreThemesURL", "chrome://mozapps/locale/extensions/extensions.properties");
pref("extensions.getAddons.cache.enabled", false);


pref("browser.formfill.enable", true);


// Plugins
//
//  Use plugin-container to isolate crashes for the following plugins.
//
pref("dom.ipc.plugins.enabled.libflashplayer.so", true);
