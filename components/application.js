

function get_chrome_contents (chrome_uri_s) {
    try {
        var op = Components.classes["@mozilla.org/network/io-service;1"]
            .getService(Components.interfaces.nsIIOService) 
            .newChannel(chrome_uri_s, null, null)
            .open();
        var inputStream = Components.classes["@mozilla.org/scriptableinputstream;1"]
            .createInstance(Components.interfaces.nsIScriptableInputStream);
        inputStream.init (op);
        var buf = "";
        var len = null;
        do {
            len = inputStream.available(); // throws if not available
            buf += inputStream.read (len);
        } while (len != 0);
        inputStream.close();
        return buf;
    } catch (e) {
        inputStream.close();
        dumpln ('error loading '+chrome_uri_s+"\n    "+e);
    }
}




// http://kb.mozillazine.org/Implementing_XPCOM_components_in_JavaScript

function application () {
    this.wrappedJSObject = this;
    this.window_watcher = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
        .getService(Components.interfaces.nsIWindowWatcher);
    var conkeror = this;
    conkeror.url_remoting_fn = conkeror.make_frame;
    eval (get_chrome_contents ("chrome://conkeror/content/daemon-mode.js"));
}

application.prototype = {

window_watcher: null,
chrome: "chrome://conkeror/content/conkeror.xul",
homepage: "chrome://conkeror/content/help.html",
url_remoting_fn: null,

run_hooks: function (hooks)
{
    for (var i in hooks) {
        hooks[i]();
    }
},

generate_new_frame_name: function (name)
{
    if (name && ! this.window_watcher.getWindowByName (name, null)) {
        return name;
    }
    var pre = name ? name + '<' : '';
    var post = name ? '>' : '';
    var n = 0;
    do {
        name = pre + n + post;
        n++;
    } while (this.window_watcher.getWindowByName (name, null));
    return name;
},

make_frame: function (url, name)
{
    var open_args = Components.classes["@mozilla.org/supports-string;1"]
        .createInstance(Components.interfaces.nsISupportsString);
    open_args.data = url;

    name = this.generate_new_frame_name (name);

    var result = this.window_watcher.openWindow(null,
                                                this.chrome,
                                                name,
                                                "resizable=yes,dialog=no",
                                                open_args);
    return result;
},
find_url_new_buffer: function (url)
{
    // get the active frame, and create a new buffer in it.  if there is not
    // one, make a frame.
    if (this.window_watcher.activeWindow) {
        return this.window_watcher.activeWindow.getBrowser().newBrowser(url);
    } else {
        return this.make_frame (url);
    }
},
get_frame_by_name : function (name)
{
    return this.window_watcher.getWindowByName (name, null);
},
show_extension_manager : function ()
{
    return this.window_watcher.openWindow(null,
                                          "chrome://mozapps/content/extensions/extensions.xul?type=extensions",
                                          "ExtensionsWindow",
                                          "resizable=yes,dialog=no",
                                          null);
},

quit_hook: [],
quit : function ()
{
    this.run_hooks (this.quit_hook);
    // this.daemon_mode (-1);
    var appStartup = Components.classes["@mozilla.org/toolkit/app-startup;1"]
        .getService(Components.interfaces.nsIAppStartup);
    appStartup.quit(appStartup.eAttemptQuit);
},

// nsISupports
QueryInterface: function (aIID) {
        if (! aIID.equals (Components.interfaces.nsISupports))
            throw Components.results.NS_ERROR_NO_INTERFACE;
        return this;
    }
};


///
/// Factory
///

var application_factory = {
createInstance: function (aOuter, aIID) {
        if (aOuter != null)
            throw Components.results.NS_ERROR_NO_AGGREGATION;
        return (new application ()).QueryInterface (aIID);
    }
};


///
/// Module
///

const CLASS_ID = Components.ID('{72a7eea7-a894-47ec-93a9-a7bc172cf1ac}');
const CLASS_NAME = "application";
const CONTRACT_ID = "@conkeror.mozdev.org/application;1";

var application_module = {
_firstTime: true,
registerSelf: function(aCompMgr, aFileSpec, aLocation, aType)
{
    if (this._firstTime) {
        this._firstTime = false;
        throw Components.results.NS_ERROR_FACTORY_REGISTER_AGAIN;
    };
    aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    aCompMgr.registerFactoryLocation(CLASS_ID, CLASS_NAME, CONTRACT_ID, aFileSpec, aLocation, aType);
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
        return application_factory;

    throw Components.results.NS_ERROR_NO_INTERFACE;
},

canUnload: function(aCompMgr) { return true; }
};

/* The NSGetModule function is the magic entry point that XPCOM uses to find what XPCOM objects
 * this component provides
 */
function NSGetModule(comMgr, fileSpec)
{
  return application_module;
}
