/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

require("utils.js");

var search_engines = new string_hashmap();

function search_engine_parse_error(msg) {
    var e = new Error(msg);
    e.__proto__ = search_engine_parse_error.prototype;
    return e;
}
search_engine_parse_error.prototype.__proto__ = Error.prototype;

function search_engine() {
    this.urls = new string_hashmap();
}

function search_engine_url(type, method, template) {
    if (!method || !type || !template)
        throw search_engine_parse_error("Missing method, type, or template for search engine URL");
    method = method.toUpperCase();
    type = type.toUpperCase();
    if (method != "GET" && method != "POST")
        throw search_engine_parse_error("Invalid method");
    var template_uri = make_uri(template);
    switch (template_uri.scheme) {
    case "http":
    case "https":
        break;
    default:
        throw search_engine_parse_error("URL template has invalid scheme.");
        break;
    }
    this.type = type;
    this.method = method;
    this.template = template;
    this.params =  [];
}
search_engine_url.prototype.add_param = function search_engine_url__add_param(name, value) {
    this.params.push({name: name, value: value});
}

function load_search_engines_in_directory(dir) {
    var files = null;
    try {
        files = dir.directoryEntries.QueryInterface(Ci.nsIDirectoryEnumerator);

        while (files.hasMoreElements()) {
            var file = files.nextFile;

            if (!file.isFile())
                continue;

            try {
                load_search_engine_from_file(file);
            } catch (e) {
                dumpln("WARNING: Failed to load search engine from file: " + file.path);
                dump_error(e);
            }
        }
    } catch (e) {
        // FIXME: maybe have a better error message
        dump_error(e);
    } finally {
        if (files)
            files.close();
    }
}

function load_search_engine_from_file(file) {
    var file_istream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
    file_istream.init(file, MODE_RDONLY, 0644, false);
    var dom_parser = Cc["@mozilla.org/xmlextras/domparser;1"].createInstance(Ci.nsIDOMParser);
    var doc = dom_parser.parseFromStream(file_istream, "UTF-8", file.fileSize, "text/xml");

    var eng = parse_search_engine_from_dom_node(doc.documentElement);
    search_engines.put(file.leafName, eng);
}

// Supported OpenSearch parameters
// http://www.opensearch.org/Specifications/OpenSearch/1.1#OpenSearch_URL_template_syntax
const OPENSEARCH_PARAM_USER_DEFINED    = /\{searchTerms\??\}/g;
const OPENSEARCH_PARAM_INPUT_ENCODING  = /\{inputEncoding\??\}/g;
const OPENSEARCH_PARAM_LANGUAGE        = /\{language\??\}/g;
const OPENSEARCH_PARAM_OUTPUT_ENCODING = /\{outputEncoding\??\}/g;

// Default values
const OPENSEARCH_PARAM_LANGUAGE_DEF         = "*";
const OPENSEARCH_PARAM_OUTPUT_ENCODING_DEF  = "UTF-8";
const OPENSEARCH_PARAM_INPUT_ENCODING_DEF   = "UTF-8";

// "Unsupported" OpenSearch parameters. For example, we don't support
// page-based results, so if the engine requires that we send the "page index"
// parameter, we'll always send "1".
const OPENSEARCH_PARAM_COUNT        = /\{count\??\}/g;
const OPENSEARCH_PARAM_START_INDEX  = /\{startIndex\??\}/g;
const OPENSEARCH_PARAM_START_PAGE   = /\{startPage\??\}/g;

// Default values
const OPENSEARCH_PARAM_COUNT_DEF        = "20"; // 20 results
const OPENSEARCH_PARAM_START_INDEX_DEF  = "1";  // start at 1st result
const OPENSEARCH_PARAM_START_PAGE_DEF   = "1";  // 1st page

// Optional parameter
const OPENSEARCH_PARAM_OPTIONAL     = /\{(?:\w+:)?\w+\?\}/g;

