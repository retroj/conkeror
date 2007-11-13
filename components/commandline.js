
const conkeror_cmdline = {

    /* nsISupports */
    QueryInterface : function (iid)
    {
        if (iid.equals(Components.interfaces.nsICommandLineHandler) ||
            iid.equals(Components.interfaces.nsIFactory) ||
            iid.equals(Components.interfaces.nsISupports))
            return this;
        
        throw Components.results.NS_ERROR_NO_INTERFACE;
    },

    /* nsICommandLineHandler */
    handle : function (cmdline) {
        cmdline.preventDefault = true;
        
        var conkeror = Components.classes["@conkeror.mozdev.org/application;1"]
        .getService ()
        .wrappedJSObject;
        conkeror.handle_command_line(cmdline);
    },
    
    /* nsIFactory */
    
    createInstance : function (outer, iid)
    {
        if (outer != null)
            throw Components.results.NS_ERROR_NO_AGGREGATION;
        return this.QueryInterface(iid);
    },
    
    lockFactory : function (lock) { /* no-op */ }
};


// http://www.xulplanet.com/references/xpcomref/ifaces/nsICommandLine.html
// http://developer.mozilla.org/en/docs/Chrome:_Command_Line
// http://lxr.mozilla.org/mozilla/source/toolkit/components/commandlines/public/nsICommandLineHandler.idl

const clh_contractID = "@mozilla.org/commandlinehandler/general-startup;1?type=conkeror";
const clh_CID = Components.ID('{0f4dd758-b55a-4386-a79c-8698642eac51}');

// category names are sorted alphabetically. Typical command-line handlers use a
// category that begins with the letter "m".
const clh_category = "y-conkeror";

/**
 * The XPCOM glue that implements nsIModule
 */
const conkeror_cmdline_module = {
    /* nsISupports */
    QueryInterface : function (iid)
    {
        if (iid.equals(Components.interfaces.nsIModule) ||
            iid.equals(Components.interfaces.nsISupports))
            return this;
        
        throw Components.results.NS_ERROR_NO_INTERFACE;
    },
    
    /* nsIModule */
    getClassObject : function (compMgr, cid, iid)
    {
        if (cid.equals(clh_CID))
            return conkeror_cmdline.QueryInterface(iid);
        
        throw Components.results.NS_ERROR_NOT_REGISTERED;
    },
    
    registerSelf : function (compMgr, fileSpec, location, type)
    {
        compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
        
        compMgr.registerFactoryLocation(clh_CID,
                                        "conkeror_cmdline",
                                        clh_contractID,
                                        fileSpec,
                                        location,
                                        type);
        
        var catMan = Components.classes["@mozilla.org/categorymanager;1"].
        getService(Components.interfaces.nsICategoryManager);
        catMan.addCategoryEntry("command-line-handler",
                                clh_category,
                                clh_contractID, true, true);
    },
    
    unregisterSelf : function (compMgr, location, type)
    {
        compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
        compMgr.unregisterFactoryLocation(clh_CID, location);
        
        var catMan = Components.classes["@mozilla.org/categorymanager;1"].
        getService(Components.interfaces.nsICategoryManager);
        catMan.deleteCategoryEntry("command-line-handler", clh_category);
    },
    
    canUnload : function (compMgr)
    {
        return true;
    }
};

/* The NSGetModule function is the magic entry point that XPCOM uses to find what XPCOM objects
 * this component provides
 */
function NSGetModule(comMgr, fileSpec)
{
    return conkeror_cmdline_module;
}

