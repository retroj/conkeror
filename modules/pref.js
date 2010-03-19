/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2009 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

function set_branch_pref (branch, name, value) {
    if (typeof(value) == "string") {
        branch.setCharPref(name, value);
    } else if (typeof(value) == "number") {
        branch.setIntPref(name, value);
    } else if (typeof(value) == "boolean") {
        branch.setBoolPref(name, value);
    }
}

function default_pref (name, value) {
    var branch = preferences.getDefaultBranch(null);
    set_branch_pref(branch, name, value);
}

function user_pref (name, value) {
    var branch = preferences.getBranch(null);
    set_branch_pref(branch, name, value);
}

function get_branch_pref (branch, name) {
    switch (branch.getPrefType(name)) {
    case branch.PREF_STRING:
        return branch.getCharPref(name);
    case branch.PREF_INT:
        return branch.getIntPref(name);
    case branch.PREF_BOOL:
        return branch.getBoolPref(name);
    default:
        return null;
    }
}

function get_localized_pref (name) {
    try {
        return preferences.getBranch(null).getComplexValue(name, Ci.nsIPrefLocalizedString).data;
    } catch (e) {
        return null;
    }
}

function get_pref (name) {
    var branch = preferences.getBranch(null);
    return get_branch_pref(branch, name);
}

function get_default_pref (name) {
    var branch = preferences.getDefaultBranch(null);
    return get_branch_pref(branch, name);
}

function clear_pref (name) {
    var branch = preferences.getBranch(null);
    return branch.clearUserPref(name);
}

function pref_has_user_value (name) {
    var branch = preferences.getBranch(null);
    return branch.prefHasUserValue(name);
}

function pref_has_default_value (name) {
    var branch = preferences.getDefaultBranch(null);
    return branch.prefHasUserValue(name);
}

function session_pref (name, value) {
    try {
        clear_pref (name);
    } catch (e) {}
    return default_pref(name, value);
}

function watch_pref (pref, hook) {
    /* Extract pref into branch.pref */
    let match = pref.match(/^(.*[.])?([^.]*)$/);
    let br = match[1];
    let key = match[2];
    let branch = preferences.getBranch(br).QueryInterface(Ci.nsIPrefBranch2);
    let observer = {
        observe: function (subject, topic, data) {
            if (topic == "nsPref:changed" && data == key) {
                hook();
            }
        }
    };
    branch.addObserver("", observer, false);
}

provide("pref");
