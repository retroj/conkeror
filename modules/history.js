/**
 * (C) Copyright 2008 Eli Naeher
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 * (C) Copyright 2011-2012 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

function history_completions (completer, root) {
    completions.call(this, completer);
    this.root = root;
    this.root.containerOpen = true;
    this.count = this.root.childCount;
}
history_completions.prototype = {
    constructor: history_completions,
    __proto__: completions.prototype,
    toString: function () "#<history_completions>",
    root: null,
    destroy: function () { this.root.containerOpen = false; },
    get_string: function (i) this.root.getChild(i).uri,
    get_description: function (i) this.root.getChild(i).title,
    get_value: function (i) this.root.getChild(i),
};


define_keywords("$use_history", "$use_bookmarks", "$sort_order");
function history_completer () {
    keywords(arguments,
             $use_history = false,
             $use_bookmarks = false,
             $sort_order = "visitcount_descending");
    completer.call(this);
    this.use_history = arguments.$use_history;
    this.use_bookmarks = arguments.$use_bookmarks;
    this.sort_order = arguments.$sort_order;
}
history_completer.prototype = {
    constructor: history_completer,
    __proto__: completer.prototype,
    toString: function () "#<history_completer>",
    use_history: false,
    use_bookmarks: false,
    sort_order: null,
    complete: function (input, pos) {
        var query = nav_history_service.getNewQuery();
        query.searchTerms = input;
        if (! this.use_history)
            query.onlyBookmarked = true;
        var options = nav_history_service.getNewQueryOptions();
        options.sortingMode = Ci.nsINavHistoryQueryOptions[
            "SORT_BY_" + this.sort_order.toUpperCase()];
        if (this.use_bookmarks && ! this.use_history)
            options.queryType = options.QUERY_TYPE_BOOKMARKS;
        else if (this.use_history && ! this.use_bookmarks)
            options.queryType = options.QUERY_TYPE_HISTORY;
        else
            options.queryType = options.QUERY_TYPE_UNIFIED; //XXX: not implemented yet
        var root = nav_history_service.executeQuery(query, options).root;
        return new history_completions(this, root);
    }
};

define_keywords("$use_webjumps");
function url_completer () {
    keywords(arguments, $sort_order = "visitcount_descending");
    var sort_order = arguments.$sort_order;
    var completers = [];
    completers.push(new file_path_completer());
    if (arguments.$use_webjumps)
        completers.push(new webjump_completer());
    // Do queries separately (which can lead to duplicates).  The queries
    // can be combined when QUERY_TYPE_UNIFIED is implemented.
    if (arguments.$use_bookmarks)
        completers.push(new history_completer($use_bookmarks = true,
                                              $sort_order = sort_order));
    if (arguments.$use_history)
        completers.push(new history_completer($use_history = true,
                                              $sort_order = sort_order));
    merged_completer.call(this, completers);
}
url_completer.prototype = {
    constructor: url_completer,
    __proto__: merged_completer.prototype,
    toString: function () "#<url_completer>"
};


function add_bookmark (url, title) {
    nav_bookmarks_service.insertBookmark(nav_bookmarks_service.unfiledBookmarksFolder,
                                         make_uri(url), -1, title);
}

// See
// http://mxr.mozilla.org/mozilla-central/source/browser/base/content/sanitize.js
// for the Firefox implementation for clearing various history information.

function clear_form_history () {
    var FormHistory = Cu.import("resource://gre/modules/FormHistory.jsm", null).FormHistory;
    // This is asynchronous, but we don't care about waiting for it to finish.
    FormHistory.update( { op: "remove" } );
}
interactive("clear-form-history",
    "Permanently delete all form autocomplete history.",
    function (I) {
        clear_form_history();
        I.minibuffer.message("Form history cleared.");
    });

function clear_history () {
    var PlacesUtils = Cu.import("resource://gre/modules/PlacesUtils.jsm").PlacesUtils;
    PlacesUtils.history.removeAllPages();
}
interactive("clear-history",
    "Permanently delete all location history.",
    function (I) {
        clear_history();
        I.minibuffer.message("Location history cleared.");
    });


/**
 * history_clean takes a predicate or an array of predicates, iterates
 * through the browser history, and removes all items for which any of the
 * given predicates return true.  Predicates are called with three
 * arguments: string URI, age in days of the entry, and access count of
 * the entry.  Age is a decimal number, so smaller divisions that days can
 * be obtained by dividing appropriately.
 *
 * It accepts the keywords $dry_run and $verbose.  When $dry_run is given,
 * entries will not be deleted.  When $verbose is given, overall and
 * itemized deletion counts will be reported in the terminal.
 */
define_keywords("$dry_run", "$verbose");
function history_clean (predicates) {
    keywords(arguments, $verbose = false, $dry_run = false);
    predicates = make_array(predicates);
    var npred = predicates.length;
    var predhits = [];
    var verbose = arguments.$verbose;
    var dry_run = arguments.$dry_run;
    var query = nav_history_service.getNewQuery();
    query.searchTerms = "";
    var options = nav_history_service.getNewQueryOptions();
    options.queryType = options.QUERY_TYPE_HISTORY;
    options.includeHidden = true;
    var root = nav_history_service.executeQuery(query, options).root;
    root.containerOpen = true;
    var count = root.childCount;
    var now = Date.now() / 86400000; // now in days
    var history = Cc["@mozilla.org/browser/nav-history-service;1"]
        .getService(Ci.nsIBrowserHistory);
    var to_remove = [];
    var remove_count = 0;
    outer:
    for (var i = count - 1; i >= 0; --i) {
        var o = root.getChild(i); // nsINavHistoryResultNode
        var age = now - o.time / 86400000000; // age in days
        for (var j = 0; j < npred; ++j) {
            var p = predicates[j];
            if (p(o.uri, age, o.accessCount)) {
                predhits[j] = (predhits[j] || 0) + 1;
                to_remove.push(make_uri(o.uri));
                remove_count++;
                continue outer;
            }
        }
    }
    if (! dry_run && remove_count > 0)
        history.removePages(to_remove, remove_count);
    if (verbose) {
        dumpln("[history_clean] "+
               (dry_run ? "(DRY_RUN) " : "")+
               "count: "+count+" -> "+
               (count - predhits.reduce(function (a, b) a + b, 0)));
        for (j = 0; j < npred; ++j) {
            var name = predicates[j].name;
            if (! name)
                name = pretty_print_function(predicates[j]);
            var hits = predhits[j] || 0;
            dumpln("[history_clean] " + name + ": " + hits);
        }
    }
}


provide("history");
