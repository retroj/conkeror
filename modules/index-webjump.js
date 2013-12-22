/**
 * (C) Copyright 2009 David Kettler
 * (C) Copyright 2012 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
 *
 * Construct a webjump (with completer) to visit URLs referenced from
 * an index page.  An xpath expression is used to extract the indexed
 * URLs.  A specialized form is also provided for gitweb summary
 * pages.
**/

require("webjump.js");

define_variable("index_webjumps_directory", null,
    "A directory (instance of nsILocalFile) for storing the " +
    "index files corresponding to index webjumps; the index " +
    "data can be downloaded from the index URL using " +
    "webjump-get-index.  " +
    "If the index file is available for an index webjump then " +
    "the webjump will provide completions for the indexed URLs.");

define_variable("index_xpath_webjump_tidy_command",
                "tidy -asxhtml -wrap 0 -numeric --clean yes" +
                " -modify -quiet --show-warnings no",
    "A command to run on the downloaded index.  The xulrunner " +
    "parser is quite fussy and specifically requires xhtml (or " +
    "other xml).  Running something like html tidy can avoid " +
    "parser problems.");

/**
 * Try to make a suitable file object when the supplied file is a string
 * or null.
 */
function index_webjump_canonicalize_file (file, webjump_name) {
    if (typeof file == "string")
        return make_file(file);
    if (! file && index_webjumps_directory) {
        file = index_webjumps_directory.clone()
            .QueryInterface(Ci.nsILocalFile);
        file.appendRelativePath(webjump_name + ".index");
    }
    return file;
}


function index_webjump_completions (completer, data, descriptions) {
    completions.call(this, completer, data);
    this.descriptions = descriptions;
}
index_webjump_completions.prototype = {
    constructor: index_webjump_completions,
    __proto__: completions.prototype,
    toString: function () "#<index_webjump_completions>",
    descriptions: null,
    get_description: function (i) this.descriptions[i]
};


function index_webjump_completer (webjump) {
    completer.call(this);
    this.webjump = webjump;
}
index_webjump_completer.prototype = {
    constructor: index_webjump_completer,
    __proto__: completer.prototype,
    toString: function () "#<index_webjump_completer>",
    complete: function (input, pos) {
        var require = this.webjump.require_match;

        /* Update full completion list if necessary. */
        if (require && ! this.webjump.file.exists())
            throw interactive_error("Index file missing for " + this.webjump.name);
        if (this.webjump.file.exists() &&
            this.webjump.file.lastModifiedTime > this.webjump.file_time)
        {
            this.webjump.file_time = this.webjump.file.lastModifiedTime;
            this.webjump.extract_completions();
        }
        if (require && !(this.webjump.completions && this.webjump.completions.length))
            throw interactive_error("No completions for " + this.webjump.name);
        if (! this.webjump.completions)
            yield co_return(null);

        /* Match completions against input. */
        var words = trim_whitespace(input.toLowerCase()).split(/\s+/);
        var data = this.webjump.completions.filter(function (x) {
            for (var i = 0; i < words.length; ++i) {
                if (x[0].toLowerCase().indexOf(words[i]) == -1 &&
                    x[1].toLowerCase().indexOf(words[i]) == -1)
                {
                    return false;
                }
            }
            return true;
        });
        var descriptions = data.map(second);
        data = data.map(first);
        yield co_return(new index_webjump_completions(this, data, descriptions));
    }
};


