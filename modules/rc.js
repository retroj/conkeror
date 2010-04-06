/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2008 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

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
        load(files[i]);
    }
}


function load_rc () {
    var path;
    if (pref_has_user_value("conkeror.rcfile")) {
        let rcfile = get_pref("conkeror.rcfile");
        if (rcfile.length)
            path = make_file(rcfile);
        else
            //FIXME: log that the rc is disabled
            return;
    } else {
        path = get_home_directory();
        path.appendRelativePath(".conkerorrc");
        if (! path.exists())
            //FIXME: log that ~/.conkerorrc does not exist
            return;
    }

    if (path.isDirectory())
        load_rc_directory(path);
    else
        load(path);

    //FIXME: log the load instead of returning a value to be logged by the
    //       caller.
    if (path.isDirectory())
        return path.path + "/*.js";
    else
        return path.path;
}

provide("rc");
