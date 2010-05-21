/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 * (C) Copyright 2008 Nicholas A. Zigarovich
 * (C) Copyright 2009 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

const mime_service = Cc["@mozilla.org/mime;1"].getService(Ci.nsIMIMEService);

/**
 * mime_type_parse splits a mime type or mime type pattern on
 * a / character, and returns a two element array of the halves.
 * If mime_type does not contain a /, then the argument is returned
 * unchanged.
 */
function mime_type_parse (mime_type) {
    var slash_idx = mime_type.indexOf("/");
    if (slash_idx != -1)
        return [mime_type.substring(0, slash_idx),
                mime_type.substring(slash_idx + 1)];
    return mime_type;
}

function mime_type_table () {}
mime_type_table.prototype = {
    constructor: mime_type_table,
    table: {},
    get: function (mime_type) {
        var p = mime_type_parse(mime_type);
        if (this.table[p[0]])
            return this.table[p[0]][p[1]] ||
                this.table[p[0]]["*"] ||
                this.table["*"];
        else
            return this.table["*"];
    },
    set: function (mime_type, value) {
        var p = mime_type_parse(mime_type);
        if (p == "*")
            return (this.table["*"] = value);
        if (typeof p == "string") {
            if (! this.table[p])
                this.table[p] = {};
            return (this.table[p]["*"] = value);
        }
        if (! this.table[p[0]])
            this.table[p[0]] = {};
        return (this.table[p[0]][p[1]] = value);
    }
};


/**
 * define_mime_type_table makes a user variable of the given name that
 * encapsulates the table given as the default value, having the methods
 * `get' and `set' for maintaining an association of mime-type patterns
 * with arbitrary values.
 */
function define_mime_type_table (name, default_value, doc) {
    var handlers = { table: default_value };
    handlers.__proto__ = mime_type_table.prototype;
    define_special_variable(name,
        function () handlers,
        function (table) handlers.table = table,
        doc);
}


define_mime_type_table("external_content_handlers",
    {
        "*": getenv("EDITOR"),
        text: { "*": getenv("EDITOR") },
        image: { "*": "feh" },
        video: { "*": "mplayer" },
        audio: { "*": "mplayer" },
        application: {
            pdf: "evince",
            postscript: "evince",
            "x-dvi": "evince"
        }
    },
    "Structure associating MIME types and MIME type patterns with "+
    "the names of programs for handling those them.  The key \"*\" "+
    "is a pattern-matching symbol which matches anything.");


/**
 *
 */
function mime_type_from_uri (uri) {
    var type = "application/octet-stream";
    try {
        uri = make_uri(uri);
        type = mime_service.getTypeFromURI(uri);
    } catch (e) {}
    return type;
}

/**
 *
 */
function mime_info_from_mime_type (type) {
    if (type == null)
        type = "application/octet-stream";
    try {
        return mime_service.getFromTypeAndExtension(type, null);
    } catch (e) {
        return null;
    }
}

provide("mime");
