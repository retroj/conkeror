/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 * (C) Copyright 2008 Nicholas A. Zigarovich
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

const mime_service = Cc["@mozilla.org/mime;1"].getService(Ci.nsIMIMEService);

var mime_type_external_handlers = [
    [/^text\/.*$/, getenv("EDITOR")],
    [/^image\/.*$/, "feh"],
    [/^video\/.*$/, "mplayer"],
    [/^audio\/.*$/, "mplayer"],
    [/^application\/pdf$/, "evince"],
    [/^application\/postscript$/, "evince"],
    [/^application\/x-dvi$/, "evince"],
    [/^.*$/, getenv("EDITOR")]
    ];

function _get_mime_type_index(mime_type) {
    for (let i = 0; i < mime_type_external_handlers.length; ++i) {
	let r = mime_type_external_handlers[i][0];
	if (mime_type.source == r.source)
	    return i;
    }
    return -1;
}

function _get_mime_type_regexp(mime_type) {
    if (mime_type instanceof RegExp)
	return mime_type;
    let mt_esc = mime_type.replace(/\*/, ".*").replace(/\//, "\\/");
    return new RegExp("^" + mt_esc + "$");
}

function get_mime_type_external_handler(mime_type) {
    if (mime_type instanceof RegExp) {
	let mt_i = _get_mime_type_index(mime_type);
	return mt_i != -1 ? mime_type_external_handlers[mt_i][1] : undefined;
    }
    else
	return predicate_alist_match(mime_type_external_handlers, mime_type);
}

function remove_mime_type_external_handler(mime_type) {
    let mt_r = _get_mime_type_regexp(mime_type);
    let mt_i = _get_mime_type_index(mt_r);
    if (mt_i != -1)
	return mime_type_external_handlers.splice(mt_i, 1)[0][1];
    return undefined;
}

/* Define a new external MIME type handler, or replace an existing handler.
 * 'before' is optional, and must be a MIME type. If 'before' is specified,
 * then the 'mime_type' will be added to the list immediately before the MIME
 * type noted by 'before'. For example:
 *
 * define_mime_type_external_handler("video/ogg-theora", "mplayer", "video/*");
 *
 * If 'before' is specified but not in the list, then the 'mime_type' will be
 * added to the end of the list.
 *
 * If 'before' is omitted, and 'mime_type' is not already in the list, then it
 * will be added to the end of the list; else if 'mime_type' is already in the
 * list, then it will retain its current position in the list with the new
 * 'handler'.
 */
function define_mime_type_external_handler(mime_type, handler, before) {
    let mteh = mime_type_external_handlers;
    let mt_r = _get_mime_type_regexp(mime_type);
    if (! before) {
	mt_i = _get_mime_type_index(mt_r);
	if (mt_i != -1)
	    mteh[mt_i] = [mt_r, handler];
	else
	    mteh.splice(mteh.length-1, 0, [mt_r, handler]);
    }
    else {
	remove_mime_type_external_handler(mt_r);
	let bf_r = _get_mime_type_regexp(before);
	let bf_i = _get_mime_type_index(bf_r);
	if (bf_i == -1)
	    bf_i = mteh.length - 1;
	mteh.splice(bf_i, 0, [mt_r, handler]);
    }
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
