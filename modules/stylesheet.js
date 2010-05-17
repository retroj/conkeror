/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2010 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

function register_user_stylesheet (url) {
    var uri = make_uri(url);
    var sss = Cc["@mozilla.org/content/style-sheet-service;1"]
        .getService(Ci.nsIStyleSheetService);
    sss.loadAndRegisterSheet(uri, sss.USER_SHEET);
}

function unregister_user_stylesheet (url) {
    var uri = make_uri(url);
    var sss = Cc["@mozilla.org/content/style-sheet-service;1"]
        .getService(Ci.nsIStyleSheetService);
    if (sss.sheetRegistered(uri, sss.USER_SHEET))
        sss.unregisterSheet(uri, sss.USER_SHEET);
}

function register_agent_stylesheet (url) {
    var uri = make_uri(url);
    var sss = Cc["@mozilla.org/content/style-sheet-service;1"]
        .getService(Ci.nsIStyleSheetService);
    sss.loadAndRegisterSheet(uri, sss.AGENT_SHEET);
}

function unregister_agent_stylesheet (url) {
    var uri = make_uri(url);
    var sss = Cc["@mozilla.org/content/style-sheet-service;1"]
        .getService(Ci.nsIStyleSheetService);
    if (sss.sheetRegistered(uri, sss.AGENT_SHEET))
        sss.unregisterSheet(uri, sss.AGENT_SHEET);
}

function agent_stylesheet_registered_p (url) {
    var uri = make_uri(url);
    var sss = Cc["@mozilla.org/content/style-sheet-service;1"]
        .getService(Ci.nsIStyleSheetService);
    return sss.sheetRegistered(uri, sss.AGENT_SHEET);
}

function user_stylesheet_registered_p (url) {
    var uri = make_uri(url);
    var sss = Cc["@mozilla.org/content/style-sheet-service;1"]
        .getService(Ci.nsIStyleSheetService);
    return sss.sheetRegistered(uri, sss.USER_SHEET);
}

/**
 * make_css_data_uri takes specifications for a css data uri in its
 * positional and keyword arguments, and returns a new nsIURI object.
 *
 * rules: css rules, not including any @namespace or @-moz-document
 *        headers.  given as a string or an array of strings.
 *
 * $namespace: optional string url for a @namespace header.
 *
 * $domains: optional string, or array of strings, for a @-moz-document
 *           domain(...) header.
 *
 * $urls: optional string, or array of strings, for a @-moz-document
 *        url(...) header.
 *
 * $url_prefixes: optional string, or array of strings, for a
 *                @-moz-document url-prefix(...) header.
 */
define_keywords("$namespace", "$domains", "$urls", "$url_prefixes");
function make_css_data_uri (rules) {
    keywords(arguments);
    var namespace = arguments.$namespace;
    var domains = arguments.$domains;
    var urls = arguments.$urls;
    var url_prefixes = arguments.$url_prefixes;
    rules = make_array(rules).join("\n");
    var restrictions = Array.prototype.concat(
        make_array(domains).map(function (x) "domain("+x+")"),
        make_array(urls).map(function (x) "url("+x+")"),
        make_array(url_prefixes).map(function (x) "url-prefix("+x+")"))
        .join(",\n");
    if (restrictions)
        rules = "@-moz-document "+restrictions+" {\n"+rules+"\n}";
    if (namespace)
        rules = "@namespace url("+namespace+")\n"+rules;
    return make_uri("data:text/css,"+escape(rules));
}

provide("stylesheet");