// A array of arrays containing parameters that we don't fully support, and
// their default values. We will only send values for these parameters if
// required, since our values are just really arbitrary "guesses" that should
// give us the output we want.
var OPENSEARCH_UNSUPPORTED_PARAMS = [
  [OPENSEARCH_PARAM_COUNT, OPENSEARCH_PARAM_COUNT_DEF],
  [OPENSEARCH_PARAM_START_INDEX, OPENSEARCH_PARAM_START_INDEX_DEF],
  [OPENSEARCH_PARAM_START_PAGE, OPENSEARCH_PARAM_START_PAGE_DEF]
];


function parse_search_engine_from_dom_node(node) {
    var eng = new search_engine();
    eng.query_charset = OPENSEARCH_PARAM_INPUT_ENCODING_DEF;

    for each (let child in node.childNodes) {
        switch (child.localName) {
        case "ShortName":
            eng.name = child.textContent;
            break;
        case "Description":
            eng.description = child.textContent;
            break;
        case "Url":
            try {
                let type = child.getAttribute("type");
                let method = child.getAttribute("method") || "GET";
                let template = child.getAttribute("template");

                let engine_url = new search_engine_url(type, method, template);
                for each (let p in child.childNodes) {
                    if (p.localName == "Param") {
                        let name = p.getAttribute("name");
                        let value = p.getAttribute("value");
                        if (name && value)
                            engine_url.add_param(name, value);
                    }
                }
                eng.urls.put(type, engine_url);
            } catch (e) {
                // Skip this element if parsing fails
            }
            break;
        case "InputEncoding":
            eng.query_charset = child.textContent.toUpperCase();
            break;
        }
    }
    return eng;
}

search_engine.prototype.supports_response_type = function (type) {
    return this.urls.contains(type);
};

/**
 * Returns null if the result mime_type isn't supported.  The string
 * search_terms will be escaped by this function.
 */
search_engine.prototype.get_query_load_spec = function search_engine__get_query_load_spec(search_terms, type) {
    if (type == null)
        type = "text/html";
    var url = this.urls.get(type);
    if (!url)
        return null;
    search_terms = encodeURIComponent(search_terms);
    var eng = this;

    function substitute(value) {
        // Insert the OpenSearch parameters we're confident about
        value = value.replace(OPENSEARCH_PARAM_USER_DEFINED, search_terms);
        value = value.replace(OPENSEARCH_PARAM_INPUT_ENCODING, eng.query_charset);
        value = value.replace(OPENSEARCH_PARAM_LANGUAGE,
                              get_locale() || OPENSEARCH_PARAM_LANGUAGE_DEF);
        value = value.replace(OPENSEARCH_PARAM_OUTPUT_ENCODING,
                              OPENSEARCH_PARAM_OUTPUT_ENCODING_DEF);

        // Replace any optional parameters
        value = value.replace(OPENSEARCH_PARAM_OPTIONAL, "");

        // Insert any remaining required params with our default values
        for (let i = 0; i < OPENSEARCH_UNSUPPORTED_PARAMS.length; ++i) {
            value = value.replace(OPENSEARCH_UNSUPPORTED_PARAMS[i][0],
                                  OPENSEARCH_UNSUPPORTED_PARAMS[i][1]);
        }

        return value;
    }

    var url_string = substitute(url.template);

    var data = url.params.map(function (p) (p.name + "=" + substitute(p.value))).join("&");

    if (url.method == "GET") {
        if (data.length > 0) {
            if (url_string.indexOf("?") == -1)
                url_string += "?";
            else
                url_string += "&";
            url_string += data;
        }
        return load_spec({uri: url_string});
    } else {
        return load_spec({uri: url_string, raw_post_data: data,
                               request_mime_type: "application/x-www-form-urlencoded"});
    }
};

