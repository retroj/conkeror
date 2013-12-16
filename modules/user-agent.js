/**
 * (C) Copyright 2007-2011,2013 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

default_pref("general.useragent.extra.conkeror", "Conkeror/"+version);

/**
 * set_user_agent overrides the user agent string globally with whatever
 * string is passed to it.  If called with null or no argument, any
 * current override is undone, reverting to Conkeror's default user agent
 * string.  The override is performed (rather non-conventionally) with a
 * default pref instead of a user pref, which allows the override to be
 * done cleanly from the rc, without interference by persisting prefs in
 * the profile.
 */
function set_user_agent (str) {
    const p = "general.useragent.override";
    if (str == null) {
        clear_default_pref(p);
        user_pref(p, "");
        clear_pref(p);
    } else
        session_pref(p, str);
}


/**
 * user_agent_firefox returns a Firefox-like user agent string.  It is
 * alas, not perfect in all configurations, but should suffice for most
 * ua-spoofing purposes.
 */
function user_agent_firefox () {
    var appinfo = Cc['@mozilla.org/xre/app-info;1']
        .getService(Ci.nsIXULAppInfo);
    var platform = { Darwin: "Macintosh",
                     Linux: "X11",
                     OpenBSD: "X11",
                     WINNT: "Windows NT"
                   }[get_os()] || get_os();
    var geckoversion = appinfo.platformVersion;
    var dot = geckoversion.indexOf(".");
    var ldot = geckoversion.indexOf(".", dot + 1);
    if (ldot > dot)
        geckoversion = geckoversion.substring(0, ldot);
    var geckotrail = appinfo.platformBuildID.substr(0, 8);
    var firefoxversion = geckoversion;
    return "Mozilla/5.0 "+
        "("+platform+"; rv:"+geckoversion+") "+
        "Gecko/"+geckotrail+" Firefox/"+firefoxversion;
}
