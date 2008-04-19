/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

const mime_service = Cc["@mozilla.org/mime;1"].getService(Ci.nsIMIMEService);

var mime_type_external_handlers = [

    [ /^text\/.*$/, getenv("EDITOR")],
    [/^image\/.*$/, "feh"],
    [/^video\/.*$/, "mplayer"],
    [/^audio\/.*$/, "mplayer"],
    [/^application\/pdf$/, "evince"],
    [/^application\/postscript$/, "evince"],
    [/^application\/x-dvi$/, "evince"],
    [/^.*$/, getenv("EDITOR")]
    ];

function get_external_handler_for_mime_type(mime_type) {
    return predicate_alist_match(mime_type_external_handlers, mime_type);
}

function mime_type_from_uri(uri) {
    var type = "application/octet-stream";
    try {
        uri = make_uri(uri);
        type = mime_service.getTypeFromURI(uri);
    } catch (e) {}
    return type;
}

function mime_info_from_mime_type(type) {
    if (type == null)
        type = "application/octet-stream";
    try {
        return mime_service.getFromTypeAndExtension(type, null);
    } catch (e) {
        return null;
    }
}