search_engine.prototype.__defineGetter__("completer", function () {
    const response_type_json = "application/x-suggestions+json";
    const response_type_xml = "application/x-suggestions+xml";
    const json = ("@mozilla.org/dom/json;1" in Cc) &&
        Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
    var eng = this;
    if (this.supports_response_type(response_type_xml)) {
        return function (input, pos, conservative) {
            if (pos == 0 && conservative)
                yield co_return(undefined);
            let str = input.substring(0,pos);
            try {
                let lspec = eng.get_query_load_spec(str, response_type_xml);
                let result = yield send_http_request(lspec);
                let doc = result.responseXML;
                let data = [];
                if (doc) {
                    let elems = doc.getElementsByTagName("CompleteSuggestion");
                    for (let i = 0; i < elems.length; ++i) {
                        let node = elems[i];
                        let name = node.firstChild.getAttribute("data");
                        let desc = node.lastChild.getAttribute("int");
                        if (name && desc)
                            data.push([name,desc]);
                    }
                    delete doc;
                    delete elem;
                    delete result;
                    delete lspec;
                    let c = { count: data.length,
                              get_string: function (i) data[i][0],
                              get_description: function (i) data[i][1] + " results",
                              get_input_state: function (i) [data[i][0]]
                            };
                    yield co_return(c);
                }
            } catch (e) {
                yield co_return(null);
            }
        };
    } else if (json && this.supports_response_type(response_type_json)) {
        return function (input, pos, conservative) {
            if (pos == 0 && conservative)
                yield co_return(undefined);
            let str = input.substring(0,pos);
            try {
                let lspec = eng.get_query_load_spec(str, response_type_json);
                let result = yield send_http_request(lspec);
                let data = json.decode(result.responseText);
                delete result;
                delete lspec;

                if (!(data instanceof Array &&
                      data.length >= 2 &&
                      typeof(data[0]) == "string" &&
                      data[0] == str &&
                      data[1] instanceof Array &&
                      (data[2] == null || (data[2] instanceof Array))))
                    yield co_return(null);
                if (data[2] && data[2].length != data[1].length)
                    data[2] = null;
                let c = { count: data[1].length,
                          get_string: function (i) String(data[1][i]),
                          get_description: (data[2] != null ? (function (i) String(data[2][i])) : null),
                          get_input_state: function (i) [String(data[1][i])]
                        };
                yield co_return(c);
            } catch (e) {
                yield co_return(null);
            }
        };
    } else {
        return null;
    }
});

/**
 * Guess the url of a home page to correspond with the search engine.
 * Take the text/html url for the search engine, trim off the path and
 * any "search." prefix on the domain.
 * This works for all the provided search engines.
 */
function search_engine_get_homepage(search_engine) {
    var url = search_engine.urls.get("text/html");
    if (!url)
        return null;
    url = url_path_trim(url.template);
    url = url.replace("//search.", "//");
    return url;
}

// Load search engines from default directories
{
    let dir = file_locator_service.get("CurProcD", Ci.nsIFile);
    dir.append("search-engines");
    if (dir.exists() && dir.isDirectory())
        load_search_engines_in_directory(dir);

    dir = file_locator_service.get("ProfD", Ci.nsIFile);
    dir.append("search-engines");
    if (dir.exists() && dir.isDirectory())
        load_search_engines_in_directory(dir);
}

define_keywords("$alternative");
function define_search_engine_webjump(search_engine_name, key) {
    keywords(arguments);
    var eng = search_engines.get(search_engine_name);
    let alternative = arguments.$alternative;

    if (key == null)
        key = search_engine_name;
    if (alternative == null)
        alternative = search_engine_get_homepage(eng);

    define_webjump(key,
                   function (arg) {
                       return eng.get_query_load_spec(arg);
                   },
                   $alternative = alternative,
                   $description = eng.description,
                   $completer = eng.completer);
}

define_search_engine_webjump("google.xml", "google");
define_search_engine_webjump("mozilla-bugzilla.xml", "bugzilla");
define_search_engine_webjump("wikipedia.xml", "wikipedia");
define_search_engine_webjump("wiktionary.xml", "wiktionary");
define_search_engine_webjump("answers.xml", "answers");
define_search_engine_webjump("yahoo.xml", "yahoo");
define_search_engine_webjump("creativecommons.xml", "creativecommons");
define_search_engine_webjump("eBay.xml", "ebay");

provide("search-engine");
