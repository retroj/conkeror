/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

/**
 * A load_spec has the following properties:
 *
 * Name:        Required?   Type:           Description:
 * -----        ---------   -----           ------------
 * uri          required    string          Specifies the URI of the target.
 *
 * document     optional    nsIDOMDocument  Specifies a document corresponding to the target.
 *                                          Can also provide a default value for the mime_type property,
 *                                          the title property, and the source_frame property.
 *
 * element      optional    nsIDOMNode      The DOM node of a load_spec created by load_spec_from_element.
 *
 * flags        optional    number          Specifies flags to pass to nsIWebNavigation.loadURI
 *
 * cache_key    optional    nsISHEntry      Specifies a key for accessing the target from the cache.
 *
 * referrer     optional    nsIURI          Specifies the referrer URI to use to access the target.
 *
 * post_data    optional    nsIInputStream  Specifies POST data to use to access the target.
 *                                          The request headers should be included in this stream.
 *
 * request_mime_type
 *              optional    string          Specifies the MIME type for the request post data.
 *
 * raw_post_data
 *              optional    nsIInputStream  Specifies the POST data to use to access the target.
 *                                          The request_mime_type property must also be set.
 *                                          This provides a value for post_data.
 *
 * mime_type    optional    string          Specifies the MIME type of the target.
 *
 * title        optional    string          Specifies a title/description text associated with the target.
 *
 * source_frame optional    nsIDOMWindow    Specifies the frame from which the link to the target was "obtained".
 *                                          Can provide a default value for referrer if document is not specified.
 *
 * filename     optional    string          Specifies a default filename to use to save the target.
 *
 * filename_extension
 *              optional    string          Specifies a default filename extension to use to save the target.
 *
 * suggest_filename_from_uri
 *              optional    boolean         Specifies whether to attempt to generate a filename from the URI.
 *                                          Defaults to true.
 */

in_module(null);

require("webjump.js");

function page_fragment_load_spec (elem) {
    var uri = makeURLAbsolute(elem.ownerDocument.documentURI,
                              "#" + (elem.id || elem.name));
    var title = elem.ownerDocument.title;
    if (elem.textContent) {
        if (title) title += ' - ';
        title += elem.textContent;
    }
    return {
        uri: uri,
        element: elem,
        title: title
    };
}

function load_spec_from_element (elem) {
    var spec = {};
    if (elem instanceof Ci.nsIDOMWindow)
        spec.document = elem.document;

    else if (elem instanceof Ci.nsIDOMHTMLFrameElement ||
             elem instanceof Ci.nsIDOMHTMLIFrameElement)
        spec.document = elem.contentDocument;

    else {
        var url = null;
        var title = null;

        if ((elem instanceof Ci.nsIDOMHTMLAnchorElement ||
             elem instanceof Ci.nsIDOMHTMLAreaElement ||
             elem instanceof Ci.nsIDOMHTMLLinkElement) &&
	    elem.hasAttribute("href"))
        {
            url = elem.href;
            title = elem.title || elem.textContent;
        }
        else if (elem instanceof Ci.nsIDOMHTMLImageElement) {
            url = elem.src;
            title = elem.title || elem.alt;
        }
        else if (elem.hasAttribute("id") ||
                 (elem instanceof Ci.nsIDOMHTMLAnchorElement &&
                  elem.hasAttribute("name"))) {
            return page_fragment_load_spec(elem);
        }
        else {
            var node = elem;
            while (node && !(node instanceof Ci.nsIDOMHTMLAnchorElement))
                node = node.parentNode;
            if (node) {
                if (node.hasAttribute("href"))
                    url = node.href;
                else
                    node = null;
            }
            if (!node) {
                // Try simple XLink
                node = elem;
                while (node) {
                    if (node.nodeType == Ci.nsIDOMNode.ELEMENT_NODE) {
                        url = node.getAttributeNS(XLINK_NS, "href");
                        break;
                    }
                    node = node.parentNode;
                }
                if (url)
                    url = makeURLAbsolute(node.baseURI, url);
                title = node.title || node.textContent;
            }
        }
        if (url && url.length > 0) {
            if (title && title.length == 0)
                title = null;
            spec.uri = url;
            spec.source_frame = elem.ownerDocument.defaultView;
            spec.title = title;
        }
        spec.element = elem;
    }
    return spec;
}

function load_spec (x) {
    var spec;
    if (typeof(x) == "string")
        x = get_url_or_webjump(x);
    if (typeof(x) == "string")
        spec = { uri: x };
    else if ((x instanceof Ci.nsIDOMNode) ||
             (x instanceof Ci.nsIDOMWindow))
    {
        spec = load_spec_from_element(x);
    } else if (typeof(x) == "object") {
        spec = x;
    }
    if (! load_spec_uri_string(spec))
        throw new Error("Invalid load-spec");
    spec.__proto__ = load_spec.prototype;
    return spec;
}
load_spec.prototype = {
    constructor: load_spec,
    toString: function () "[object load_spec]"
};

function load_spec_document (x) {
    return x.document;
}

function load_spec_element (x) {
    return x.element;
}

