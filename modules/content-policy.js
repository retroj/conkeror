/**
 * (C) Copyright 2010-2011 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

function content_policy_init () {
    var xulrunner_version = Cc['@mozilla.org/xre/app-info;1']
        .getService(Ci.nsIXULAppInfo)
        .platformVersion;
    var vc = Cc["@mozilla.org/xpcom/version-comparator;1"]
        .getService(Ci.nsIVersionComparator);
    var reg = Components.manager.QueryInterface(Ci.nsIComponentRegistrar);
    var file = file_locator_service.get("CurProcD", Ci.nsIFile);
    if (vc.compare(xulrunner_version, "2.0") >= 0) {
        file.append("content-policy.manifest");
    } else {
        file.append("components");
        file.append("content-policy.js");
    }
    reg.autoRegister(file);
}

content_policy_init();

interactive("content-policy-enable",
    "Enable content-policy processing.",
    function (I) {
        if (content_policy_listener.enabled) {
            I.minibuffer.message("Content-policy already enabled.");
            return;
        }
        content_policy_listener.enabled = true;
        I.minibuffer.message("Content-policy enabled.");
    });

interactive("content-policy-disable",
    "Enable content-policy processing.",
    function (I) {
        if (! content_policy_listener.enabled) {
            I.minibuffer.message("Content-policy already disabled.");
            return;
        }
        content_policy_listener.enabled = false;
        I.minibuffer.message("Content-policy disabled.");
    });

interactive("content-policy-toggle",
    "Turn the content-policy off if it is on, and on if it is off.",
    function (I) {
        content_policy_listener.enabled = !content_policy_listener.enabled;
        if (content_policy_listener.enabled)
            I.minibuffer.message("Content-policy enabled.");
        else
            I.minibuffer.message("Content-policy disabled.");
    });

const content_policy_accept = Ci.nsIContentPolicy.ACCEPT;
const content_policy_reject = Ci.nsIContentPolicy.REJECT_REQUEST;

/*
 * By Type Filtering
 */

var content_policy_bytype_table = {
    1: null, get other () { return this[1]; },
             set other (x) { return this[1] = x; },
    2: null, get script () { return this[2]; },
             set script (x) { return this[2] = x; },
    3: null, get image () { return this[3]; },
             set image (x) { return this[3] = x; },
    4: null, get stylesheet () { return this[4]; },
             set stylesheet (x) { return this[4] = x; },
    5: null, get object () { return this[5]; },
             set object (x) { return this[5] = x; },
    6: null, get document () { return this[6]; },
             set document (x) { return this[6] = x; },
    7: null, get subdocument () { return this[7]; },
             set subdocument (x) { return this[7] = x; },
    9: null, get xbl () { return this[9]; },
             set xbl (x) { return this[9] = x; },
    10: null, get ping () { return this[10]; },
              set ping (x) { return this[10] = x; },
    11: null, get xmlhttprequest () { return this[11]; },
              set xmlhttprequest (x) { return this[11] = x; },
    12: null, get object_subrequest () { return this[12]; },
              set object_subrequest (x) { return this[12] = x; },
    13: null, get dtd () { return this[13]; },
              set dtd (x) { return this[13] = x; },
    14: null, get font () { return this[14]; },
              set font (x) { return this[14] = x; },
    15: null, get media () { return this[15]; },
              set media (x) { return this[15] = x; }
};

/**
 * content_policy_bytype is a function for content_policy_hook, which uses
 * content_type as the primary key in determining the policy for requests.
 * its configuration is in content_policy_bytype_table.
 */
function content_policy_bytype (content_type, content_location,
                                request_origin, context, mime_type_guess,
                                extra) {
    var rules = content_policy_bytype_table[content_type];
    if (rules)
        return rules(content_type, content_location,
                     request_origin, context, mime_type_guess,
                     extra);
    return null;
}

provide("content-policy");
