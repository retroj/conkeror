/**
 * (C) Copyright 2008 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

{
    let themes = {};
    let loaded_themes = {};

    define_variable('theme_load_paths', ['chrome://conkeror-gui/skin/'],
                    "List of directories and chrome urls within which themes"+
                    " may be found.");

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
            if (path.substr(0, 7) == 'chrome:') {
                let def = get_contents_synchronously(path+name+'/theme.json');
                if (def === null)
                    continue;
                def = eval('('+def+')');
                loaded_themes[name] = new theme(path+name+'/', def.sheets);
                return loaded_themes[name];
            } else {
                let def = get_contents_synchronously('file:'+path+name+'/theme.json');
                if (def === null)
                    continue;
                def = eval('('+def+')');
                loaded_themes[name] = new theme('file:'+path+name+'/', def.sheets);
                return loaded_themes[name];
            }
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
                if (! loaded(module+".js"))
                    call_after_load(module+".js",
                                    function () { theme_module(module); });
            }
            if (! themes[module][cssfile])
                themes[module][cssfile] = [];
            if (themes[module][cssfile].length > 0)
                themes[module][cssfile][0].unregister(cssfile);
            themes[module][cssfile].unshift(th);
            if (loaded(module+".js"))
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

