
///
/// XUL DOM Procedures
///
/// (layer: xuldom)

function xul_createappendchild (node, childtype, attributes)
{
    const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
    var child = document.createElementNS (XUL_NS, childtype);
    var i, j;
    for (i = 0, j = 1; j < attributes.length; i+=2, j+=2)
    {
        if (attributes[j])
            child.setAttribute (attributes[i], attributes[j]);
    }
    node.appendChild (child);
    return child;
}

///
/// XUL DOM Menu Procedures
///
/// (layer:   xuldommenu
///  depends: xuldom)

function add_submenu (menu, id, label, key)
{
    return xul_createappendchild (menu, "menu", ["id", id, "label", label, "accesskey", key]);
}

function add_menupopup (menu)
{
    return xul_createappendchild (menu, "menupopup", []);
}

function add_menuitem (menu, id, label, key, oncommand)
{
    return xul_createappendchild (menu, "menuitem", ["id", id, "label", label, "accesskey", key, "oncommand", oncommand]);
}

function add_menuseparator (menu, id)
{
    return xul_createappendchild (menu, "menuseparator", ["id", id]);
}











function node_mathml_p (node)
{
    const NS_MathML = "http://www.w3.org/1998/Math/MathML";
    if ((node.nodeType == Node.TEXT_NODE &&  // JJF: where is Node.TEXT_NODE defined?  outer space?
         node.parentNode.namespaceURI == NS_MathML)
        || (node.namespaceURI == NS_MathML))
        return true;
    return false;
}


function text_selected_p () {
    return (document.commandDispatcher.focusedWindow.getSelection().toString().length > 0);
}


function  content_selected_p () {
    return !document.commandDispatcher.focusedWindow.getSelection().isCollapsed;
}



function image_node_p (node)
{
    if (node instanceof Components.interfaces.nsIImageLoadingContent && node.currentURI) 
        return true;
}

function image_node_loaded_p (node)
{
    var request = node.getRequest (Components.interfaces.nsIImageLoadingContent.CURRENT_REQUEST);
    if (request && (request.imageStatus & request.STATUS_SIZE_AVAILABLE))
        return true;
}

function image_node_url_spec (node)
{
    return node.currentURI.spec;
}

function image_standalone_p (node)
{
    if (node.ownerDocument instanceof ImageDocument)
        return true;
}

function html_input_node_p (node)
{
    return node instanceof HTMLInputElement;
}


function html_textarea_node_p (node)
{
    return node instanceof HTMLTextAreaElement;
}


function html_html_node_p (node)
{
    return node instanceof HTMLHtmlElement;
}


function textbox_node_p (node)
{
    // JJF: I'm not quite sure why password inputs count as textboxes, but
    // this is right out of firefox.
    if (node instanceof HTMLInputElement)
        return (node.type == "text" || node.type == "password");

    return (node instanceof HTMLTextAreaElement);
}


function keyword_field_node_p (node)
{
    // JJF: this is out of firefox.. not quite sure yet what it's useful for.
    var form = node.form;
    if (!form)
        return false;
    var method = form.method.toUpperCase();

    // These are the following types of forms we can create keywords for:
    //
    // method   encoding type       can create keyword
    // GET      *                                 YES
    //          *                                 YES
    // POST                                       YES
    // POST     application/x-www-form-urlencoded YES
    // POST     text/plain                        NO (a little tricky to do)
    // POST     multipart/form-data               NO
    // POST     everything else                   YES
    return (method == "GET" || method == "") ||
        (form.enctype != "text/plain") && (form.enctype != "multipart/form-data");
}


function xul_node_p (node) {
    const xulNS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
    return (node.namespaceURI == xulNS);
}


function url_saveable_p (url_s) {
    var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
    var uri;
    try { uri = ioService.newURI (url_s, null, null); }
    catch (ex) { return false; }
    var protocol = uri.scheme; // can be |undefined|
    return protocol && !(protocol == "mailto"     ||
                         protocol == "javascript" ||
                         protocol == "news"       ||
                         protocol == "snews"      );
}


function metadata_item_p (node) {
    // a metadata_item is an item for which, in firefox, you can view the
    // Properties window.
    return image_node_p (node) ||
        ( (node instanceof HTMLAnchorElement && node.href) ||
          node instanceof HTMLAreaElement ||
          node instanceof HTMLLinkElement ||
          node.getAttributeNS( "http://www.w3.org/1999/xlink", "type") == "simple" ) ||
        ( ( node instanceof HTMLQuoteElement && node.cite)    ||
          ( node instanceof HTMLTableElement && node.summary) ||
          ( node instanceof HTMLModElement &&
            ( node.cite || node.dateTime ) )                ||
          ( node instanceof HTMLElement &&
            ( node.title || node.lang ) )                   ||
          node.getAttributeNS(XMLNS, "lang") );
}


// Returns a "url"-type computed style attribute value, with the url() stripped.
function get_computed_url (elem, prop) {
    var url = elem.ownerDocument.defaultView.getComputedStyle (elem, '').getPropertyCSSValue (prop);
    return (url.primitiveType == CSSPrimitiveValue.CSS_URI) ? url.getStringValue () : null;
}


// Generate fully qualified URL for clicked-on link.
function get_link_url (node) {
    var href = node.href;
        
    if (href) {
        return href;
    }

    var href = node.getAttributeNS("http://www.w3.org/1999/xlink",
                                   "href");

    if (!href || !href.match(/\S/)) {
        throw "Empty href"; // Without this we try to save as the current doc, for example, HTML case also throws if empty
    }
    href = makeURLAbsolute (node.baseURI, href);
    return href;
}


function get_link_uri (linkURL) {
    var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
    try {
        return ioService.newURI(linkURL, null, null);
    } catch (ex) {
        // e.g. empty URL string
        return null;
    }
}

