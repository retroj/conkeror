/**
 * (C) Copyright 2008 Eli Naeher
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

define_keywords("$use_webjumps", "$use_history", "$use_bookmarks",
                "$match_required");
function history_completer () {
    keywords(arguments);
    var use_history = arguments.$use_history;
    var use_bookmarks = arguments.$use_bookmarks;
    let match_required = arguments.$match_required;
    return function (input, pos, conservative) {
        if (conservative && input.length == 0)
            return null;
        var query = nav_history_service.getNewQuery();
        query.searchTerms = input;
        if (!use_history)
            query.onlyBookmarked = true;
        var options = nav_history_service.getNewQueryOptions();
        options.sortingMode = options.SORT_BY_VISITCOUNT_DESCENDING;
        if (use_bookmarks && !use_history)
            options.queryType = options.QUERY_TYPE_BOOKMARKS;
        else if (use_history && !use_bookmarks)
            options.queryType = options.QUERY_TYPE_HISTORY;
        else
            options.queryType = options.QUERY_TYPE_UNIFIED; //WTF: not implemented yet?
        var root = nav_history_service.executeQuery(query, options).root;
        root.containerOpen = true;
        var history_count = root.childCount;
        return {count: history_count,
                get_string: function (i) root.getChild(i).uri,
                get_description: function (i) root.getChild(i).title,
                get_input_state: function (i) [root.getChild(i).uri],
                destroy: function () { root.containerOpen = false; },
                get_match_required: function() match_required
               };
    }
}

function url_completer() {
    keywords(arguments);
    var use_webjumps = arguments.$use_webjumps;
    var use_history = arguments.$use_history;
    var use_bookmarks = arguments.$use_bookmarks;
    var completers = [];
    completers.push(file_path_completer());
    if(use_webjumps) {
        completers.push(webjump_completer());
    }
    /* Do queries separately (which can lead to duplicates).  The
     * queries can be combined when QUERY_TYPE_UNIFIED is implemented. */
    if (use_bookmarks)
        completers.push(history_completer($use_bookmarks = true));
    if (use_history)
        completers.push(history_completer($use_history = true));
    return merge_completers(completers);
}


function add_bookmark(url, title) {
    nav_bookmarks_service.insertBookmark(nav_bookmarks_service.unfiledBookmarksFolder,
                                         make_uri(url), -1, title);
}

provide("history");
