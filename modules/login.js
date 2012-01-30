/**
 * (C) Copyright 2011 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

/**
 * Find and return a login (an nsILoginInfo) matching the given host.  The
 * host can be given as a string (for an exact match) or as a RegExp.
 */
function login_find (host) {
    var lm = Cc["@mozilla.org/login-manager;1"]
        .getService(Ci.nsILoginManager);
    var logins = lm.getAllLogins({});
    for (var i = 0, n = logins.length; i < n; ++i) {
        if (host instanceof RegExp) {
            if (host.test(logins[i].hostname))
                return logins[i];
        } else if (logins[i].hostname == host)
            return logins[i];
    }
    return null;
}


/**
 * Return an array of all logins (nsILoginInfo objects) that match the
 * given host.  Host may be given as a string (for an exact match) or as a
 * RegExp.
 */
function login_find_all (host) {
    var result = [];
    var lm = Cc["@mozilla.org/login-manager;1"]
        .getService(Ci.nsILoginManager);
    var logins = lm.getAllLogins({});
    for (var i = 0, n = logins.length; i < n; ++i) {
        if (host instanceof RegExp) {
            if (host.test(logins[i].hostname))
                result.push(logins[i]);
        } else if (logins[i].hostname == host)
            result.push(logins[i]);
    }
    return result;
}


/**
 * Remove the given login.  The login must be an nsILoginInfo object,
 * which can be gotten from login_find or login_find_all.
 */
function login_remove (login_info) {
    var lm = Cc["@mozilla.org/login-manager;1"]
        .getService(Ci.nsILoginManager);
    lm.removeLogin(login_info);
}


/**
 * Remove all logins from the login manager.
 */
function login_remove_all () {
    var lm = Cc["@mozilla.org/login-manager;1"]
        .getService(Ci.nsILoginManager);
    lm.removeAllLogins();
}


/**
 * host, username, and password are mandatory arguments.  one or the other
 * of form_submit_url and httprealm is also mandatory, but if neither is
 * given, the host will be used for form_submit_url.  httprealm
 * corresponds to the value of the http header in a 401 Authorization
 * Required, 'WWW-Authenticate: Basic realm="foo"'.
 */
function login_add (host, username, password,
                    httprealm, form_submit_url,
                    username_field, password_field) {
    if (form_submit_url == null && httprealm == null)
        form_submit_url = host;
    var lm = Cc["@mozilla.org/login-manager;1"]
        .getService(Ci.nsILoginManager);
    var login_info = new Components.Constructor(
        "@mozilla.org/login-manager/loginInfo;1",
        Ci.nsILoginInfo, "init");
    var info = new login_info(host,
                              (form_submit_url || null),
                              (httprealm || null),
                              username, password,
                              (username_field || ""),
                              (password_field || ""));
    lm.addLogin(info);
}


/**
 * login_set first removes all existing logins for the given host, then
 * passes all of its arguments to login_add.
 */
function login_set (host, username, password,
                    httprealm, form_submit_url,
                    username_field, password_field) {
    login_find_all(host).map(login_remove);
    login_add(host, username, password,
              httprealm, form_submit_url,
              username_field, password_field);
}


provide("login");
