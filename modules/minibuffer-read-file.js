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


function file_path_completions (completer, data, common_prefix, suffix) {
    completions.call(this, completer, data);
    this.common_prefix = common_prefix;
    this.suffix = suffix;
}
file_path_completions.prototype = {
    constructor: file_path_completions,
    __proto__: completions.prototype,
    toString: function () "#<file_path_completions>",
    common_prefix: null,
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
    },
    get common_prefix_input_state () {
        if (this.count == 1) {
            var prefix = this.get_string(0);
            if (this.data[0].isDirectory())
                prefix += "/";
        } else {
            prefix = this.common_prefix;
        }
        var i = prefix.length;
        return [prefix, i, i];
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
        var entries = [];
        try {
            var f = make_file(s);
            if (separator_p(s.substr(pos - 1, 1))) {
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
                    entries.push(e);
                }
            }
        } catch (e) {
            return null;
        }
        entries.sort(function (a, b) {
            a = a.path;
            b = b.path;
            if (a < b)
                return -1;
            if (a > b)
                return 1;
            return 0;
        });
        var first = entries[0].path;
        var last = entries[entries.length - 1].path;
        var cpi = common_prefix_length(first, last);
        var common_prefix = first.substring(0, cpi);
        return new file_path_completions(this, entries, common_prefix, suffix);
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
        $completer = arguments.$completer || new file_path_completer(),
        forward_keywords(arguments),
        $auto_complete);
    yield co_return(result);
};

minibuffer.prototype.read_file = function () {
    var result = yield this.read_file_path(forward_keywords(arguments));
    yield co_return(make_file(result));
};

minibuffer.prototype.read_existing_file = function () {
    function validator (x) {
        try {
            return make_file(x).exists();
        } catch (e) {
            return false;
        }
    }
    var result = yield this.read_file_path(
        forward_keywords(arguments),
        $validator = validator);
    yield co_return(result);
};

//XXX: why '_path' instead of just 'read_directory' returning an nsIFile?
minibuffer.prototype.read_directory_path = function () {
    function validator (x) {
        try {
            var f = make_file(x);
            return !f.exists() || f.isDirectory();
        } catch (e) {
            return false;
        }
    }
    var result = yield this.read_file_path(
        forward_keywords(arguments),
        $completer = new file_path_completer($test = directory_p),
        $validator = validator); //XXX: overridden by read_existing_directory_path?
    yield co_return(result);
};

//XXX: why '_path' instead of just 'read_existing_directory' returning an nsIFile?
minibuffer.prototype.read_existing_directory_path = function () {
    function validator (x) {
        try {
            return directory_p(make_file(x));
        } catch (e) {
            return false;
        }
    }
    var result = yield this.read_directory_path(
        forward_keywords(arguments),
        $validator = validator);
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
