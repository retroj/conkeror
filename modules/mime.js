

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
    return predicate_alist_match(mime_type);
}

function mime_type_from_url(url) {
    var type = "application/octet-stream";
    try {
        url = make_uri(url);
        type = mime_service.getTypeFromURI(url);
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
