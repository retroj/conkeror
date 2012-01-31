/**
 * (C) Copyright 2007,2010,2012 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

function application () {
    Components.utils.import("resource://gre/modules/XPCOMUtils.jsm", this);

    this.wrappedJSObject = this;
    this.conkeror = this;

    this.load_url = this.subscript_loader.loadSubScript;
    this.loading_urls = [];
    this.loading_paths = [];
    this.loading_features = [];
    this.features = {};
    this.load_paths = [this.module_uri_prefix,
                       this.module_uri_prefix+'extensions',
                       this.module_uri_prefix+'page-modes'];
    this.after_load_functions = {};
    this.pending_loads = [];

    // clear the startup-cache so that modules and the user's rc are
    // loaded from disk, not from a cache.  this problem is a
    // characteristic of using mozIJSSubScriptLoader.loadSubScript as our
    // primary means of loading, since XULRunner 8.0.
    var obs = Cc["@mozilla.org/observer-service;1"]
        .getService(Ci.nsIObserverService);
    obs.notifyObservers(null, "startupcache-invalidate", null);

    try {
        this.require("conkeror.js");
    } catch (e) {
        this.dumpln("Error initializing.");
        this.dump_error(e);
    }
}
application.prototype = {
    constructor: application,
    Cc: Cc,
    Ci: Ci,
    Cr: Cr,
    /* Note: resource://app currently doesn't result in xpcnativewrappers=yes */
    module_uri_prefix: "chrome://conkeror/content/",
    subscript_loader: Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader),
    preferences: Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService),
    get version () {
        var formatter = Cc["@mozilla.org/toolkit/URLFormatterService;1"]
            .getService(Ci.nsIURLFormatter);
        return formatter.formatURL("%VERSION%");
    },
    dumpln: function (str) {
        dump(str);
        dump("\n");
    },
    dump_error: function (e) {
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
    },

    make_uri: function (uri, charset, base_uri) {
        const io_service = Cc["@mozilla.org/network/io-service;1"]
            .getService(Ci.nsIIOService2);
        if (uri instanceof Ci.nsIURI)
            return uri;
        if (uri instanceof Ci.nsIFile)
            return io_service.newFileURI(uri);
        return io_service.newURI(uri, charset, base_uri);
    },
    load: function (module) {
        function load1 (url, path) {
            try {
                this.loading_paths.unshift(path);
                this.loading_urls.unshift(url);
                this.loading_features.unshift({});
                if (this.loading_urls.indexOf(url, 1) != -1)
                    throw new Error("Circular module dependency detected: "+
                                    this.loading_urls.join(",\n"));
                if (url.substr(-4) == ".jsx") {
                    var scopename = url.substr(url.lastIndexOf('/')+1)
                        .replace('-', '_', 'g');
                    var dot = scopename.indexOf(".");
                    if (dot > -1)
                        scopename = scopename.substr(0, dot);
                    var scope = { __proto__: this };
                } else
                    scope = this;
                this.load_url(url, scope);
                if (scopename)
                    this[scopename] = scope;
                var success = true;
                // call-after-load callbacks
                for (let f in this.loading_features[0]) {
                    this.features[f] = true;
                    this.run_after_load_functions(f);
                }
            } finally {
                this.loading_paths.shift();
                this.loading_urls.shift();
                this.loading_features.shift();
            }
            // do pending loads
            if (success && this.loading_urls[0] === undefined) {
                let pending = this.pending_loads;
                this.pending_loads = [];
                for (let i = 0, m; m = pending[i]; ++i) {
                    this.require(m);
                }
            }
        }
        if (module instanceof Ci.nsIURI)
            var path = module.spec.substr(0, module.spec.lastIndexOf('/')+1);
        else if (module instanceof Ci.nsIFile)
            path = module.parent.path;
        if (path !== undefined) {
            var url = this.make_uri(module).spec;
            load1.call(this.conkeror, url, path);
        } else {
            // module name or relative path
            var si = module.lastIndexOf('/');
            var module_leaf = module.substr(si+1);
            var autoext = module_leaf.lastIndexOf(".") <= 0;
            var exts = { 0:"", 1:".js", 2:".jsx", len:3 };
            var exti = 0;
            var i = -1;
            var tried = {};
            path = this.loading_paths[0];
            if (path === undefined)
                path = this.load_paths[++i];
            while (path !== undefined) {
                var truepath = path;
                var sep = path.substr(-1) == '/' ? '' : '/';
                var ext = exts[exti];
                try {
                    url = path + sep + module + ext;
                    if (si > -1)
                        truepath += sep + module.substr(0, si);
                    if (! tried[url]) {
                        tried[url] = true;
                        load1.call(this.conkeror, url, truepath);
                        return;
                    }
                } catch (e if (typeof e == 'string' &&
                               {"ContentLength not available (not a local URL?)":true,
                                "Error creating channel (invalid URL scheme?)":true,
                                "Error opening input stream (invalid filename?)":true}
                               [e])) {
                    // null op. (suppress error, try next path)
                }
                if (autoext)
                    exti = (exti + 1) % exts.len;
                if (exti == 0)
                    path = this.load_paths[++i];
            }
            throw new Error("Module not found ("+module+")");
        }
    },
    provide: function (symbol) {
        if (! symbol)
            throw new Error("Cannot provide null feature");
        if (this.loading_urls[0] === undefined) {
            this.features[symbol] = true;
            this.run_after_load_functions(symbol);
        } else
            this.loading_features[0][symbol] = true;
    },
    featurep: function (symbol) {
        return this.features[symbol] || false;
    },
    call_after_load: function (feature, func) {
        if (this.featurep(feature))
            func();
        else {
            var funcs = this.after_load_functions[feature];
            if (! funcs)
                funcs = this.after_load_functions[feature] = [];
            funcs.push(func);
        }
    },
    run_after_load_functions: function (symbol) {
        var funcs = this.after_load_functions[symbol];
        if (funcs) {
            delete this.after_load_functions[symbol];
            for (var i = 0; funcs[i]; ++i) {
                try {
                    funcs[i]();
                } catch (e) {
                    this.dump_error(e);
                }
            }
        }
    },
    require: function (module) {
        if (module instanceof Ci.nsIURI)
            var feature = module.spec.substr(module.spec.lastIndexOf('/')+1);
        else if (module instanceof Ci.nsIFile)
            feature = module.leafName;
        else
            feature = module.substr(module.lastIndexOf('/')+1);
        var dot = feature.indexOf('.');
        if (dot == 0)
            return false;
        if (dot > 0)
            feature = feature.substr(0, dot);
        feature = feature.replace('_', '-', 'g');
        if (this.featurep(feature))
            return true;
        try {
            // ensure current path is not searched for 'require'
            this.loading_paths.unshift(undefined);
            this.load(module);
        } finally {
            this.loading_paths.shift();
        }
        return true;
    },
    require_later: function (module) {
        this.pending_loads.push(module);
    },

    /* nsISupports */
    QueryInterface: XPCOMUtils.generateQI([]),

    /* XPCOM registration */
    classDescription: "Conkeror global object",
    classID: Components.ID("{72a7eea7-a894-47ec-93a9-a7bc172cf1ac}"),
    contractID: "@conkeror.mozdev.org/application;1"
};

if (XPCOMUtils.generateNSGetFactory)
    var NSGetFactory = XPCOMUtils.generateNSGetFactory([application]); //XULRunner 2.0
else
    var NSGetModule = XPCOMUtils.generateNSGetModule([application]);
