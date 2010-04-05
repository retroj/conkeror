/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2008 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

function load_rc_file (file) {
    try {
        var prefix = "file://";
        var uri;
        if (typeof file == "string")
            uri = prefix + file;
        else if (file instanceof Ci.nsIURI)
            uri = file.spec;
        else
            uri = prefix + file.path;
        subscript_loader.loadSubScript(uri, conkeror);
    } catch (e) {
        dump_error(e);
    }
}

function load_rc_directory (file_o) {
    var entries = file_o.directoryEntries;
    var files = [];
    while (entries.hasMoreElements()) {
        var entry = entries.getNext();
        entry.QueryInterface(Ci.nsIFile);
        if (entry.leafName.substr(-3).toLowerCase() == '.js')
            files.push(entry);
    }
    files.sort(function (a, b) {
            if (a.leafName < b.leafName)
                return -1;
            else if (a.leafName > b.leafName)
                return 1;
            else
                return 0;
        });
    for (var i = 0; files[i]; i++) {
        load_rc_file(files[i]);
    }
}


/*
 * The file to load may be specified as an nsILocalFile, an nsIURI or
 *   a string uri or file path or null.  If path specifies a directory
 *   all `.js' files in that directory will be loaded.  The default,
 *   for a null path, is specified by the preference `conkeror.rcfile'
 *   if it is set, otherwise it is $HOME/.conkerorrc.  A uri that is
 *   not of file or chrome scheme will fail.
 */
function load_rc (path, resolve) {
    var file;

    if (typeof path == "object")
        file = path;
    else if (typeof path == "string") {
        try {
            file = make_uri(path);
        } catch (e) {
            if (resolve)
                file = resolve(path);
        }
    }
    if (file instanceof Ci.nsIURI && file.schemeIs("chrome"))
        try {
            file = make_file_from_chrome(file);
        } catch (e) { /* ignore */ }
    if (file instanceof Ci.nsIURI && file.schemeIs("file"))
        file = make_file(file.path);

    if (!path) {
        if (pref_has_user_value("conkeror.rcfile")) {
            var rcfile = get_pref("conkeror.rcfile");
            if (rcfile.length)
                path = rcfile;
            else
                return;
        } else {
            file = get_home_directory();
            file.appendRelativePath(".conkerorrc");
            if (!file.exists())
                return;
        }
    }

    if (!file)
        file = make_file(path);

    if (file instanceof Ci.nsILocalFile) {
        path = file.path;
        if (!file.exists())
            throw interactive_error("File not found: " + path);
    }
    if (file instanceof Ci.nsIURI)
        path = file.spec;

    if (file instanceof Ci.nsILocalFile && file.isDirectory()) {
        path += "/*.js";
        load_rc_directory(file);
    } else
        load_rc_file(file);

    return path;
}

provide("rc");
