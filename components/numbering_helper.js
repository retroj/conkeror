
/* This scheme may well be a security hole.  It might be necessary to
   create a proper interface definition. */

function numbering_helper() {
  this.wrappedJSObject = this;
}

numbering_helper.prototype = {
 register_item : function (content_win, doc, node, item_type, num_node) {
    if (!(content_win instanceof Components.interfaces.nsISupports))
      return null;
    
    var safeArg = XPCNativeWrapper(content_win);
    var rootWindow = safeArg.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
    .getInterface(Components.interfaces.nsIWebNavigation)
    .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
    .rootTreeItem
    .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
    .getInterface(Components.interfaces.nsIDOMWindow).wrappedJSObject;

    /* Loop through each buffer of this root window */
    var buffers = rootWindow.getBrowser().mBrowserContainer.childNodes;
    var correctBuffer = null;
    for (var i = 0; i < buffers.length; ++i)
    {
      var buffer = buffers.item(0).firstChild;
      if (buffer.contentWindow == content_win)
      {
        correctBuffer = buffer;
        break;
      }
    }

    if (!correctBuffer)
      return null;

    /* Careful: This might be a security hole */
    if (!correctBuffer.contentWindow.wrappedJSObject.__conkeror_numbering_data)
      correctBuffer.contentWindow.wrappedJSObject.__conkeror_numbering_data = { next_num : 1, arr : new Array () };

    var numInfo = correctBuffer.contentWindow.wrappedJSObject.__conkeror_numbering_data;
    var num = numInfo.next_num++;
    numInfo.arr[num] = { doc : doc,
                         node : node,
                         el_type : item_type,
                         num_node : num_node };

    return num;
  },

 unregister_item : function (content_win, num) {
    if (!(content_win instanceof Components.interfaces.nsISupports))
      return;
    
    var safeArg = XPCNativeWrapper(content_win);
    var rootWindow = safeArg.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
    .getInterface(Components.interfaces.nsIWebNavigation)
    .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
    .rootTreeItem
    .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
    .getInterface(Components.interfaces.nsIDOMWindow).wrappedJSObject;

    /* Loop through each buffer of this root window */
    var buffers = rootWindow.getBrowser().mBrowserContainer.childNodes;
    var correctBuffer = null;
    for (var i = 0; i < buffers.length; ++i)
    {
      var buffer = buffers.item(0).firstChild;
      if (buffer.contentWindow == content_win)
      {
        correctBuffer = buffer;
        break;
      }
    }

    if (!correctBuffer)
      return;

    /* Careful: This might be a security hole. */
    var numInfo = correctBuffer.contentWindow.wrappedJSObject.__conkeror_numbering_data;
    var num = parseInt(num);
    if (numInfo && num && num > 0 && num < numInfo.arr.length)
      numInfo.arr[num] = null;
  },


// nsISupports
 QueryInterface: function (aIID) {
    if (! aIID.equals (Components.interfaces.nsISupports)
        && !aIID.equals(Components.interfaces.nsIClassInfo))
      throw Components.results.NS_ERROR_NO_INTERFACE;
    return this;
  },
 
 getHelperForLanguage : function (count) { return null; },

// property of nsIClassInfo
 flags : Components.interfaces.nsIClassInfo.DOM_OBJECT,

// property of nsIClassInfo
 classDescription : "numbering_helper",

// method of nsIClassInfo
 getInterfaces : function(count) {
    var interfaceList = [Components.interfaces.nsIClassInfo];
    count.value = interfaceList.length;
    return interfaceList;
  }
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
