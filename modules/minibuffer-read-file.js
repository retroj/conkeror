/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 * (C) Copyright 2008 Nelson Elhage
 * (C) Copyright 2012-2013 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("io.js");
require("completers.js");


function directory_p (file) {
    return file.exists() && file.isDirectory();
}

function separator_p (s) {
    return s == "/" || (WINDOWS && s == "\\");
}


function file_path_completions (completer, data, suffix) {
    completions.call(this, completer, data);
    this.suffix = suffix;
}
file_path_completions.prototype = {
    constructor: file_path_completions,
    __proto__: completions.prototype,
    toString: function () "#<file_path_completions>",
    suffix: null,
    get_string: function (i) this.data[i].path,
    get_input_state: function (i) {
        var s = this.get_string(i);
        if (this.data[i].isDirectory() &&
            (this.suffix == "" ||
             ! separator_p(this.suffix[0])))
        {
            s += "/";
        }
        var sel = s.length;
        return [s + this.suffix, sel, sel];
    }
};


define_keywords("$test");
function file_path_completer () {
    keywords(arguments, $test = constantly(true));
    completer.call(this);
    this.test = arguments.$test;
}
file_path_completer.prototype = {
    constructor: file_path_completer,
    __proto__: completer.prototype,
    toString: function () "#<file_path_completer>",
    test: null,
    complete: function (input, pos) {
        var s = input.substring(0, pos);
        var suffix = input.substring(pos);
        var ents = [];
        try {
            var f = make_file(s);
            if (directory_p(f)) {
                var dir = f;
                var leaf = "";
            } else {
                dir = f.parent;
                leaf = f.leafName;
            }
            var ll = leaf.length;
            if (! dir.exists())
                return null;
            var iter = dir.directoryEntries;
            while (iter.hasMoreElements()) {
                var e = iter.getNext().QueryInterface(Ci.nsIFile);
                if (e.leafName.substr(0, ll) == leaf &&
                    this.test(e))
                {
                    ents.push(e);
                }
            }
        } catch (e) {
            return null;
        }
        return new file_path_completions(this, ents, suffix);
    }
};


/* keywords: $prompt, $initial_value, $history, $completer, $auto_complete */
minibuffer.prototype.read_file_path = function () {
    keywords(arguments,
             $prompt = "File:",
             $initial_value = cwd.path,
             $history = "file",
             $completer = null);
    var result = yield this.read(
        $prompt = arguments.$prompt,
        $initial_value = arguments.$initial_value,
        $history = arguments.$history,
        $completer = arguments.$completer || new file_path_completer(),
        $auto_complete);
    yield co_return(result);
};

minibuffer.prototype.read_file = function () {
    var result = yield this.read_file_path(forward_keywords(arguments));
    yield co_return(make_file(result));
};

minibuffer.prototype.read_existing_file = function () {
    var result = yield this.read_file_path(
        forward_keywords(arguments),
        $require_match);
    yield co_return(result);
};

minibuffer.prototype.read_directory_path = function () {
    function validator (x) {
        try {
            return directory_p(make_file(x));
        } catch (e) {
            return false;
        }
    }
    var result = yield this.read_file_path(
        forward_keywords(arguments),
        $completer = new file_path_completer($test = directory_p),
        $validator = validator); //XXX: check if this works.  it's okay if
                                 //the result doesn't exist, but not okay
                                 //if it exists but is not a directory.
    yield co_return(result);
};

minibuffer.prototype.read_existing_directory_path = function () {
    var result = yield this.read_directory_path(
        forward_keywords(arguments),
        $require_match);
    yield co_return(result);
};

minibuffer.prototype.read_file_check_overwrite = function () {
    keywords(arguments);
    var initial_value = arguments.$initial_value;
    do {
        var path = yield this.read_file_path(forward_keywords(arguments),
                                             $initial_value = initial_value);
        var file = make_file(path);
        if (file.exists()) {
            var overwrite = yield this.read_yes_or_no(
                $prompt = "Overwrite existing file " + path + "?");
            if (!overwrite) {
                initial_value = path;
                continue;
            }
        }
        yield co_return(file);
    } while (true);
};

provide("minibuffer-read-file");
