

const nav_history_service = Cc["@mozilla.org/browser/nav-history-service;1"]
    .getService(Ci.nsINavHistoryService);

define_keywords("$use_webjumps", "$use_history", "$use_bookmarks");
function url_completer() {
    keywords(arguments);
    var use_webjumps = arguments.$use_webjumps;
    var use_history = arguments.$use_history;
    var use_bookmarks = arguments.$use_bookmarks;
    if (!use_webjumps && !use_history && !use_bookmarks)
        return null;
    var webjump_completer = null;
    if (use_webjumps)
        webjump_completer = prefix_completer(
            $completions = function(visitor) {
                for (var i in gWebJumpLocations)
                    visitor([i,gWebJumpLocations[i]]);
            },
            $get_string = function (x) x[0] + " ",
            $get_description = function (x) "");

    return function (input, pos, conservative) {
        /* FIXME: Use some more general mechanism for combining completion sources */
        var webjump_count = 0;
        var webjump_results = null;
        if (use_webjumps) {
            /* Prefix completion of web jumps */
            webjump_results = webjump_completer(input, pos, conservative);
            if (!use_bookmarks && !use_history)
                return webjump_results;
            webjump_count = webjump_results.count;
        }
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
        return {count: webjump_count + history_count,
                get_string: function (i) {
                    if (i < webjump_count)
                        return webjump_results.get_string(i);
                    return root.getChild(i - webjump_count).uri;
                },
                get_description: function (i) {
                    if (i < webjump_count)
                        return webjump_results.get_description(i);
                    return root.getChild(i - webjump_count).title;
                },
                apply: function (i, m) {
                    if (i < webjump_count)
                        webjump_results.apply(i, m);
                    else
                        apply_completion_string(root.getChild(i - webjump_count).uri, m);
                },
                destroy: function () { root.containerOpen = false; }
               };
    };
}

const nav_bookmarks_service = Cc["@mozilla.org/browser/nav-bookmarks-service;1"].getService(Ci.nsINavBookmarksService);

function add_bookmark(url, title) {
    nav_bookmarks_service.insertBookmark(nav_bookmarks_service.unfiledBookmarksFolder,
                                         makeURL(url), -1, title);
}

function get_element_bookmark_info(elem) {
    var uri, title;
    var doc = null;
    if (elem instanceof Ci.nsIDOMWindow)
        doc = elem.document;
    else if (elem instanceof Ci.nsIDOMHTMLFrameElement || Ci.nsIDOMHTMLIFrameElement)
        doc = elem.contentDocument;
    else if (elem instanceof Ci.nsIDOMHTMLAnchorElement) {
        uri = elem.getAttribute("href");
        let t = elem.getAttribute("title");
        if (t.length > 0)
            title = t;
        else
            title = elem.textContent;
    } else {
        throw interactive_error("Invalid element");
    }
    if (doc != null) {
        uri = doc.location.href;
        title = doc.title;
    }
    return [uri, title];
}
