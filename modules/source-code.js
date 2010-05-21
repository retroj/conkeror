/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2009 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

require_later("external-editor.js");

var conkeror_source_code_path = null;

function source_code_reference (uri, line_number) {
    this.uri = uri;
    this.line_number = line_number;
}
source_code_reference.prototype = {
    constructor: source_code_reference,
    get module_name () {
        if (this.uri.indexOf(module_uri_prefix) == 0)
            return this.uri.substring(module_uri_prefix.length);
        return null;
    },

    get file_name () {
        var file_uri_prefix = "file://";
        if (this.uri.indexOf(file_uri_prefix) == 0)
            return this.uri.substring(file_uri_prefix.length);
        return null;
    },

    get best_uri () {
        if (conkeror_source_code_path != null) {
            var module_name = this.module_name;
            if (module_name != null)
                return "file://" + conkeror_source_code_path + "/modules/" + module_name;
        }
        return this.uri;
    },

    open_in_editor : function() {
        yield open_with_external_editor(load_spec(this.best_uri),
                                        $line = this.line_number);
    }
};

var get_caller_source_code_reference_ignored_functions = {};

function get_caller_source_code_reference (extra_frames_back) {
    /* Skip at least this function itself and whoever called it (and
     * more if the caller wants to be skipped). */
    var frames_to_skip = 2;
    if (extra_frames_back != null)
        frames_to_skip += extra_frames_back;

    for (let f = Components.stack; f != null; f = f.caller) {
        if (frames_to_skip > 0) {
            --frames_to_skip;
            continue;
        }
        if (get_caller_source_code_reference_ignored_functions[f.name])
            continue;
        return new source_code_reference(f.filename, f.lineNumber);
    }

    return null;
}

function ignore_function_for_get_caller_source_code_reference (func_name) {
    get_caller_source_code_reference_ignored_functions[func_name] = 1;
}

provide("source-code");