function index_webjump (name, url, file) {
    keywords(arguments);
    this.url = url;
    this.file = index_webjump_canonicalize_file(file, name);
    webjump.call(this, name, this.make_handler(),
                 $completer = this.make_completer(),
                 forward_keywords(arguments));
    if (this.require_match && ! this.file)
        throw interactive_error("Index file not defined for " + this.name);
}
index_webjump.prototype = {
    constructor: index_webjump,
    __proto__: webjump.prototype,
    toString: function () "#<index_webjump>",
    mime_type: null,
    xpath_expr: null,
    make_completion: null,
    completions: null,
    file_time: 0,
    tidy_command: null,
    make_handler: function () {
        throw new Error("Subclasses of index_webjump must implement make_handler.");
    },

    /* Extract full completion list from index file. */
    extract_completions: function () {
        /* Parse the index file. */
        var stream = Cc["@mozilla.org/network/file-input-stream;1"]
            .createInstance(Ci.nsIFileInputStream);
        stream.init(this.file, MODE_RDONLY, 0644, false);
        var parser = Cc["@mozilla.org/xmlextras/domparser;1"]
            .createInstance(Ci.nsIDOMParser);
        // todo: catch parser errors
        var doc = parser.parseFromStream(stream, null,
                                         this.file.fileSize, this.mime_type);

        /* Extract the completion items. */
        var cmpl = [], node;
        var res = doc.evaluate(
            this.xpath_expr, doc, xpath_lookup_namespace,
            Ci.nsIDOMXPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
        while ((node = res.iterateNext()))
            cmpl.push(this.make_completion(node));

        cmpl.sort(function(a, b) {
            if (a[1] < b[1])  return -1;
            if (a[1] > b[1])  return 1;
            if (a[0] < b[0])  return -1;
            if (a[0] > b[0])  return 1;
            return 0;
        });

        this.completions = cmpl;
    },

    /* A completer suitable for supplying to define_webjump. */
    make_completer: function () {
        if (! this.file)
            return null;
        return new index_webjump_completer(this);
    },

    /* Fetch and save the index for later use with completion.
     * (buffer is used only to associate with the download) */
    get_index: function (buffer) {
        if (! this.file)
            throw interactive_error("Index file not defined for " + this.name);

        var info = save_uri(load_spec(this.url), this.file,
                            $buffer = buffer, $use_cache = false,
                            $temp_file = true);

        // Note: it would be better to run this before the temp file
        // is renamed; that requires support in save_uri.
        if (this.tidy_command)
            info.set_shell_command(this.tidy_command, index_webjumps_directory);
    }
};


function index_webjump_xhtml (name, url, file, xpath_expr) {
    keywords(arguments);
    index_webjump.call(this, name, url, file,
                       $require_match = true,
                       forward_keywords(arguments));
    this.xpath_expr = xpath_expr;
}
index_webjump_xhtml.prototype = {
    constructor: index_webjump_xhtml,
    __proto__: index_webjump.prototype,
    toString: function () "#<index_webjump_xhtml>",
    mime_type: "application/xhtml+xml",
    get tidy_command () index_xpath_webjump_tidy_command,

    make_completion: function (node) {
        return [makeURLAbsolute(this.url, node.href), node.text];
    },

    make_handler: function () {
        let jmp = this;
        return function (term) {
            if (!(jmp.completions && jmp.completions.length))
                throw interactive_error("Completions required for " + this.name);
            return term;
        };
    }
};


define_keywords("$default");
function index_webjump_gitweb (name, base_url, file) {
    keywords(arguments);
    var alternative = arguments.$alternative;
    var gitweb_url = base_url + "/gitweb.cgi";
    this.summary_url = gitweb_url + "?p=%s.git;a=summary";
    var opml_url = gitweb_url + "?a=opml";
    if (arguments.$default)
        alternative = this.summary_url.replace("%s", arguments.$default);
    if (! alternative)
        alternative = gitweb_url;
    index_webjump.call(this, name, opml_url, file,
                       $alternative = alternative,
                       forward_keywords(arguments));
}
index_webjump_gitweb.prototype = {
    constructor: index_webjump_gitweb,
    __proto__: index_webjump.prototype,
    toString: function () "#<index_webjump_gitweb>",
    summary_url: null,
    mime_type: "text/xml",
    xpath_expr: '//outline[@type="rss"]',
    make_completion: function (node) {
        var name = node.getAttribute("text");
        return [name.replace(/\.git$/, ""), ""];
    },
    make_handler: function () {
        return this.summary_url;
    }
};


interactive("webjump-get-index",
    "Fetch and save the index URL corresponding to an index " +
    "webjump.  It will then be available to the completer.",
    function (I) {
        var completions = [];
        for (let [name, w] in Iterator(webjumps)) {
            if (w instanceof index_webjump)
                completions.push(name);
        }
        completions.sort();
        var name = yield I.minibuffer.read(
            $prompt = "Fetch index for index webjump:",
            $history = "index-webjump",
            $completer = new all_word_completer(
                $completions = completions),
            $require_match = true);
        var jmp = webjumps[name];
        if (jmp)
            jmp.get_index(I.buffer);
    });

/**
 * Construct a webjump to visit URLs referenced from an index page.
 *
 * The index page must be able to be parsed as xhtml.  The anchor
 * nodes indexed are those that match the given xpath_expr.  Don't
 * forget to use xhtml: prefixes on the xpath steps.
 *
 * If an alternative is not specified then it is set to the index page.
 *
 * A completer is provided that uses the index page.  A local file for
 * the index must be specified either with $index_file or via
 * index_webjumps_directory.  The index must be manually downloaded;
 * eg. using webjump-get-index.  Each time the completer is used it
 * will check if the file has been updated and reload if necessary.
 * This kind of webjump is not useful without the completions.
 */
define_keywords("$index_file");
function define_xpath_webjump (name, index_url, xpath_expr) {
    keywords(arguments);
    var alternative = arguments.$alternative || index_url;
    var w = new index_webjump_xhtml(name, index_url,
                                    arguments.$index_file,
                                    xpath_expr,
                                    $alternative = alternative,
                                    forward_keywords(arguments));
    webjumps[w.name] = w;
}

/**
 * Modify the xpath for an index webjump and show the resulting
 * completions.  Useful for figuring out an appropriate xpath.  Either
 * run using mozrepl or eval in the browser with the dump parameter
 * set.
 */
function index_webjump_try_xpath (name, xpath_expr, dump) {
    var jmp = webjumps[name];
    if (!(jmp instanceof index_webjump))
        throw new Error(name + " is not an index_webjump");
    if (xpath_expr)
        jmp.xpath_expr = xpath_expr;
    jmp.extract_completions();
    if (dump)
        dumpln(dump_obj(jmp.completions,
                        "Completions for index webjump " + name));
    return jmp.completions;
}


/**
 * Construct a webjump to visit repository summary pages at a gitweb
 * server.
 *
 * If a repository name is supplied as $default then the alternative
 * url is set to that repository at the gitweb site.  If an
 * alternative is not specified by either $default or $alternative
 * then it is set to the repository list page of the gitweb site.
 *
 * A completer is provided that uses the list of repositories from the
 * OPML data on the gitweb server.  The completer is setup in the same
 * way as for define_xpath_webjump, but the webjump will work without
 * the completions.
 */
define_keywords("$opml_file");
function define_gitweb_summary_webjump (name, base_url) {
    keywords(arguments);
    var w = new index_webjump_gitweb(name, base_url, arguments.$opml_file,
                                     forward_keywords(arguments));
    webjumps[w.name] = w;
}

provide("index-webjump");
