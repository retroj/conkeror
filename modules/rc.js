/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2010 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

let (default_rc = get_home_directory()) {
    default_rc.appendRelativePath(".conkerorrc");
    default_pref("conkeror.rcfile", default_rc.path);
}

function load_rc () {
    var path;
    var rcfile = get_pref("conkeror.rcfile");
    if (rcfile.length == 0)
        //FIXME: log that the rc is disabled
        return;
    path = make_file(rcfile);
    if (! path.exists()) {
        if (path.isSymlink())
            dumpln("w: broken symlink, \""+rcfile+"\"");
        else if (pref_has_user_value("conkeror.rcfile"))
            dumpln("w: preference conkeror.rcfile is set to "+
                   "non-existent path, \""+rcfile+"\"");
        //FIXME: else log that the rc does not exist
        return;
    }
    var files = [];
    var ret;
    if (path.isDirectory()) {
        var entries = path.directoryEntries;
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
        path.appendRelativePath("a");
        ret = path.path.substr(0, path.path.length - 1) + "*.js";
    } else {
        files.push(path);
        ret = path.path;
    }
    for (var i = 0; files[i]; i++) {
        try {
            load(files[i]);
        } catch (e) {
            dump_error(e);
        }
    }
    //FIXME: log what was loaded instead of returning the value to be
    //       logged by the caller.
    return ret;
}

provide("rc");
