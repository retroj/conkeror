/**
 * (C) Copyright 2007,2010 John J. Foerch
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
    this.loading_modules = [];
    this.loading_features = [];
    this.features = {};
    this.load_paths = [this.module_uri_prefix,
                       this.module_uri_prefix+'extensions',
                       this.module_uri_prefix+'page-modes'];
    this.after_load_functions = {};
    this.pending_loads = [];

    this.module_assert_conflict_error.prototype = Error.prototype;

    try {
        this.require("conkeror.js", null);
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
    skip_module_load: {},
    load: function (module, as) {
        var conkeror = this;
        function module_scope () {
            this.__proto__ = conkeror;
            this.conkeror = conkeror;
        }
        function load1 (url, scope, path, as) {
            var success;
            try {
                this.loading_paths.unshift(path);
                this.loading_urls.unshift(url);
                this.loading_modules.unshift(as);
                this.loading_features.unshift({});
                if (this.loading_urls.indexOf(url, 1) != -1)
                    throw new Error("Circular module dependency detected: "+
                                    this.loading_urls.join(",\n"));
                this.load_url(url, scope);
                success = true;
                if (as)
                    this[as] = scope;
                // call-after-load callbacks
                for (let f in this.loading_features[0]) {
                    this.features[f] = true;
                    this.run_after_load_functions(f);
                }
            } finally {
                this.loading_paths.shift();
                this.loading_urls.shift();
                this.loading_modules.shift();
                this.loading_features.shift();
            }
            // do pending loads
            if (success && this.loading_urls[0] === undefined) {
                let pending = this.pending_loads;
                this.pending_loads = [];
                for (let i = 0, m; m = pending[i]; ++i) {
                    this.require(m[0], m[1]);
                }
            }
        }
        var scope = as;
        if (as == null)
            scope = this;
        else if (typeof as == 'string')
            scope = new module_scope();
        else
            as = null;
        var path, url;
        if (module instanceof Ci.nsIURI)
            path = module.path.substr(0, module.path.lastIndexOf('/')+1);
        else if (module instanceof Ci.nsIFile)
            path = module.parent.path;
        var restarted = false;
        if (path !== undefined) {
            url = this.make_uri(module).spec;
            do {
                try {
                    load1.call(this, url, scope, path, as);
                    return;
                } catch (e if e instanceof this.module_assert_error) {
                    if (restarted)
                        throw new this.module_assert_conflict_error(url);
                    as = e.module;
                    if (e.module)
                        scope = new module_scope();
                    else
                        scope = this;
                    restarted = true;
                } catch (e if e == this.skip_module_load) {
                    return;
                }
            } while (restarted);
        } else {
            // module name or relative path
            var autoext = module.substr(-3) != '.js';
            var suffix = false;
            var i = -1;
            var tried = {};
            path = this.loading_paths[0];
            if (path === undefined)
                path = this.load_paths[++i];
            while (path !== undefined) {
                let opath = path;
                try {
                    let sep = path[path.length-1] == '/' ? '' : '/';
                    url = path + sep + module + (suffix ? '.js' : '');
                    let si = module.lastIndexOf('/');
                    if (si > -1)
                        path += module.substr(0, si);
                    if (! tried[url] || tried[url] !== scope) {
                        tried[url] = scope;
                        load1.call(this, url, scope, path, as);
                        return;
                    }
                } catch (e if e instanceof this.module_assert_error) {
                    if (restarted)
                        throw new this.module_assert_conflict_error(url);
                    as = e.module;
                    if (e.module)
                        scope = new module_scope();
                    else
                        scope = this;
                    path = opath;
                    restarted = true;
                    continue;
                } catch (e if (typeof e == 'string' &&
                               {"ContentLength not available (not a local URL?)":true,
                                "Error creating channel (invalid URL scheme?)":true,
                                "Error opening input stream (invalid filename?)":true}
                               [e])) {
                    // null op. (suppress error, try next path)
                } catch (e if e == this.skip_module_load) {
                    return;
                }
                if (autoext)
                    suffix = !suffix;
                if (! suffix)
                    path = this.load_paths[++i];
            }
            throw new Error("Module not found");
        }
    },
    module_assert_error: function (module) {
        this.module = module;
    },
    module_assert_conflict_error: function (url) { //subclass of Error
        this.name = "module_assert_conflict_error";
        this.message = "Conflicting in_module calls";
        this.fileName = url;
        this.lineNumber = '';
    },
    in_module: function (module) {
        if (module != this.loading_modules[0])
            throw new this.module_assert_error(module);
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
                    dump_error(e);
                }
            }
        }
    },
    require: function (module, as) {
        var feature = as;
        if (! feature) {
            if (module instanceof Ci.nsIURI)
                feature = module.spec.substr(module.spec.lastIndexOf('/')+1);
            else if (module instanceof Ci.nsIFile)
                feature = module.leafName;
            else
                feature = module.substr(module.lastIndexOf('/')+1);
            let dot = feature.indexOf('.');
            if (dot == 0)
                return false;
            if (dot > 0)
                feature = feature.substr(0, dot);
            feature = feature.replace('_', '-', 'g');
        }
        if (this.featurep(feature))
            return true;
        if (as === undefined)
            as = feature.replace('-', '_', 'g');
        try {
            // ensure current path is not searched for 'require'
            this.loading_paths.unshift(undefined);
            this.load(module, as);
        } finally {
            this.loading_paths.shift();
        }
        return true;
    },
    require_later: function (module, as) {
        this.pending_loads.push([module, as]);
    },

    /* nsISupports */
    QueryInterface: XPCOMUtils.generateQI([]),

    /* XPCOM registration */
    classDescription: "Conkeror global object",
    classID: Components.ID("{72a7eea7-a894-47ec-93a9-a7bc172cf1ac}"),
    contractID: "@conkeror.mozdev.org/application;1"
};

function NSGetModule (compMgr, fileSpec) {
    return XPCOMUtils.generateModule([application]);
}
