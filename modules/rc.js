
function load_rc_file(file)
{
    try {
        var name;
        if (typeof file == "string")
            name = file;
        else
            name = file.path;
            
        subscript_loader.loadSubScript("file://" + name, conkeror);
    } catch (e) {
        dump_error(e);
    }
}

function load_rc_directory (file_o) {
    var entries = file_o.directoryEntries;
    var files = [];
    while (entries.hasMoreElements ()) {
        var entry = entries.getNext ();
        entry.QueryInterface (Ci.nsIFile);
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


/*
 * path_s: string path to load.  may be a file, a directory, or null.
 *   if it is a file, that file will be loaded.  if it is a directory,
 *   all `.js' files in that directory will be loaded.  if it is null,
 *   the preference `conkeror.rcfile' will be read for the default.
 */
function load_rc(path_s)
{
    if (! path_s)
    {
        if (preferences.prefHasUserValue ("conkeror.rcfile")) {
            var rcfile = preferences.getCharPref("conkeror.rcfile");
            if (rcfile.length)
                path_s = rcfile;
        }
    }

    var file_o = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
    file_o.initWithPath(path_s);
    if (file_o.isDirectory()) {
        load_rc_directory (file_o);
    } else {
        load_rc_file (path_s);
    }
}

require_later("command-line.js");

call_after_load("command-line.js", function () {
        command_line_param_handler("l", false, function (path) {
                try {
                    load_rc (path);
                } catch (e) { dump_error(e);  }
            });
    });
