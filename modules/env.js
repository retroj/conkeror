/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2009 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

/**
 * get_os returns a string identifying the current OS.
 * possible values include 'Darwin', 'Linux' and 'WINNT'.
 */
let (xul_runtime = Cc['@mozilla.org/xre/app-info;1']
         .getService(Ci.nsIXULRuntime)) {
    function get_os () {
        return xul_runtime.OS;
    }
};


/**
 * getenv returns the value of a named environment variable or null if
 * the environment variable does not exist.
 */
let (env = Cc['@mozilla.org/process/environment;1']
         .getService(Ci.nsIEnvironment)) {
    function getenv (variable) {
        if (env.exists(variable))
            return env.get(variable);
        return null;
    }
}


/**
 * get_home_directory returns an nsILocalFile object of the user's
 * home directory.
 */
function get_home_directory () {
    var dir = Cc["@mozilla.org/file/local;1"]
        .createInstance(Ci.nsILocalFile);
    if (get_os() == "WINNT")
        dir.initWithPath(getenv('USERPROFILE') ||
                         getenv('HOMEDRIVE') + getenv('HOMEPATH'));
    else
        dir.initWithPath(getenv('HOME'));
    return dir;
}


/* get_current_profile returns the name of the current profile, or
 * null if that information cannot be found.  The result is cached for
 * quick repeat lookup.  This is safe because xulrunner does not
 * support switching profiles on the fly.
 *
 * Profiles don't necessarily have a name--as such this information should
 * not be depended on for anything important.  It is mainly intended for
 * decoration of the window title and mode-line.
 */
let (profile_name = null) {
    function get_current_profile () {
        if (profile_name)
            return profile_name;
        if ("@mozilla.org/profile/manager;1" in Cc) {
            profile_name = Cc["@mozilla.org/profile/manager;1"]
                .getService(Ci.nsIProfile)
                .currentProfile;
            return profile_name;
        }
        var current_profile_path = Cc["@mozilla.org/file/directory_service;1"]
            .getService(Ci.nsIProperties)
            .get("ProfD", Ci.nsIFile).path;
        var profile_service = Cc["@mozilla.org/toolkit/profile-service;1"]
            .getService(Components.interfaces.nsIToolkitProfileService);
        var profiles = profile_service.profiles;
        while (profiles.hasMoreElements()) {
            var p = profiles.getNext().QueryInterface(Ci.nsIToolkitProfile);
            if (current_profile_path == p.localDir.path ||
                current_profile_path == p.rootDir.path)
            {
                profile_name = p.name;
                return p.name;
            }
        }
        return null;
    }
}



function get_locale () {
    const LOCALE_PREF = "general.useragent.locale";
    return get_localized_pref(LOCALE_PREF) || get_pref(LOCALE_PREF);
}

provide("env");
