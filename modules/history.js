/**
 * (C) Copyright 2008 Eli Naeher
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 * (C) Copyright 2011 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

define_keywords("$use_history", "$use_bookmarks", "$require_match",
                "$sort_order");
function history_completer () {
    keywords(arguments, $sort_order = "visitcount_descending");
    var use_history = arguments.$use_history;
    var use_bookmarks = arguments.$use_bookmarks;
    let require_match = arguments.$require_match;
    var sort_order = Ci.nsINavHistoryQueryOptions[
        "SORT_BY_" + arguments.$sort_order.toUpperCase()];
    return function (input, pos, conservative) {
        if (conservative && input.length == 0)
            return null;
        var query = nav_history_service.getNewQuery();
        query.searchTerms = input;
        if (!use_history)
            query.onlyBookmarked = true;
        var options = nav_history_service.getNewQueryOptions();
        options.sortingMode = sort_order;
        if (use_bookmarks && !use_history)
            options.queryType = options.QUERY_TYPE_BOOKMARKS;
        else if (use_history && !use_bookmarks)
            options.queryType = options.QUERY_TYPE_HISTORY;
        else
            options.queryType = options.QUERY_TYPE_UNIFIED; //XXX: not implemented yet
        var root = nav_history_service.executeQuery(query, options).root;
        root.containerOpen = true;
        var history_count = root.childCount;
        return {count: history_count,
                get_string: function (i) root.getChild(i).uri,
                get_description: function (i) root.getChild(i).title,
                get_input_state: function (i) [root.getChild(i).uri],
                destroy: function () { root.containerOpen = false; },
                get_require_match: function() require_match
               };
    }
}

define_keywords("$use_webjumps");
function url_completer () {
    keywords(arguments, $sort_order = "visitcount_descending");
    var use_webjumps = arguments.$use_webjumps;
    var use_history = arguments.$use_history;
    var use_bookmarks = arguments.$use_bookmarks;
    var sort_order = arguments.$sort_order;
    var completers = [];
    completers.push(file_path_completer());
    if (use_webjumps)
        completers.push(webjump_completer());
    // Do queries separately (which can lead to duplicates).  The queries
    // can be combined when QUERY_TYPE_UNIFIED is implemented.
    if (use_bookmarks)
        completers.push(history_completer($use_bookmarks = true,
                                          $sort_order = sort_order));
    if (use_history)
        completers.push(history_completer($use_history = true,
                                          $sort_order = sort_order));
    return merge_completers(completers);
}


function add_bookmark (url, title) {
    nav_bookmarks_service.insertBookmark(nav_bookmarks_service.unfiledBookmarksFolder,
                                         make_uri(url), -1, title);
}

provide("history");
