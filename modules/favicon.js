
const favicon_service = Cc["@mozilla.org/browser/favicon-service;1"].getService(Ci.nsIFaviconService);

define_buffer_local_hook("buffer_favicon_change_hook");

function favicon_content_buffer_started_loading(buffer) {
    var old = buffer.favicon;
    buffer.favicon = null;
    if (old != null)
        buffer_favicon_change_hook.run(buffer);
}
add_hook("content_buffer_started_loading_hook", favicon_content_buffer_started_loading);

define_user_variable("favicon_image_max_size", 1024, "Maximum (pixel) width and height of an image document that is considered for use as a favicon.");
var favicon_image_max_size = 1024;

function favicon_content_buffer_finished_loading(buffer) {
    if (buffer.favicon != null)
        return;

    if (buffer.top_document instanceof Ci.nsIImageDocument) {
        var req = buffer.top_document.imageRequest;
        if (req && req.image &&
            req.image.width <= favicon_image_max_size  &&
            req.image.height <= favicon_image_max_size) {
            favicon_set(buffer, buffer.current_URI);
            return;
        }
    }

    var uri = buffer.current_URI;
    // Only load favicons for http and https
    if (!uri.schemeIs("http") && !uri.schemeIs("https"))
        return;

    var icon_url = makeURL(uri.prePath + "/favicon.ico");
    if (!favicon_service.isFailedFavicon(icon_url))
        favicon_set(buffer, icon_url);
}
add_hook("content_buffer_finished_loading_hook", favicon_content_buffer_finished_loading);

var content_policy_service = Cc["@mozilla.org/layout/content-policy;1"].getService(Ci.nsIContentPolicy);

function favicon_content_buffer_dom_link_added(buffer, event) {
    var link = event.originalTarget;

    if (!link || !link.ownerDocument || !link.rel || !link.href)
        return;

    var rel = link.rel.toLowerCase();
    var rel_strings = rel.split(/\s+/);
    if (rel_strings.indexOf("icon") == -1)
        return;

    /* FIXME: perhaps worry about newURI throwing an exception */
    var target_doc = link.ownerDocument;
    var ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
    var uri = ios.newURI(link.href, target_doc.characterSet, null);

    if (favicon_service.isFailedFavicon(uri))
        return;

    // Verify that the load of this icon is legal.
    // error pages can load their favicon, to be on the safe side,
    // only allow chrome:// favicons
    const about_neterr = "about:neterror?";
    if (target_doc.documentURI.substr(0, about_neterr.length) != about_neterr || !uri.schemeIs("chrome")) {
        var ssm = Cc["@mozilla.org/scriptsecuritymanager;1"].getService(Ci.nsIScriptSecurityManager);
        try {
            ssm.checkLoadURIWithPrincipal(target_doc.nodePrincipal, uri,
                                          Ci.nsIScriptSecurityManager.DISALLOW_SCRIPT);
        } catch(e) {
            return;
        }
    }

    try {
    } catch(e) {
        return; // Refuse to load if we can't do a security check.
    }

    // Security says okay, now ask content policy
    if (content_policy_service.shouldLoad(Ci.nsIContentPolicy.TYPE_IMAGE,
                                          uri, target_doc.documentURIObject,
                                          link, link.type, null)
        != Ci.nsIContentPolicy.ACCEPT)
        return;

    favicon_set(buffer, uri);
}
add_hook("content_buffer_dom_link_added_hook", favicon_content_buffer_dom_link_added);

function favicon_set(buffer, icon_url) {
    buffer.favicon = icon_url.spec;

    favicon_service.setAndLoadFaviconForPage(buffer.current_URI, icon_url, false);
    buffer_favicon_change_hook.run(buffer);
}
