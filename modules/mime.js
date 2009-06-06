/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 * (C) Copyright 2008 Nicholas A. Zigarovich
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

const mime_service = Cc["@mozilla.org/mime;1"].getService(Ci.nsIMIMEService);

define_variable("mime_type_external_handlers",
		[
		  [/^text\/.*$/, getenv("EDITOR")],
		  [/^image\/.*$/, "feh"],
		  [/^video\/.*$/, "mplayer"],
		  [/^audio\/.*$/, "mplayer"],
		  [/^application\/pdf$/, "evince"],
		  [/^application\/postscript$/, "evince"],
		  [/^application\/x-dvi$/, "evince"],
		  [/^.*$/, getenv("EDITOR")]
		],
		"Array of MIME types and external handlers. Each element is " +
		"an array of two elements, the first being the RegExp for " +
		"the target MIME type, the second being handler as a " +
		"string. Order matters. The handler of the first RegExp to " +
		"match a specified MIME type will be used.");

function _get_mime_type_index (mime_type) {
    for (let i = 0; i < mime_type_external_handlers.length; ++i) {
	let r = mime_type_external_handlers[i][0];
	if (mime_type.source == r.source)
	    return i;
    }
    return -1;
}

function _get_mime_type_regexp (mime_type) {
    if (mime_type instanceof RegExp)
	return mime_type;
    let mt_esc = mime_type.replace(/\*/, ".*").replace(/\//, "\\/");
    return new RegExp("^" + mt_esc + "$");
}

function _get_mime_type_string (mime_type) {
    if (mime_type instanceof RegExp) {
	return mime_type.source.slice(1,-1)
	                       .replace(/\\\//, "/")
	                       .replace(/\.\*/, "*");
    }
    return mime_type;
}

function get_mime_type_external_handler (mime_type) {
    if (mime_type instanceof RegExp) {
	let mt_i = _get_mime_type_index(mime_type);
	return mt_i != -1 ? mime_type_external_handlers[mt_i][1] : undefined;
    }
    else
	return predicate_alist_match(mime_type_external_handlers, mime_type);
}

function remove_mime_type_external_handler (mime_type) {
    let mt_r = _get_mime_type_regexp(mime_type);
    let mt_i = _get_mime_type_index(mt_r);
    if (mt_i != -1)
	return mime_type_external_handlers.splice(mt_i, 1)[0][1];
    return undefined;
}

/* Define a new external MIME type handler, or replace an existing handler.
 * 'before' is optional, and must be a MIME type. If 'before' is specified,
 * then the 'mime_type' will be added to the list immediately before the MIME
 * type noted by 'before', or at the end of the list if 'before' is not on the
 * list. For example:
 *
 * define_mime_type_external_handler("video/ogg-theora", "mplayer", "video/*");
 */
function define_mime_type_external_handler (mime_type, handler, before) {
    let eh = mime_type_external_handlers;
    let eh_len = eh.length;
    let eh_eol = eh_len > 0 && eh[eh_len-1][0].source == "^.*$" ?
	eh_len - 1 : eh_len;
    let mt_r = _get_mime_type_regexp(mime_type);
    let mt_s = _get_mime_type_string(mime_type);
    if (mt_s == "*" && ! before) {
	remove_mime_type_external_handler(mt_r);
	eh.push([mt_r, handler]);
    } else if (! before) {
	let mt_i = _get_mime_type_index(mt_r);
	if (mt_i != -1)
	    eh[mt_i] = [mt_r, handler];
	else {
	    let mt_m = /^([^\/]+)\/[^*]+$/.exec(mt_s);
	    if (mt_m != null) {
		before = mt_m[1] + "/*";
		define_mime_type_external_handler(mime_type, handler, before);
	    } else {
		eh.splice(eh_eol, 0, [mt_r, handler]);
	    }
	}
    } else {
	remove_mime_type_external_handler(mt_r);
	let bf_r = _get_mime_type_regexp(before);
	let bf_i = _get_mime_type_index(bf_r);
	if (bf_i == -1)
	    bf_i = eh_eol;
	eh.splice(bf_i, 0, [mt_r, handler]);
    }
}

function mime_type_from_uri (uri) {
    var type = "application/octet-stream";
    try {
        uri = make_uri(uri);
        type = mime_service.getTypeFromURI(uri);
    } catch (e) {}
    return type;
}

function mime_info_from_mime_type (type) {
    if (type == null)
        type = "application/octet-stream";
    try {
        return mime_service.getFromTypeAndExtension(type, null);
    } catch (e) {
        return null;
    }
}
