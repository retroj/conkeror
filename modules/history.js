

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
                get_string: function (i) {
                    return root.getChild(i).uri;
                },
                get_description: function (i) {
                    return root.getChild(i).title;
                },
                apply: function (i, m) {
                    apply_completion_string(root.getChild(i).uri, m);
                },
                destroy: function () { root.containerOpen = false; }
               };
    }
}

function webjump_completer() {
    return prefix_completer(
            $completions = function(visitor) {
                for (var i in webjumps)
                    visitor([i,webjumps[i]]);
            },
            $get_string = function (x) x[0] + " ",
            $get_description = function (x) "");
}

function url_completer() {
    keywords(arguments);
    var use_webjumps = arguments.$use_webjumps;
    var use_history = arguments.$use_history;
    var use_bookmarks = arguments.$use_bookmarks;
    var completers = [];
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
