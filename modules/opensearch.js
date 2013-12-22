/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 * (C) Copyright 2010,2012 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

// Supported OpenSearch parameters
// http://www.opensearch.org/Specifications/OpenSearch/1.1#OpenSearch_URL_template_syntax

require("webjump.js");


define_variable("opensearch_load_paths",
    [file_locator_service.get("ProfD", Ci.nsIFile),
     file_locator_service.get("CurProcD", Ci.nsIFile)]
    .map(function (x) x.append("search-engines") || x),
    "Paths to search for opensearch description files.  Default list "+
    "includes the subdirectory called 'search-engines' in your profile "+
    "directory and the Conkeror installation directory.");

const opensearch_response_type_json = "application/x-suggestions+json";
const opensearch_response_type_xml = "application/x-suggestions+xml";


function opensearch_parse_error (msg) {
    var e = new Error(msg);
    e.__proto__ = opensearch_parse_error.prototype;
    return e;
}
opensearch_parse_error.prototype.__proto__ = Error.prototype;


function opensearch_xml_completions (completer, data) {
    completions.call(this, completer, data);
}
opensearch_xml_completions.prototype = {
    constructor: opensearch_xml_completions,
    __proto__: completions.prototype,
    toString: function () "#<opensearch_xml_completions>",
    get_string: function (i) this.data[i][0],
    get_description: function (i) {
        if (this.data[i][1])
            return this.data[i][1] + " results";
        return "";
    }
};


function opensearch_json_completions (completer, data, descriptions) {
    completions.call(this, completer, data);
    this.descriptions = descriptions;
}
opensearch_json_completions.prototype = {
    constructor: opensearch_json_completions,
    __proto__: completions.prototype,
    toString: function () "#<opensearch_json_completions>",
    descriptions: null,
    get_string: function (i) String(this.data[i]),
    get_description: function (i) {
        if (this.descriptions)
            return String(this.descriptions[i]);
        return null;
    }
};


function opensearch_xml_completer (eng) {
    this.eng = eng;
}
opensearch_xml_completer.prototype = {
    constructor: opensearch_xml_completer,
    __proto__: completer.prototype,
    toString: function () "#<opensearch_xml_completer>",
    eng: null,
    complete: function (input, pos) {
        let str = input.substring(0, pos);
        try {
            let lspec = this.eng.get_query_load_spec(str, opensearch_response_type_xml);
            let result = yield send_http_request(lspec);
            let doc = result.responseXML;
            var narrowed = [];
            if (doc) {
                let elems = doc.getElementsByTagName("CompleteSuggestion");
                for (let i = 0; i < elems.length; ++i) {
                    let node = elems[i];
                    let name = node.firstChild.getAttribute("data");
                    let desc = node.lastChild.getAttribute("int");
                    if (name)
                        narrowed.push([name,desc]);
                }
                delete doc;
                delete elem;
                delete result;
                delete lspec;
                yield co_return(new opensearch_xml_completions(this, narrowed));
            }
        } catch (e) {
            yield co_return(null);
        }
    }
};


function opensearch_json_completer (eng) {
    this.eng = eng;
}
opensearch_json_completer.prototype = {
    constructor: opensearch_json_completer,
    __proto__: completer.prototype,
    toString: function () "#<opensearch_json_completer>",
    eng: null,
    complete: function (input, pos) {
        let str = input.substring(0,pos);
        try {
            let lspec = this.eng.get_query_load_spec(str, opensearch_response_type_json);
            let result = yield send_http_request(lspec);
            let data = JSON.parse(result.responseText);
            delete result;
            delete lspec;
            if (!(array_p(data) &&
                  data.length >= 2 &&
                  typeof data[0] == "string" &&
                  data[0] == str &&
                  array_p(data[1])))
                yield co_return(null);
            if (data[2] && array_p(data[2]) &&
                data[2].length == data[1].length)
            {
                var descriptions = data[2];
            }
            yield co_return(new opensearch_json_completions(this, data[1], descriptions));
        } catch (e) {
            yield co_return(null);
        }
    }
};


