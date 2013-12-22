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

provide("history");
