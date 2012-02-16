/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 * (C) Copyright 2007-2012 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

const XHTML_NS = "http://www.w3.org/1999/xhtml";
const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
const MATHML_NS = "http://www.w3.org/1998/Math/MathML";
const XLINK_NS = "http://www.w3.org/1999/xlink";
const SVG_NS = "http://www.w3.org/2000/svg";


function create_XUL (window, tag_name) {
    return window.document.createElementNS(XUL_NS, tag_name);
}


function dom_generator (document, ns) {
    this.document = document;
    this.ns = ns;
}
dom_generator.prototype = {
    constructor: dom_generator,
    element: function (tag, parent) {
        var node = this.document.createElementNS(this.ns, tag);
        var i = 1;
        if (parent != null && (parent instanceof Ci.nsIDOMNode)) {
            parent.appendChild(node);
            i = 2;
        }
        for (var nargs = arguments.length; i < nargs; i += 2)
            node.setAttribute(arguments[i], arguments[i+1]);
        return node;
    },
    text: function (str, parent) {
        var node = this.document.createTextNode(str);
        if (parent)
            parent.appendChild(node);
        return node;
    },
    stylesheet_link: function (href, parent) {
        var node = this.element("link");
        node.setAttribute("rel", "stylesheet");
        node.setAttribute("type", "text/css");
        node.setAttribute("href", href);
        if (parent)
            parent.appendChild(node);
        return node;
    },
    add_stylesheet: function (url) {
        var head = this.document.documentElement.firstChild;
        this.stylesheet_link(url, head);
    }
};


/**
 * dom_add_class adds a css class to the given dom node.
 */
function dom_add_class (node, cssclass) {
    if (node.className) {
        var cs = node.className.split(" ");
        if (cs.indexOf(cssclass) != -1)
            return;
        cs.push(cssclass);
        node.className = cs.join(" ");
    } else
        node.className = cssclass;
}

/**
 * dom_remove_class removes the given css class from the given dom node.
 */
function dom_remove_class (node, cssclass) {
    if (! node.className)
        return;
    var classes = node.className.split(" ");
    classes = classes.filter(function (x) { return x != cssclass; });
    node.className = classes.join(" ");
}


/**
 * dom_node_flash adds the given cssclass to the node for a brief interval.
 * this class can be styled, to create a flashing effect.
 */
function dom_node_flash (node, cssclass) {
    dom_add_class(node, cssclass);
    call_after_timeout(
        function () {
            dom_remove_class(node, cssclass);
        },
        400);
}


/**
 * xpath_lookup_namespace is a namespace resolver that may be passed to
 * document.evaluate.
 */
function xpath_lookup_namespace (prefix) {
    return {
        xhtml: XHTML_NS,
        m: MATHML_NS,
        xul: XUL_NS,
        svg: SVG_NS
    }[prefix] || null;
}

/**
 * xpath_find_node takes a document and a string xpath expression,
 * performs a FIRST_ORDERED_NODE_TYPE lookup with the expression, and
 * returns the single node in the result set, if any.
 */
function xpath_find_node (doc, xpath) {
    var r = doc.evaluate(xpath, doc, xpath_lookup_namespace,
                         Ci.nsIDOMXPathResult.FIRST_ORDERED_NODE_TYPE,
                         null);
    return r.singleNodeValue;
}

/**
 * xpath_find_any takes a document and a string xpath expression, performs
 * an ANY_TYPE lookup with the expression, and returns an XPathResult
 * object that gives the result set.
 */
function xpath_find_any (doc, xpath) {
    return doc.evaluate(xpath, doc, xpath_lookup_namespace,
                        Ci.nsIDOMXPathResult.ANY_TYPE, null);
}

provide("dom");
