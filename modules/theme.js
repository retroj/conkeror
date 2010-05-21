/**
 * (C) Copyright 2008 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

{
    let themes = {};
    let loaded_themes = {};

    define_variable('theme_load_paths', ['chrome://conkeror-gui/skin/'],
                    "List of directories and chrome urls within which themes "+
                    "may be found.  The items can be represented as strings, "+
                    "nsIURI's, or nsIFile's. Chrome urls must be given as "+
                    "strings.");

    function theme_cssfile_module (cssfile) {
        cssfile = cssfile.substring(0, cssfile.indexOf('.'));
        var sep = cssfile.indexOf('--');
        if (sep == -1)
            return cssfile;
        else
            return cssfile.substring(0, sep);
    }

    function theme (location, sheets) {
        this.location = location;
        this.sheets = sheets;
    }
    theme.prototype = {
        constructor: theme,
        register: function (cssfile) {
            register_agent_stylesheet(this.location+cssfile);
        },
        unregister: function (cssfile) {
            unregister_agent_stylesheet(this.location+cssfile);
        },
        registered_p: function (cssfile) {
            return agent_stylesheet_registered_p(this.location+cssfile);
        }
    };

    function theme_find (name) {
        if (loaded_themes[name])
            return loaded_themes[name];
        for each (var path in theme_load_paths) {
            var url;
            if (path instanceof Ci.nsIURI) {
                url = path.spec;
            } else if (path instanceof Ci.nsIFile) {
                url = make_uri(path).spec;
            } else if (typeof(path) == "string") {
                if (path.substr(0, 7) == 'chrome:')
                    url = path;
                else
                    url = make_uri(make_file(path)).spec;
            }
            if (url.substr(-1) != '/')
                url += '/';
            url += name + '/';
            let def = get_contents_synchronously(url+'theme.json');
            if (def === null)
                continue;
            def = eval('('+def+')');
            loaded_themes[name] = new theme(url, def.sheets);
            return loaded_themes[name];
        }
        return null;
    }

    function theme_load (name) {
        var th = theme_find(name);
        if (! th) throw new Error("theme "+name+" not found.");
        for each (var cssfile in th.sheets) {
            let module = theme_cssfile_module(cssfile);
            if (! themes[module]) {
                themes[module] = {};
                if (! featurep(module))
                    call_after_load(module,
                                    function () { theme_module(module); });
            }
            if (! themes[module][cssfile])
                themes[module][cssfile] = [];
            if (themes[module][cssfile].length > 0)
                themes[module][cssfile][0].unregister(cssfile);
            themes[module][cssfile].unshift(th);
            if (featurep(module))
                th.register(cssfile);
        }
    }

    function theme_unload (name) {
        var th = theme_find(name);
        for each (var cssfile in th.sheets) {
            let module = theme_cssfile_module(cssfile);
            themes[module][cssfile] =
                themes[module][cssfile].filter(function (x) { return x !== th; });
            if (th.registered_p(cssfile)) {
                th.unregister(cssfile);
                if (themes[module][cssfile].length > 0)
                    themes[module][cssfile][0].register(cssfile);
            }
        }
        delete loaded_themes[name];
    }

    function theme_module (module) {
        for (var cssfile in themes[module]) {
            if (themes[module][cssfile].length > 0)
                themes[module][cssfile][0].register(cssfile);
        }
    }
}

theme_load("default");

provide("theme");
