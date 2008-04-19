/**
 * (C) Copyright 2008 Eli Naeher
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

const nav_history_service = Cc["@mozilla.org/browser/nav-history-service;1"]
    .getService(Ci.nsINavHistoryService);

define_keywords("$use_webjumps", "$use_history", "$use_bookmarks");
function history_completer() {
    keywords(arguments)
    var use_history = arguments.$use_history;
    var use_bookmarks = arguments.$use_bookmarks;
    return function (input, pos, conservative) {
        if (conservative && input.length == 0)
            return null;
        var query = nav_history_service.getNewQuery();
        query.searchTerms = input;
        if (!use_history)
            query.onlyBookmarked = true;
        var options = nav_history_service.getNewQueryOptions();
        options.sortingMode = options.SORT_BY_VISITCOUNT_DESCENDING;
        var root = nav_history_service.executeQuery(query, options).root;
        root.containerOpen = true;
        var history_count = root.childCount;
        return {count: history_count,
                get_string: function (i) root.getChild(i).uri,
                get_description: function (i) root.getChild(i).title,
                get_input_state: function (i) [root.getChild(i).uri],
                destroy: function () { root.containerOpen = false; }
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
    if(use_history || use_bookmarks) {
        completers.push(history_completer($use_history = use_history,
                                          $use_bookmarks = use_bookmarks));
    }
    return merge_completers(completers);
}

const nav_bookmarks_service = Cc["@mozilla.org/browser/nav-bookmarks-service;1"].getService(Ci.nsINavBookmarksService);

function add_bookmark(url, title) {
    nav_bookmarks_service.insertBookmark(nav_bookmarks_service.unfiledBookmarksFolder,
                                         makeURL(url), -1, title);
}
