/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 * (C) Copyright 2008 Nelson Elhage
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

require("io.js");
require("minibuffer-completion.js");


function file_path_completer () {
    return function (input, pos, conservative) {
        var f = Cc["@mozilla.org/file/local;1"]
            .createInstance(Ci.nsILocalFile);
        var ents = [];
        var dir;
        try {
            f.initWithPath(input);
            if(f.exists() && f.isDirectory())
                dir = f;
            else
                dir = f.parent;
            if (!dir.exists())
                return null;
            var iter = dir.directoryEntries;
            while (iter.hasMoreElements()) {
                var e = iter.getNext().QueryInterface(Ci.nsIFile);
                ents.push(e.path);
            }
        } catch(e) {
            return null;
        }
        function id (x) { return x; };
        return prefix_completer($completions = ents,
                                $get_string  = id,
                                $get_description = id,
                                $get_value = id)(input, pos, conservative);
    };
}


/* keywords: $prompt, $initial_value, $history, $completer, $auto_complete */
minibuffer.prototype.read_file_path = function () {
    keywords(arguments, $prompt = "File:", $initial_value = cwd.path,
             $history = "file");
    var result = yield this.read(
        $prompt = arguments.$prompt,
        $initial_value = arguments.$initial_value,
        $history = arguments.$history,
        $completer = file_path_completer(),
        $auto_complete = true);
    yield co_return(result);
};

minibuffer.prototype.read_file = function () {
    var result = yield this.read_file_path(forward_keywords(arguments));
    yield co_return(make_file(result));
};

// FIXME
minibuffer.prototype.read_existing_file = minibuffer.prototype.read_file;
minibuffer.prototype.read_directory_path = minibuffer.prototype.read_file_path;
minibuffer.prototype.read_existing_directory_path = minibuffer.prototype.read_directory_path;

minibuffer.prototype.read_file_check_overwrite = function () {
    keywords(arguments);
    var initial_value = arguments.$initial_value;
    do {
        var path = yield this.read_file_path(forward_keywords(arguments),
                                             $initial_value = initial_value);
        var file = make_file(path);
        if (file.exists()) {
            var overwrite = yield this.read_yes_or_no($prompt = "Overwrite existing file " + path + "?");
            if (!overwrite) {
                initial_value = path;
                continue;
            }
        }
        yield co_return(file);
    } while (true);
};

provide("minibuffer-read-file");
