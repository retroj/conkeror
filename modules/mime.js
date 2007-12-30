

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
    try {
        if (typeof(url) == "string")
            url = makeURL(url);
        return mime_service.getTypeFromURI(url);
    } catch (e) {
        return null;
    }
}
