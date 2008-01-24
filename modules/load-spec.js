
function get_web_navigation_for_frame(frame) {
    var ifr = frame.QueryInterface(Ci.nsIInterfaceRequestor);
    return ifr.getInterface(Ci.nsIWebNavigation);
}

function get_SHEntry_for_document(doc)
{
    try
    {
        var frame = doc.defaultView;
        var webNav = get_web_navigation_for_frame(frame);
        var pageLoader = webNav.QueryInterface(Ci.nsIWebPageDescriptor);
        var desc = pageLoader.currentDescriptor.QueryInterface(Ci.nsISHEntry);
        return desc;
    } catch (e) { return null; }
}

function document_load_spec(doc) {
    var sh_entry = get_SHEntry_for_document(doc);
    var result = {url: doc.location.href, document: doc};
    if (sh_entry != null) {
        result.cache_key = sh_entry;
        result.referrer = sh_entry.referrerURI;
        result.post_data = sh_entry.postData;
    }
    return result;
}

function uri_string_from_load_spec(spec) {
    if (typeof(spec) == "object")
        return spec.url;
    return spec;
}

function uri_from_load_spec(spec) {
    if (typeof(spec) == "object" && spec.document != null)
        return spec.document.documentURIObject;
    return make_uri(uri_string_from_load_spec(spec));
}

function mime_type_from_load_spec(spec) {
    if (typeof(spec) == "object" && spec.document) {
        return spec.document.contentType || "application/octet-stream";
    }
    return mime_type_from_url(uri_string_from_load_spec(spec));
}

function mime_info_from_load_spec(spec) {
    var type = mime_type_from_load_spec(spec);
    return mime_info_from_mime_type(type);
}

function default_shell_command_from_load_spec(spec) {
    var mime_type = mime_type_from_load_spec(spec);
    var handler = get_external_handler_for_mime_type(mime_type);
    return handler;
}

/* Target can be either a content_buffer or an nsIWebNavigation */
function apply_load_spec(target, load_spec) {
    var url, flags, referrer, post_data;
    if (typeof(load_spec) == "string") {
        url = load_spec;
        flags = null;
        referrer = null;
        post_data = null;
    } else {
        url = load_spec.url;
        flags = load_spec.flags;
        referrer = load_spec.referrer;
        post_data = load_spec.post_data;
    }
    if (flags == null)
        flags = Ci.nsIWebNavigation.LOAD_FLAGS_NONE;
    if (target instanceof content_buffer) {
        target._display_URI = url;
        target = target.web_navigation;
        //buffer_description_change_hook.run(target);
    }
    target.loadURI(url, flags, referrer, post_data, null /* headers */);
}
