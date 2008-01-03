const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;

function application () {
    this.wrappedJSObject = this;
    this.conkeror = this;
    var conkeror = this;
    this.Cc = Cc;
    this.Ci = Ci;
    this.Cr = Cr;
    this.module_uri_prefix = "chrome://conkeror-modules/content/";
    this.subscript_loader = Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader);
    this.preferences = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);
    this.loaded_modules = [];
    this.loading_modules = [];
    this.module_after_load_functions = new Object();
    this.pending_loads = [];
    this.dump_error = function (e) {
        if (e instanceof Error) {
            this.dumpln(e.name + ": " + e.message);
            this.dumpln(e.fileName + ":" + e.lineNumber);
            dump(e.stack);
        } else if (e instanceof Ci.nsIException) {
            this.dumpln(e.name + ": " + e.message);
            var stack_frame = e.location;
            while (stack_frame) {
                this.dumpln(stack_frame.name + "()@" + stack_frame.filename + ":" + stack_frame.lineNumber);
                stack_frame = stack_frame.caller;
            }
        } else {
            this.dumpln("Error: " + e);
        }
    }
    this.loaded = function (module) {
        return (this.loaded_modules.indexOf(module) != -1);
    }
    this.provide = function(module) {
        if (this.loaded_modules.indexOf(module) == -1)
            this.loaded_modules.push(module);
    }
    this.load_module = function(module_name) {
        if (this.loading_modules.indexOf(module_name) != -1)
            throw new Error("Circular module dependency detected: "
                            + this.loading_modules.join(" -> ") + " -> " + module_name);
        this.loading_modules.push(module_name);
        try {
            this.subscript_loader.loadSubScript(this.module_uri_prefix + module_name,
                                                this);
        } catch (e) {
            if (!(e instanceof Error) &&
                String(e) == "ContentLength not available (not a local URL?)")
                throw new Error("Module not found: " + module_name);
            throw e;
        } finally {
            this.loading_modules.pop();
        }
        this.provide(module_name);
        var funcs;
        if ((funcs = this.module_after_load_functions[module_name]) != null)
        {
            for (var i = 0; i < funcs.length; ++i)
                funcs[i]();
            delete this.module_after_load_functions[module_name];
        }
        if (this.loading_modules.length == 0)
        {
            while (this.pending_loads.length > 0)
            {
                this.require(this.pending_loads.pop());
            }
        }
    }
    this.require = function (module) {
        if (!this.loaded(module))
            this.load_module(module);
    }
    this.require_later = function (module) {
        if (!this.loaded(module)
            && this.pending_loads.indexOf(module) == -1)
            this.pending_loads.push(module);
    }
    this.call_after_load = function (module, func) {
        if (this.loaded(module))
            func();
        else
        {
            var funcs;
            if (!(funcs = this.module_after_load_functions[module]))
                funcs = this.module_after_load_functions[module] = [];
            funcs.push(func);
        }
    }
    this.dumpln = function (line) {
        dump(line + "\n");
    }

    try {
        this.require("conkeror.js");
    } catch (e) {
        this.dumpln("Error initializing.");
        this.dump_error(e);
    }

}

application.prototype = {

version: "$CONKEROR_VERSION$", // preprocessor variable
homepage: "chrome://conkeror/content/help.html",

// nsISupports
QueryInterface: function (aIID) {
        if (! aIID.equals (Ci.nsISupports))
            throw Cr.NS_ERROR_NO_INTERFACE;
        return this;
    }
};


///
/// Factory
///

var application_factory = {
    createInstance: function (aOuter, aIID) {
        if (aOuter != null)
            throw Cr.NS_ERROR_NO_AGGREGATION;
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

    _firstTime : true,

    registerSelf: function(aCompMgr, aFileSpec, aLocation, aType)
    {
        if (this._firstTime) {
            this._firstTime = false;
            throw Cr.NS_ERROR_FACTORY_REGISTER_AGAIN;
        };
        aCompMgr = aCompMgr.QueryInterface(Ci.nsIComponentRegistrar);
        aCompMgr.registerFactoryLocation(CLASS_ID, CLASS_NAME, CONTRACT_ID, aFileSpec, aLocation, aType);
    },

    unregisterSelf: function(aCompMgr, aLocation, aType)
    {
        aCompMgr = aCompMgr.QueryInterface(Ci.nsIComponentRegistrar);
        aCompMgr.unregisterFactoryLocation(CLASS_ID, aLocation);
    },

    getClassObject: function(aCompMgr, aCID, aIID)
    {
        if (!aIID.equals(Ci.nsIFactory))
            throw Cr.NS_ERROR_NOT_IMPLEMENTED;

        if (aCID.equals(CLASS_ID))
            return application_factory;

        throw Cr.NS_ERROR_NO_INTERFACE;
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
