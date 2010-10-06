/**
 * (C) Copyright 2007 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

const Cc = Components.classes;
const Ci = Components.interfaces;
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

function cmdline () {}
cmdline.prototype = {
    constructor: cmdline,
    handle: function (cmdline) {
        if (cmdline.preventDefault)
            return;
        cmdline.preventDefault = true;
        var conkeror = Cc["@conkeror.mozdev.org/application;1"]
            .getService()
            .wrappedJSObject;
        conkeror.handle_command_line(cmdline);
    },
    QueryInterface: XPCOMUtils.generateQI([Ci.nsICommandLineHandler]),
    contractID: "@mozilla.org/commandlinehandler/general-startup;1?type=conkeror",
    classID: Components.ID("{0f4dd758-b55a-4386-a79c-8698642eac51}"),
    classDescription: "clh_conkeror",
    _xpcom_categories: [{
            category: "command-line-handler",
            entry: "y-conkeror"
        }]
};

function NSGetModule (compMgr, fileSpec) {
    return XPCOMUtils.generateModule([cmdline]);
}
