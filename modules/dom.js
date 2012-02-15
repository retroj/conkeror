/**
 * (C) Copyright 2009-2010,2012 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

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
