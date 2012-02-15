/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

/**
 * This property can have three distinct meanings, depending on whether it is positive, zero, or negative.
 *
 * If it is positive, all modules corresponding to children of
 * conkeror.load. set to a positive number are loaded.
 *
 * If it is set to 0, only children of conkeror.load. that have a
 * positive user value (i.e. not just a default value) are loaded.
 *
 * If it is negative, no additional optional modules are loaded.
 */
pref("conkeror.loadDefaultModules", 1);

/**
 * This preference specifies a regular expression of additional
 * modules to load.  Each module corresponding to a child of
 * "conkeror.load." set to a _non-negative_ value that matches this
 * regular expression (partial matches are not permitted) will be
 * loaded.  These modules are loaded in addition to any modules loaded
 * according to the description of conkeror.loadDefaultModules above.
 * Thus, if the preference corresponding to a module has a negative
 * value, it will never be loaded, but if it is set to 0, then it will
 * be loaded only if it matches this regular expression.
 *
 * This preference may be useful as a concise way of specifying that
 * you want to load all of a certain class of modules.  For example,
 * the value "(extensions|page-modes)/.*" would specify to load all
 * modules in the extensions/ (extension support modules) or
 * page-modes/ directories.
 */
pref("conkeror.loadModules", "");

pref("conkeror.load.bindings/default/bindings", 1);
pref("conkeror.load.mode-line", 1);
pref("conkeror.load.daemon", 1);

// Page mode modules
pref("conkeror.load.page-modes/dailymotion", 1);
pref("conkeror.load.page-modes/grooveshark", 1);
pref("conkeror.load.page-modes/google-calendar", 1);
pref("conkeror.load.page-modes/google-maps", 1);
pref("conkeror.load.page-modes/google-reader", 1);
pref("conkeror.load.page-modes/google-video", 1);
pref("conkeror.load.page-modes/smbc", 1);
pref("conkeror.load.page-modes/stackexchange", 1);
pref("conkeror.load.page-modes/xkcd", 1);
pref("conkeror.load.page-modes/youtube", 1);
pref("conkeror.load.page-modes/youtube-player", 1);
