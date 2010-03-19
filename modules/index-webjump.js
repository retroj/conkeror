/**
 * (C) Copyright 2009 David Kettler
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
 *
 * Construct a webjump (with completer) to visit URLs referenced from
 * an index page.  An xpath expression is used to extract the indexed
 * URLs.  A specialized form is also provided for gitweb summary
 * pages.
**/

in_module(null);

require("webjump.js");

/* Objects with completion data for index webjumps. */
index_webjumps = {};

define_variable("index_webjumps_directory", null,
                "A directory (instance of nsILocalFile) for storing the " +
                "index files corresponding to index webjumps; the index " +
                "data can be downloaded from the index URL using " +
                "webjump-get-index.  " +
                "If the index file is available for an index webjump then " +
                "the webjump will provide completions for the indexed URLs.");

define_variable("index_xpath_webjump_tidy_command",
                "tidy -asxhtml -wrap 0  -numeric --clean yes" +
                " -modify -quiet --show-warnings no",
                "A command to run on the downloaded index.  The xulrunner " +
                "parser is quite fussy and specifically requires xhtml (or " +
                "other xml).  Running something like html tidy can avoid " +
                "parser problems.");

function index_webjump(key, url, file) {
    this.key = key;
    this.url = url;
    this.file = this.canonicalize_file(file);

    if (this.require_completions && !this.file)
        throw interactive_error("Index file not defined for " + this.key);
}
index_webjump.prototype = {
    constructor : index_webjump,

    mime_type : null,
    xpath_expr : null,
    make_completion : null,
    require_completions : false,
    completions : null,
    file_time : 0,
    tidy_command : null,

    /* Extract full completion list from index file. */
    extract_completions : function () {
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
        var cmpl = [], node, res;
        res = doc.evaluate(
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

    /* The guts of the completer. */
    internal_completer : function (input, pos, conservative) {
        if (pos == 0 && conservative)
            yield co_return(undefined);

        let require = this.require_completions;

        /* Update full completion list if necessary. */
        if (require && !this.file.exists())
            throw interactive_error("Index file missing for " + this.key);
        if (this.file.exists() &&
            this.file.lastModifiedTime > this.file_time) {
            this.file_time = this.file.lastModifiedTime;
            this.extract_completions();
        }
        if (require && !(this.completions && this.completions.length))
            throw interactive_error("No completions for " + this.key);
        if (!this.completions)
            yield co_return(null);

        /* Match completions against input. */
        let words = trim_whitespace(input.toLowerCase()).split(/\s+/);
        let data = this.completions.filter(function (x) {
            for (var i = 0; i < words.length; ++i)
                if (x[0].toLowerCase().indexOf(words[i]) == -1 &&
                    x[1].toLowerCase().indexOf(words[i]) == -1)
                    return false;
            return true;
        });

        let c = { count: data.length,
                  get_string: function (i) data[i][0],
                  get_description: function (i) data[i][1],
                  get_input_state: function (i) [data[i][0]],
                  get_match_required: function() require
                };
        yield co_return(c);
    },

    /* A completer suitable for supplying to define_webjump. */
    make_completer : function() {
        if (!this.file)
            return null;
        let jmp = this;
        return function (input, pos, conservative) {
            return jmp.internal_completer(input, pos, conservative);
        };
    },

    /* Fetch and save the index for later use with completion.
     * (buffer is used only to associate with the download) */
    get_index : function (buffer) {
        if (!this.file)
            throw interactive_error("Index file not defined for " + this.key);

        var info = save_uri(load_spec(this.url), this.file,
                            $buffer = buffer, $use_cache = false,
                            $temp_file = true);

        // Note: it would be better to run this before the temp file
        // is renamed; that requires support in save_uri.
        if (this.tidy_command)
            info.set_shell_command(this.tidy_command, index_webjumps_directory);
    },

    /* Try to make a suitable file object when the supplied file is a
     * string or null. */
    canonicalize_file : function (file) {
        if (typeof file == 'string')
            file = make_file(file);
        if (!file && index_webjumps_directory) {
            file = Cc["@mozilla.org/file/local;1"]
                .createInstance(Ci.nsILocalFile);
            file.initWithFile(index_webjumps_directory);
            file.appendRelativePath(this.key + ".index");
        }
        return file;
    }
}


function index_webjump_xhtml(key, url, file, xpath_expr) {
    index_webjump.call(this, key, url, file);
    this.xpath_expr = xpath_expr;
}
index_webjump_xhtml.prototype = {
    constructor : index_webjump_xhtml,

    require_completions : true,
    mime_type : "application/xhtml+xml",
    tidy_command : index_xpath_webjump_tidy_command,

    make_completion : function (node) {
        return [makeURLAbsolute(this.url, node.href), node.text];
    },

    make_handler : function () {
        let jmp = this;
        return function (term) {
            if (!(jmp.completions && jmp.completions.length))
                throw interactive_error("Completions required for " + this.key);
            return term;
        };
    },

    __proto__ : index_webjump.prototype
}


function index_webjump_gitweb(key, url, file) {
    index_webjump.call(this, key, url, file);
}
index_webjump_gitweb.prototype = {
    constructor : index_webjump_gitweb,

    mime_type : "text/xml",
    xpath_expr : '//outline[@type="rss"]',

    make_completion : function (node) {
        var name = node.getAttribute("text");
        return [name.replace(/\.git$/, ""), ""];
    },

    __proto__ : index_webjump.prototype
}


interactive("webjump-get-index",
            "Fetch and save the index URL corresponding to an index " +
            "webjump.  It will then be available to the completer.",
            function (I) {
                var completions = [];
                for (let i in index_webjumps)
                    completions.push(i);
                completions.sort();

                var key = yield I.minibuffer.read(
                    $prompt = "Fetch index for index webjump:",
                    $history = "webjump",
                    $completer =
                        all_word_completer($completions = completions),
                    $match_required = true);

                var jmp = index_webjumps[key];
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
define_keywords("$alternative", "$index_file", "$description");
function define_xpath_webjump(key, index_url, xpath_expr) {
    keywords(arguments);
    let alternative = arguments.$alternative || index_url;

    var jmp = new index_webjump_xhtml(key, index_url, arguments.$index_file,
                                      xpath_expr);
    index_webjumps[key] = jmp;

    define_webjump(key, jmp.make_handler(),
                   $completer = jmp.make_completer(),
                   $alternative = alternative,
                   $description = arguments.$description);
}

/**
 * Modify the xpath for an index webjump and show the resulting
 * completions.  Useful for figuring out an appropriate xpath.  Either
 * run using mozrepl or eval in the browser with the dump parameter
 * set.
 */
function index_webjump_try_xpath(key, xpath_expr, dump) {
    jmp = index_webjumps[key];
    if (xpath_expr)
        jmp.xpath_expr = xpath_expr;
    jmp.extract_completions();
    if (dump)
        dumpln(dump_obj(jmp.completions,
                        "Completions for index webjump " + key));
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
define_keywords("$default", "$alternative", "$opml_file", "$description");
function define_gitweb_summary_webjump(key, base_url) {
    keywords(arguments);
    let alternative = arguments.$alternative;
    let gitweb_url = base_url + "/gitweb.cgi";
    let summary_url = gitweb_url + "?p=%s.git;a=summary";
    let opml_url = gitweb_url + "?a=opml";

    if (arguments.$default)
        alternative = summary_url.replace("%s", arguments.$default);
    if (!alternative)
        alternative = gitweb_url;

    var jmp = new index_webjump_gitweb(key, opml_url, arguments.$opml_file);
    index_webjumps[key] = jmp;

    define_webjump(key, summary_url,
                   $completer = jmp.make_completer(),
                   $alternative = alternative,
                   $description = arguments.$description);
}

provide("index-webjump");
