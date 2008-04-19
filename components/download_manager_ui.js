/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

// Register the Conkeror download_manager_ui, which doesn't really do anything at all

const classID = Components.ID("{7770E0D0-C4A0-11DC-95FF-0800200C9A66}");
const classDescription = "Conkeror Download Manager UI";
const contractID = "@mozilla.org/download-manager-ui;1";

var module = {

    /* This firstTime trick is used to delay the registration.  This
     * is needed to ensure it overrides the built-in component for the
     * same contractID (the built-in nsHelperAppDlg.js being
     * overridden uses this as well, and as a result we have to). */

    /* http://dietrich.ganx4.com/blog/?p=221#comment-14 */
    /* https://bugzilla.mozilla.org/show_bug.cgi?id=253125 */
    /* https://bugzilla.mozilla.org/show_bug.cgi?id=253136 */

    /* We can't use XPCOMUtils because that doesn't provide this delay
     * trick. */

    firstTime: true,

    // registerSelf: Register this component.
    registerSelf: function (compMgr, fileSpec, location, type) {
        if (this.firstTime) {
            this.firstTime = false;
            throw Components.results.NS_ERROR_FACTORY_REGISTER_AGAIN;
        }
        compMgr = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);

        compMgr.registerFactoryLocation( classID,
                                         classDescription,
                                         contractID,
                                         fileSpec,
                                         location,
                                         type );
    },

    // getClassObject: Return this component's factory object.
    getClassObject: function (compMgr, cid, iid) {
        if (!cid.equals(classID)) {
            throw Components.results.NS_ERROR_NO_INTERFACE;
        }

        if (!iid.equals(Components.interfaces.nsIFactory)) {
            throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
        }

        return this.factory;
    },

    /* factory object */
    factory: {
        createInstance: function (outer, iid) {
            if (outer != null)
                throw Components.results.NS_ERROR_NO_AGGREGATION;

            /* Return an instance of the Conkeror-scope download_helper object. */
            var conkeror = Components.classes["@conkeror.mozdev.org/application;1"].getService().wrappedJSObject;
            return (new conkeror.download_manager_ui()).QueryInterface(iid);
        }
    },

    canUnload: function(compMgr) { return true; },
};

function NSGetModule(compMgr, fileSpec) {
    return module;
}
