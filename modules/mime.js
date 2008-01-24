

const mime_service = Cc["@mozilla.org/mime;1"].getService(Ci.nsIMIMEService);

var mime_type_external_handlers = [

    ["text/", "emacs"],
    ["image/.*", "feh"],
    ["video/.*", "mplayer"],
    ["audio/.*", "mplayer"],
    ["application/pdf", "evince"],
    ["application/postscript", "evince"],
    ["application/x-dvi", "evince"],
    [".*", "emacs"]

    ];

// FIXME: Make this array regexp matching a general operation
function get_external_handler_for_mime_type(mime_type) {
    var handlers = mime_type_external_handlers;
    for (var i = 0; i < handlers.length; ++i) {
        var handler = handlers[i];
        if (mime_type.match(new RegExp(handler[0])) != mime_type)
            continue;
        return handler[1];
    }
    return null;
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