function load_spec_title (x) {
    if (x.title)
        return x.title;
    if (x.document)
        return x.document.title;
    return null;
}

function load_spec_mime_type (x) {
    if (x.mime_type)
        return x.mime_type;
    if (x.document)
        return x.document.contentType || "application/octet-stream";
    return mime_type_from_uri(load_spec_uri(x));
}

function load_spec_filename (x) {
    return x.filename;
}

function load_spec_filename_extension (x) {
    return x.filename_extension;
}

function get_web_navigation_for_frame (frame) {
    var ifr = frame.QueryInterface(Ci.nsIInterfaceRequestor);
    return ifr.getInterface(Ci.nsIWebNavigation);
}

function get_SHEntry_for_document (doc) {
    try {
        var frame = doc.defaultView;
        var webNav = get_web_navigation_for_frame(frame);
        var pageLoader = webNav.QueryInterface(Ci.nsIWebPageDescriptor);
        var desc = pageLoader.currentDescriptor.QueryInterface(Ci.nsISHEntry);
        return desc;
    } catch (e) { return null; }
}

function load_spec_set_properties_from_sh_entry (x) {
    var sh_entry = get_SHEntry_for_document(x.document);
    if (sh_entry != null) {
        x.cache_key = sh_entry;
        x.referrer = sh_entry.referrerURI;
        x.post_data = sh_entry.postData;
    }
}

function load_spec_referrer (x) {
    if (x.referrer)
        return x.referrer;
    if (x.document) {
        load_spec_set_properties_from_sh_entry(x);
        return x.referrer;
    }
    if (x.source_frame) {
        x.referrer = x.source_frame.document.documentURIObject;
        return x.referrer;
    }
    return null;
}

function load_spec_post_data (x) {
    if (x.post_data)
        return x.post_data;
    if (x.raw_post_data) {
        let y = x.raw_post_data;
        if (typeof(y) == "string")
            y = string_input_stream(y);
        x.post_data = mime_input_stream(y, [["Content-Type", x.request_mime_type]]);
        return x.post_data;
    }
    if (x.document) {
        load_spec_set_properties_from_sh_entry(x);
        return x.post_data;
    }
    return null;
}

function load_spec_raw_post_data (x) {
    return x.raw_post_data;
}

function load_spec_request_mime_type (x) {
    return x.request_mime_type;
}

function load_spec_cache_key (x) {
    if (x.cache_key)
        return x.cache_key;
    if (x.document) {
        load_spec_set_properties_from_sh_entry(x);
        return x.cache_key;
    }
    return null;
}

function load_spec_source_frame (x) {
    if (x.source_frame)
        return x.source_frame;
    if (x.document)
        return x.document.defaultView;
    return null;
}

function load_spec_uri_string (x) {
    if (x.uri)
        return x.uri;
    if (x.document && x.document.defaultView)
        return x.document.defaultView.location.href;
    if (x.document)
        return x.document.documentURI;
    return null;
}

function load_spec_uri (x) {
    if (x.document && x.document.defaultView)
        return make_uri(x.document.defaultView.location.href);
    if (x.document)
        return x.document.documentURIObject;
    return make_uri(load_spec_uri_string(x));
}

function load_spec_flags (x) {
    return x.load_spec_flags;
}

function load_spec_mime_info (x) {
    var type = load_spec_mime_type(x);
    return mime_info_from_mime_type(type);
}

function load_spec_default_shell_command (x) {
    var mime_type = load_spec_mime_type(x);
    return external_content_handlers.get(mime_type);
}

function load_spec_forced_charset (x) {
    return x.forced_charset;
}

define_variable('forced_charset_list', null,
    "Alist mapping url-regexps to forced charsets.  The first match "+
    "will be used.");

/* Target can be either a content_buffer or an nsIWebNavigation */
function apply_load_spec (target, spec) {
    if (! (spec instanceof load_spec))
        spec = load_spec(spec);
    var uri = load_spec_uri_string(spec);
    var flags = load_spec_flags(spec);
    var referrer = load_spec_referrer(spec);
    var post_data = load_spec_post_data(spec);
    var forced_charset = load_spec_forced_charset(spec);

    if (! forced_charset && forced_charset_list)
        forced_charset = predicate_alist_match(forced_charset_list, uri);

    if (forced_charset) {
        try {
            var atomservice = Cc['@mozilla.org/atom-service;1']
                .getService(Ci.nsIAtomService);
            target.web_navigation.documentCharsetInfo.forcedCharset =
                atomservice.getAtom(forced_charset);
        } catch (e) {}
    }

    if (flags == null)
        flags = Ci.nsIWebNavigation.LOAD_FLAGS_NONE;

    if (target instanceof content_buffer) {
        try {
            target.web_navigation.loadURI(uri, flags, referrer, post_data, null /* headers */);
            target._display_uri = uri;
            buffer_description_change_hook.run(target);
        } catch (e) {
            /* Ignore error for now */
        }
    } else {
        try {
            target.loadURI(uri, flags, referrer, post_data, null /* headers */);
        } catch (e) {
            /* Ignore error for now */
        }
    }
}

provide("load-spec");
