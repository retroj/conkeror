

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
        dump ('error loading '+chrome_uri_s+"\n    "+e+"\n");
    }
}




function application () {
    this.wrappedJSObject = this;
    this.window_watcher = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
        .getService(Components.interfaces.nsIWindowWatcher);
    var conkeror = this;
    conkeror.start_time = Date.now ();
    conkeror.url_remoting_fn = conkeror.make_frame;

    conkeror.preferences = Components.classes["@mozilla.org/preferences-service;1"]
        .getService (Components.interfaces.nsIPrefBranch);

    eval.call (this, get_chrome_contents ("chrome://conkeror/content/debug.js"));
    eval.call (this, get_chrome_contents ("chrome://conkeror/content/localfile.js"));
    eval.call (this, get_chrome_contents ("chrome://conkeror/content/utils.js"));
    eval.call (this, get_chrome_contents ("chrome://conkeror/content/keyboard.js"));
    eval.call (this, get_chrome_contents ("chrome://conkeror/content/interactive.js"));
    eval.call (this, get_chrome_contents ("chrome://conkeror/content/daemon-mode.js"));
    eval.call (this, get_chrome_contents ("chrome://conkeror/content/save.js"));

    eval.call (this, get_chrome_contents ("chrome://conkeror/content/commands.js")); // depends: interactive.js
    eval.call (this, get_chrome_contents ("chrome://conkeror/content/minibuffer.js")); // depends: interactive.js

    eval.call (this, get_chrome_contents ("chrome://conkeror/content/bindings.js")); // depends: keyboard.js

    // FIXME: This is commented out because it currently does nothing except print numbering_resize messages
    //eval.call (this, get_chrome_contents ("chrome://conkeror/content/numbering.js"));
    eval.call (this, get_chrome_contents ("chrome://conkeror/content/find.js"));
    eval.call (this, get_chrome_contents ("chrome://conkeror/content/numberedlinks.js"));

    conkeror.set_default_directory ();

    conkeror.init_webjumps ();

    conkeror.init_window_title ();

    // Register numbering stylesheet
    {
      var sss = Components.classes["@mozilla.org/content/style-sheet-service;1"]
        .getService(Components.interfaces.nsIStyleSheetService);
      var ios = Components.classes["@mozilla.org/network/io-service;1"]
        .getService(Components.interfaces.nsIIOService);
      var uri = ios.newURI("chrome://conkeror/content/numbering.css", null, null);
      sss.loadAndRegisterSheet(uri, sss.USER_SHEET);
    }
}