function opensearch_description () {
    this.urls = {};
}
opensearch_description.prototype = {
    constructor: opensearch_description,
    name: null,
    description: null,
    urls: null,
    query_charset: "UTF-8",

    supports_response_type: function (type) {
        return (type in this.urls);
    },

    /**
     * Returns null if the result mime_type isn't supported.  The string
     * search_terms will be escaped by this function.
     */
    get_query_load_spec: function (search_terms, type) {
        if (type == null)
            type = "text/html";
        var url = this.urls[type];
        if (!url)
            return null;
        search_terms = encodeURIComponent(search_terms);
        var eng = this;

        function substitute (value) {
            // Insert the OpenSearch parameters we're confident about
            value = value.replace(/\{searchTerms\??\}/g, search_terms);
            value = value.replace(/\{inputEncoding\??\}/g, eng.query_charset);
            value = value.replace(/\{language\??\}/g, get_locale() || "*");
            value = value.replace(/\{outputEncoding\??\}/g, "UTF-8");

            // Remove any optional parameters
            value = value.replace(/\{(?:\w+:)?\w+\?\}/g, "");

            // Insert any remaining required params with our default values
            value = value.replace(/\{count\??\}/g, "20");     // 20 results
            value = value.replace(/\{startIndex\??\}/g, "1"); // start at 1st result
            value = value.replace(/\{startPage\??\}/g, "1");  // 1st page

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
    },

    /**
     * Guess the url of a home page to correspond with the search engine.
     * Take the text/html url for the search engine, trim off the path and
     * any "search." prefix on the domain.
     * This works for all the provided search engines.
     */
    get_homepage: function () {
        var url = this.urls["text/html"];
        if (!url)
            return null;
        url = url_path_trim(url.template);
        url = url.replace("//search.", "//");
        return url;
    },

    get completer () {
        if (this.supports_response_type(opensearch_response_type_xml))
            return new opensearch_xml_completer(this);
        if (this.supports_response_type(opensearch_response_type_json))
            return new opensearch_json_completer(this);
        return null;
    }
};


function opensearch_url (type, method, template) {
    if (!method || !type || !template)
        throw opensearch_parse_error("Missing method, type, or template for search engine URL");
    method = method.toUpperCase();
    type = type.toUpperCase();
    if (method != "GET" && method != "POST")
        throw opensearch_parse_error("Invalid method");
    var template_uri = make_uri(template);
    switch (template_uri.scheme) {
    case "http":
    case "https":
        break;
    default:
        throw opensearch_parse_error("URL template has invalid scheme.");
        break;
    }
    this.type = type;
    this.method = method;
    this.template = template;
    this.params =  [];
}
opensearch_url.prototype = {
    constructor: opensearch_url,
    add_param: function (name, value) {
        this.params.push({name: name, value: value});
    }
};


function opensearch_parse (node) {
    var eng = new opensearch_description();
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
                let engine_url = new opensearch_url(type, method, template);
                for each (let p in child.childNodes) {
                    if (p.localName == "Param") {
                        let name = p.getAttribute("name");
                        let value = p.getAttribute("value");
                        if (name && value)
                            engine_url.add_param(name, value);
                    }
                }
                eng.urls[type] = engine_url;
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


function opensearch_read_file (file) {
    var file_istream = Cc["@mozilla.org/network/file-input-stream;1"]
        .createInstance(Ci.nsIFileInputStream);
    file_istream.init(file, MODE_RDONLY, 0644, false);
    var dom_parser = Cc["@mozilla.org/xmlextras/domparser;1"]
        .createInstance(Ci.nsIDOMParser);
    var doc = dom_parser.parseFromStream(file_istream, "UTF-8",
                                         file.fileSize, "text/xml");
    return opensearch_parse(doc.documentElement);
}


define_keywords("$alternative");
function define_opensearch_webjump (name, spec) {
    keywords(arguments);
    let alternative = arguments.$alternative;

    var path = null;
    if (spec instanceof Ci.nsIFile) 
        path = spec;
    else {
        for (i = 0, n = opensearch_load_paths.length; i < n; ++i) {
            path = make_file(opensearch_load_paths[i]).clone();
            path.append(spec);
            if (path.exists())
                break;
        }
    }
    if (! path || ! path.exists())
        throw new Error("Opensearch file not found.");

    var eng = opensearch_read_file(path);

    if (alternative == null)
        alternative = eng.get_homepage();

    define_webjump(name,
                   function (arg) {
                       return eng.get_query_load_spec(arg);
                   },
                   $alternative = alternative,
                   $doc = eng.description,
                   $completer = eng.completer);
}

define_opensearch_webjump("google", "google.xml");
define_opensearch_webjump("bugzilla", "mozilla-bugzilla.xml");
define_opensearch_webjump("wikipedia", "wikipedia.xml");
define_opensearch_webjump("wiktionary", "wiktionary.xml");
define_opensearch_webjump("answers", "answers.xml");
define_opensearch_webjump("yahoo", "yahoo.xml");
define_opensearch_webjump("creativecommons", "creativecommons.xml");
define_opensearch_webjump("ebay", "eBay.xml");
define_opensearch_webjump("duckduckgo", "duckduckgo.xml");

provide("opensearch");
