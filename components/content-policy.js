/**
 * (C) Copyright 2010 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

const Cc = Components.classes;
const Ci = Components.interfaces;
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

var content_policy_listener;

function content_policy () {
    this.conkeror = Cc["@conkeror.mozdev.org/application;1"]
        .getService()
        .wrappedJSObject;
    this.conkeror.define_hook("content_policy_hook", "RUN_HOOK_UNTIL_SUCCESS");
    this.conkeror.define_variable("content_policy_scheme_whitelist",
        { about: true, chrome: true, data: true, javascript: true,
          mailto: true, "moz-icon": true },
        "Requests whose scheme is in this structure (with a true value) "+
        "will be whitelisted before calling content_policy_hook.");
    this.conkeror.content_policy_listener = this;
}
content_policy.prototype = {
    QueryInterface: XPCOMUtils.generateQI([Ci.nsIContentPolicy,
                                           Ci.nsIObserverService]),
    contractID: "@conkeror.org/content-policy-listener;1",
    classID: Components.ID("{2926dd11-4d76-4965-bcdc-4aaad70ada04}"),
    classDescription: "content_policy",
    _xpcom_factory: {
        createInstance: function (outer, iid) {
            if (outer)
                throw Cr.NS_ERROR_NO_AGGREGATION;
            if (! content_policy_listener)
                content_policy_listener = new content_policy();
            return content_policy_listener;
        }
    },
    _xpcom_categories: [{category: "content-policy"}],

    enabled: true,
    shouldLoad: function (content_type,     //unsigned long
                          content_location, //nsIURI
                          request_origin,   //nsIURI
                          context,          //nsISupports
                          mime_type_guess,  //ACString
                          extra)            //nsISupports
    {
        if (this.enabled) {
            if (this.conkeror.content_policy_scheme_whitelist[content_location.scheme])
                return Ci.nsIContentPolicy.ACCEPT;
            var action = this.conkeror.content_policy_hook.run(
                content_type, content_location, request_origin,
                context, mime_type_guess, extra);
        }
        return (action || Ci.nsIContentPolicy.ACCEPT);
    },
    shouldProcess: function (content_type,     //unsigned long
                             content_location, //nsIURI
                             request_origin,   //nsIURI
                             context,          //nsISupports
                             mime_type,        //ACString
                             extra)            //nsISupports
    {
        return Ci.nsIContentPolicy.ACCEPT;
    }
};

if (XPCOMUtils.generateNSGetFactory)
    var NSGetFactory = XPCOMUtils.generateNSGetFactory([content_policy]); //XULRunner 2.0
else
    var NSGetModule = XPCOMUtils.generateNSGetModule([content_policy]);