application.prototype = {

version: "$CONKEROR_VERSION$", // preprocessor variable
start_time: null,
window_watcher: null,
preferences: null,
chrome: "chrome://conkeror/content/conkeror.xul",
homepage: "chrome://conkeror/content/help.html",
default_directory: null,
url_remoting_fn: null,
commands: [],
current_command: null,
quit_hook: [],
make_frame_hook: [],
make_frame_after_hook: [],
dom_content_loaded_hook: [],
dom_title_changed_hook: [],
location_changed_hook: [],
progress_changed_hook: [],
status_changed_hook: [],
select_buffer_hook: [],
frame_resize_hook: [],
mode_line_enabled: true,

add_hook: function (hook, func, append)
{
    if (append)
        hook.push (func);
    else
        hook.unshift (func);
},

run_hooks: function (hooks, scope, args)
{
    if (! scope) { scope = this; }
    if (! args) { args = []; }
    for (var i in hooks) {
        try {
            hooks[i].apply (scope, args);
        } catch (e) {
            dump ('run_hooks: '+e+"\n");
        }
    }
},

generate_new_frame_tag: function (tag)
{
    var existing = [];
    var exact_match = false;
    var en = this.window_watcher.getWindowEnumerator ();
    if (tag == '') { tag = null; }
    var re;
    if (tag) {
        re = new RegExp ("^" + tag + "<(\\d+)>$");
    } else {
        re = new RegExp ("^(\\d+)$");
    }
    while (en.hasMoreElements ()) {
        var w = en.getNext().QueryInterface (Components.interfaces.nsIDOMWindow);
        if ('tag' in w)  {
            if (tag && w.tag == tag) {
                exact_match = true;
                continue;
            }
            var re_result = re.exec (w.tag);
            if (re_result)
                existing.push (re_result[1]);
        }
    }
    if (tag && ! exact_match)
        return tag;

    existing.sort (function (a, b) { return a - b; });

    var n = 1;
    for (var i = 0; i < existing.length; i++) {
        if (existing[i] < n) continue;
        if (existing[i] == n) { n++; continue; }
        break;
    }
    if (tag) {
        return tag + "<" + n + ">";
    } else {
        return n;
    }
},

encode_xpcom_structure: function (data)
{
    var ret = null;
    if (typeof data == 'string') {
        ret = Components.classes["@mozilla.org/supports-string;1"]
            .createInstance(Components.interfaces.nsISupportsString);
        ret.data = data;
    } else if (typeof data == 'object') { // should be a check for array.
        ret = Components.classes["@mozilla.org/array;1"]
            .createInstance(Components.interfaces.nsIMutableArray);
        for (var i = 0; i < data.length; i++) {
            ret.appendElement (this.encode_xpcom_structure (data[i]), false);
        }
    } else {
        throw 'make_xpcom_struct was given something other than String or Array';
    }
    return ret;
},

decode_xpcom_structure: function (data)
{
    function dostring (data) {
        try {
            var iface = data.QueryInterface (Components.interfaces.nsISupportsString);
            return iface.data;
        } catch (e) {
            return null;
        }
    }

    var ret = dostring (data);
    if (ret) { return ret; }
    // it's not a string, so we will assume it is an array.
    ret = [];
    var en = data.QueryInterface (Components.interfaces.nsIArray).enumerate ();
    while (en.hasMoreElements ()) {
        ret.push (this.decode_xpcom_structure (en.getNext ()));
    }
    return ret;
},

make_frame: function (url, tag)
{
    var open_args = ['conkeror'];
    if (url) { open_args.push (['find'].concat (url)); }
    if (tag) { open_args.push (['tag', tag]); }
    open_args = this.encode_xpcom_structure (open_args);
    var result = this.window_watcher.openWindow(null,
                                                this.chrome,
                                                null,
                                                "resizable=yes,dialog=no",
                                                open_args);
    this.run_hooks (this.make_frame_hook, result);
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

get_frame_by_tag : function (tag)
{
    var en = this.window_watcher.getWindowEnumerator ();
    while (en.hasMoreElements ()) {
        var w = en.getNext().QueryInterface (Components.interfaces.nsIDOMWindow);
        if ('tag' in w && w.tag == tag)
            return w;
    }
    return null;
},

quit : function ()
{
    this.run_hooks (this.quit_hook);
    // this.daemon_mode (-1);
    var appStartup = Components.classes["@mozilla.org/toolkit/app-startup;1"]
        .getService(Components.interfaces.nsIAppStartup);
    appStartup.quit(appStartup.eAttemptQuit);
},

get_os: function ()
{
    // possible return values: 'Darwin', 'Linux', 'WINNT', ...
    var appinfo = Components.classes['@mozilla.org/xre/app-info;1']
        .createInstance (Components.interfaces.nsIXULRuntime);
    return appinfo.OS;
},

set_default_directory : function (directory_s) {
    function getenv (variable) {
        var env = Components.classes['@mozilla.org/process/environment;1']
            .createInstance (Components.interfaces.nsIEnvironment);
        if (env.exists (variable))
            return env.get(variable);
        return null;
    }

    if (! directory_s)
    {
        directory_s = getenv ('HOME');
    }

    if (! directory_s &&
        this.get_os() == "WINNT")
    {
        directory_s = getenv ('USERPROFILE') ||
            getenv ('HOMEDRIVE') + getenv ('HOMEPATH');
    }
    this.default_directory = Components.classes["@mozilla.org/file/local;1"]
        .createInstance(Components.interfaces.nsILocalFile);
    this.default_directory.initWithPath (directory_s);
},

/*
 * path_s: string path to load.  may be a file, a directory, or null.
 *   if it is a file, that file will be loaded.  if it is a directory,
 *   all `.js' files in that directory will be loaded.  if it is null,
 *   the preference `conkeror.rcfile' will be read for the default.
 */
load_rc : function (path_s)
{
    // make `conkeror' object visible to the scope of the rc.
    var conkeror = this;

    function load_rc_file(file)
    {
        var fd = conkeror.fopen (file, "<");
        var s = fd.read ();
        fd.close ();
        try {
            eval.call (conkeror, s);
        } catch (e) { dump (e + "\n");}
    }

    function load_rc_directory (file_o) {
        var entries = file_o.directoryEntries;
        var files = [];
        while (entries.hasMoreElements ()) {
            var entry = entries.getNext ();
            entry.QueryInterface (Components.interfaces.nsIFile);
            if (entry.leafName.match(/^[^.].*\.js$/i)) {
                files.push(entry);
            }
        }
        files.sort(function (a, b) {
                if (a.leafName < b.leafName) {
                    return -1;
                } else if (a.leafName > b.leafName) {
                    return 1;
                } else {
                    return 0;
                }
            });
        for (var i = 0; i < files.length; i++) {
            load_rc_file(files[i]);
        }
    }

    if (! path_s)
    {
        if (conkeror.preferences.prefHasUserValue ("conkeror.rcfile")) {
            var rcfile = conkeror.preferences.getCharPref("conkeror.rcfile");
            if (rcfile.length)
                path_s = rcfile;
        }
    }

    var file_o = Components.classes["@mozilla.org/file/local;1"]
        .createInstance(Components.interfaces.nsILocalFile);
    file_o.initWithPath(path_s);
    if (file_o.isDirectory()) {
        load_rc_directory (file_o);
    } else {
        load_rc_file (path_s);
    }
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
