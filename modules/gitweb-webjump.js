/**
 * (C) Copyright 2009 David Kettler
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
 *
 * Construct a webjump (with completer) to visit repository summary
 * pages at a gitweb server.
**/

require("webjump.js");

/* OPML files for completion on webjumps. */
gitweb_webjumps_opml = {};

define_variable("gitweb_webjumps_opml_directory", null,
                "A directory for storing the OPML data corresponding to a " +
                "gitweb webjump; the data can be fetched using " +
                "gitweb-webjump-get-opml.  " +
                "If the data is available for a webjump then it will provide " +
                "completions for the available repositories.");


function parse_gitweb_completions_from_dom_node(doc) {
    let elems = doc.getElementsByTagName("outline");

    let completions = [];
    for (let i = 0; i < elems.length; ++i) {
        let node = elems[i];
        let type = node.getAttribute("type");
        let name = node.getAttribute("text");
        if (type == "rss" && name)
            completions.push(name.replace(/\.git$/, ""));
    }
    completions.sort();

    return completions;
}


function gitweb_webjump_get_completions_from_file(file) {
    var file_istream = Cc["@mozilla.org/network/file-input-stream;1"]
        .createInstance(Ci.nsIFileInputStream);
    file_istream.init(file, MODE_RDONLY, 0644, false);
    var dom_parser = Cc["@mozilla.org/xmlextras/domparser;1"]
        .createInstance(Ci.nsIDOMParser);
    var doc = dom_parser.parseFromStream(file_istream, "UTF-8",
                                         file.fileSize, "text/xml");

    return parse_gitweb_completions_from_dom_node(doc);
}


/**
 * A completer that gets the list of repositories from the gitweb
 * generated OPML.
 */
function gitweb_webjump_completer(opml_file) {
    let completions = null;
    let file_time = 0;

    return function (input, pos, conservative) {
        if (pos == 0 && conservative)
            yield co_return(undefined);
        let str = input.substring(0,pos);

        if (opml_file.exists() && opml_file.lastModifiedTime > file_time) {
            file_time = opml_file.lastModifiedTime;
            completions = gitweb_webjump_get_completions_from_file(opml_file);
        }
        if (!completions)
            yield co_return(null);

        let words = trim_whitespace(input.toLowerCase()).split(/\s+/);
        let data = completions.filter(function (x) {
            for (var i = 0; i < words.length; ++i)
                if (x.toLowerCase().indexOf(words[i]) == -1)
                    return false;
            return true;
        });

        let c = {count: data.length,
                 get_string: function (i) data[i],
                 get_description: function (i) data[i],
                 get_input_state: function (i) [data[i]]};
        yield co_return(c);
    };
}


/* buffer is used only to associate with the download */
define_keywords("$buffer");
function gitweb_webjump_get_opml(key) {
    keywords(arguments);
    let opml = gitweb_webjumps_opml[key];
    if (!opml)
        return null;
    save_uri(load_spec(opml.url), opml.file,
             $buffer = arguments.$buffer, $use_cache = false,
             $temp_file = true);
    return opml;
}

interactive("gitweb-webjump-get-opml",
            "Fetch the OPML data corresponding to a gitweb webjump from " +
            "the gitweb server and make it available to the gitweb webjump " +
            "completer.",
            function (I) {
                var completions = [];
                for (let i in gitweb_webjumps_opml)
                    completions.push(i);
                completions.sort();
                var key = yield I.minibuffer.read(
                    $prompt = "Get OPML for gitweb webjump:",
                    $history = "webjump",
                    $completer = all_word_completer($completions = completions),
                    $match_required = true);
                gitweb_webjump_get_opml(key, $buffer = I.buffer);
            });


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
 * OPML data on the gitweb server.  A local file for the OPML data
 * must be specified either with $opml_file or via
 * gitweb_webjumps_opml_directory.  The OPML data must be manually
 * downloaded; eg. using gitweb-webjump-get-opml.  Each time the
 * completer is used it will check if the file has been updated and
 * reload if necessary.
 *
 * A completer may instead be specified with $completer.
 */
define_keywords("$default", "$alternative", "$completer", "$opml_file");
function define_gitweb_summary_webjump(key, base_url) {
    keywords(arguments);
    let completer = arguments.$completer;
    let alternative = arguments.$alternative;
    let gitweb_url = base_url + "/gitweb.cgi";
    let summary_url = gitweb_url + "?p=%s.git;a=summary";
    let opml_url = gitweb_url + "?a=opml";

    let opml_file = arguments.$opml_file;
    if (typeof opml_file == 'string')
        opml_file = make_file(opml_file);
    if (!opml_file && gitweb_webjumps_opml_directory) {
        opml_file = Cc["@mozilla.org/file/local;1"]
            .createInstance(Ci.nsILocalFile);
        if (gitweb_webjumps_opml_directory instanceof Ci.nsILocalFile)
            opml_file.initWithFile(gitweb_webjumps_opml_directory);
        else
            opml_file.initWithPath(gitweb_webjumps_opml_directory);
        opml_file.appendRelativePath(key + ".opml");
    }

    if (!completer && opml_file) {
        completer = gitweb_webjump_completer(opml_file);
        gitweb_webjumps_opml[key] = {file: opml_file, url: opml_url};
    }
    if (arguments.$default)
        alternative = summary_url.replace("%s", arguments.$default);
    if (!alternative)
        alternative = gitweb_url;

    define_webjump(key, summary_url,
                   $completer = completer,
                   $alternative = alternative);
}
