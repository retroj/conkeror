

function numbering_helper() {
    this.wrappedJSObject = { next_number : 1, registrations : [] };
}

numbering_helper.prototype = {
    registerItem : function (targetNode, numberNode, type) {
        var doc = targetNode.ownerDocument;
        if (doc != numberNode.ownerDocument)
            throw Components.Exception("ownerDocument values of targetNode and numberNode do not match");

        /* Find the "top" node */
        var top_window = doc.defaultView.top;

        var top_helper = top_window.wrappedJSObject.__conkeror_numbering_helper;
        if (!(top_helper instanceof Components.interfaces.conkerorINumberingHelper))
            throw Components.Exception("top-level __conkeror_numbering_helper not found");

        var data = top_helper.wrappedJSObject;

        var num = data.next_number++;
        data.registrations[num] = { document : doc,
                                    target_node : targetNode,
                                    type : type,
                                    number_node : numberNode };
        return num;
    },

    unregisterItem : function (targetNode, identifier) {
        var doc = targetNode.ownerDocument;

        /* Find the "top" node */
        var top_window = doc.defaultView.top;

        var top_helper = top_window.wrappedJSObject.__conkeror_numbering_helper;
        if (!(top_helper instanceof Components.interfaces.conkerorINumberingHelper))
            throw Components.Exception("top-level __conkeror_numbering_helper not found");

        var data = top_helper.wrappedJSObject;

        var num = parseInt(identifier);
        if (num != identifier || num < 1 || num >= data.registrations.length)
            throw Components.Exception("Invalid identifier");

        if (data.registrations[num].target_node != targetNode)
            throw Components.Exception("targetNode does not match identifier");

        data.registrations[num].target_node = null;
    },

    /* nsISupports */
    QueryInterface: function (aIID) {
        if (! aIID.equals (Components.interfaces.nsISupports)
            && !aIID.equals(Components.interfaces.conkerorINumberingHelper)
            && !aIID.equals(Components.interfaces.nsISecurityCheckedComponent))
            throw Components.results.NS_ERROR_NO_INTERFACE;
        return this;
    },

    /* nsISecurityCheckedComponent */
    canCreateWrapper : function(aIID)
    {
        if (aIID.equals(Components.interfaces.conkerorINumberingHelper)
            || aIID.equals(Components.interfaces.nsISupports))
            return "AllAccess";
        return "NoAccess";
    },

    canCallMethod : function (aIID, methodName)
    {
        if ((aIID.equals(Components.interfaces.conkerorINumberingHelper)
             || aIID.equals(Components.interfaces.nsISupports))
            && (methodName == "registerItem"
                || methodName == "unregisterItem"
                || methodName == "QueryInterface"))
            return "AllAccess";
        return "NoAccess";
    },

    canGetProperty : function (aIID, propertyName)
    {
        return "NoAccess";
    },

    canSetProperty : function (aIID, propertyName)
    {
        return "NoAccess";
    },
};

///
/// Factory
///

var factory = {
createInstance: function (aOuter, aIID) {
        if (aOuter != null)
            throw Components.results.NS_ERROR_NO_AGGREGATION;
        return (new numbering_helper ()).QueryInterface (aIID);
    }
};


///
/// Module
///

const CLASS_ID = Components.ID('{406D82F0-85DA-11DC-9C37-4ACA56D89593}');
const CLASS_NAME = "numbering_helper";
const CONTRACT_ID = "@conkeror.mozdev.org/numbering_helper;1";

var module = {
_firstTime: true,
registerSelf: function(aCompMgr, aFileSpec, aLocation, aType)
{
    if (this._firstTime) {
        this._firstTime = false;
        throw Components.results.NS_ERROR_FACTORY_REGISTER_AGAIN;
    };
    aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    aCompMgr.registerFactoryLocation(CLASS_ID, CLASS_NAME, CONTRACT_ID, aFileSpec, aLocation, aType);

    var catman = Components.classes["@mozilla.org/categorymanager;1"]
    .getService(Components.interfaces.nsICategoryManager);

    catman.addCategoryEntry("JavaScript global property",
                            "__conkeror_numbering_helper",
                            CONTRACT_ID,
                            true,  /* Persist this entry */
                            true); /* Replace existing entry */
},

unregisterSelf: function(aCompMgr, aLocation, aType)
{
    aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    aCompMgr.unregisterFactoryLocation(CLASS_ID, aLocation);
},

getClassObject: function(aCompMgr, aCID, aIID)
{
    if (!aIID.equals(Components.interfaces.nsIFactory))
        throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

    if (aCID.equals(CLASS_ID))
        return factory;

    throw Components.results.NS_ERROR_NO_INTERFACE;
},

canUnload: function(aCompMgr) { return true; }
};

function NSGetModule(comMgr, fileSpec)
{
    return module;
}
