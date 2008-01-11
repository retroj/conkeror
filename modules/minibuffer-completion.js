require("minibuffer.js");


function apply_completion_string(str, m) {
    m._set_selection();
    m._input_text = str;
}

/**
 * Completions is either a visit function or an array.
 */
define_keywords("$completions", "$get_string", "$get_description", "$get_value");
function all_word_completer()
{
    keywords(arguments);
    var completions = arguments.$completions;
    var get_string = arguments.$get_string;
    var get_description = arguments.$get_description;
    var get_value = arguments.$get_value;
    var arr;
    if (typeof(completions) == "function")
    {
        arr = [];
        completions(function (x) { arr.push(x); });
    } else
        arr = completions;
    return function (input, pos, conservative) {
        if (input.length == 0 && conservative)
            return undefined;
        var words = input.toLowerCase().split(" ");
        var data = arr.filter(function (x) {
                var s = get_string(x);
                var d = get_description(x);
                for (var i = 0; i < words.length; ++i)
                {
                    if (s.toLowerCase().indexOf(words[i]) == -1 && d.toLowerCase().indexOf(words[i]) == -1)
                        return false;
                }
                return true;
            });
        return { data: data,
                 get_string: get_string,
                 get_description : get_description,
                 apply : function (x, m) { apply_completion_string(get_string(x), m); },
                 get_value : get_value
               };
    }
}

function get_common_prefix_length(a, b, len) {
    var lim;
    if (len != null && len < a.length)
        lim = len;
    else
        lim = a.length;
    if (b < lim)
        lim = b;
    var i;
    for (i = 0; i < lim && a[i] == b[i]; ++i);
    return i;
}

function apply_partial_completion(x, prefix_end, suffix_begin, orig_str, m) {
    if (suffix_begin < orig_str.length)  {
        if (orig_str[suffix_begin] == " ")
            suffix_begin++;
        m._input_text = orig_str.substring(0, prefix_end) + x + " " + orig_str.substring(suffix_begin);
        let sel = x.length + prefix_end + 1;
        m._set_selection(sel, sel);
    } else {
        m._input_text = orig_str.substring(0, prefix_end) + x;
        let sel = x.length + prefix_end;
        m._set_selection(sel, sel);
    }
}

function prefix_completer()
{
    keywords(arguments);
    var completions = arguments.$completions;
    var get_string = arguments.$get_string;
    var get_description = arguments.$get_description;
    var get_value = arguments.$get_value;
    var arr;
    if (typeof(completions) == "function")
    {
        arr = [];
        completions(function (x) { arr.push(x); });
    } else
        arr = completions.slice();
    arr.sort(function (a,b) {
            a = get_string(a);
            b = get_string(b);
            if (a < b)
                return -1;
            if (a > b)
                return 1;
            return 0;
        });
    return function (input, pos, conservative) {
        var common_prefix = null;
        if (pos == 0 && conservative)
            return undefined;
        var input_prefix = input.substring(0,pos);
        var data = arr.filter(function (x) {
                var s = get_string(x);
                return s.length >= pos && s.substring(0,pos) == input_prefix;
            });
        if (data.length > 0)
        {
            var a = get_string(data[0]);
            var b = get_string(data[data.length - 1]);
            var i = get_common_prefix_length(a, b);
            if (i > pos)
                common_prefix = a.substring(0,i);
        }
        return { data: data,
                get_string: get_string,
                get_description : get_description,
                apply : function (x, m) { apply_partial_completion(get_string(x), 0, pos, input, m); },
                get_value : get_value,
                common_prefix : common_prefix,
                apply_common_prefix : function (x, m) { apply_partial_completion(x, 0, pos, input, m); }
               };
    }
}

/* USER PREFERENCE
   completion_types controls what kinds of things are matched with minibuffer-completion
   when opening a URL (using, e.g., g or C-x f), and in what order they are matched.
   It should be an array consisting of one or zero each of "history", "webjumps", and
   "bookmarks". */
var completion_types = ["webjumps", "history", "bookmarks"];

// Both history and bookmarks can be searched using nsINavHistoryService, so the common
// code lives in this function.

function get_history_service_results (service, options, query) {
    var results = [];
    var result = service.executeQuery(query, options).root;
    result.containerOpen = true;
    for (var i = 0; i < result.childCount; i++) {
        var node = result.getChild(i);
        if (node.type == node.RESULT_TYPE_URI) {
            results.push ({ string: node.uri, description: node.title, value: node.uri });
        }
    }
    result.containerOpen = false;
    return results;
}

// Takes, as its argument, the user-defined completion_types argument defined above.
// Returns an all_word_completer. Called by I.url_or_webjump.

const nav_history_service = Cc["@mozilla.org/browser/nav-history-service;1"]
    .getService(Ci.nsINavHistoryService);

function get_navigation_completer (completer_type) {

    var options = nav_history_service.getNewQueryOptions();
    var query = nav_history_service.getNewQuery();

    options.sortingMode = options.SORT_BY_VISITCOUNT_DESCENDING;

    var completions = [];
    for (var type in completion_types) {
        if (completion_types[type] == "webjumps") {
            for (var jump in gWebJumpLocations) {
                completions.push ({ string: jump, description: "", value: gWebJumpLocations[jump] });
            }
        } else if (completion_types[type] == "history") {
            options.queryType = options.QUERY_TYPE_HISTORY;
            completions = completions.concat(get_history_service_results (nav_history_service, options, query));
        } else if (completion_types[type] == "bookmarks") {
            options.queryType = options.QUERY_TYPE_BOOKMARKS;
            completions = completions.concat(get_history_service_results (nav_history_service, options, query));
        } else {
            throw ("Invalid completion_type");
        }
    }

    return all_word_completer (
	$completions = completions,
	$get_string = function (completion) {
	    return completion.string;
	},
	$get_description = function (completion) {
	    return completion.description;
	},
	$get_value = function (completion) {
	    return completion.value;
	});
}

function javascript_completer(buffer) {
    var buffer = buffer;
    var window = buffer.window;

    return function (input, pos, conservative) {
        // Derived from Vimperator JavaScript completion
        if (pos == 0 && conservative)
            return undefined;
        var str = input.substr(0, pos);
        var matches = str.match(/^(.*?)(\s*\.\s*)?(\w*)$/);
        var filter = matches[3] || "";
        var start = matches[1].length - 1;
        var offset = matches[1] ? matches[1].length : 0;
        offset += matches[2] ? matches[2].length : 0;

        if (matches[2])
        {
            let brackets = 0, parentheses = 0;
        outer:
            for (; start >= 0; start--)
            {
                switch (matches[1][start])
                {
                case ";":
                case "{":
                    break outer;

                case "]":
                    brackets--;
                    break;
                case "[":
                    brackets++;
                    break;
                case ")":
                    parentheses--;
                    break;
                case "(":
                    parentheses++;
                    break;
                }
                if (brackets > 0 || parentheses > 0)
                    break outer;
            }
        }

        var objects = [];
        var source_obj ;
        var data = [];
        var common_prefix_len = null;
        var common_prefix = null;

        function add_completion(str, desc) {
            if (common_prefix != null)
                common_prefix_len = get_common_prefix_length(common_prefix, str, common_prefix_len);
            else
                common_prefix = str;
            data.push([str,desc]);
        }
        if (matches[1].substr(start+1))
        {
            try {
                source_obj = eval(matches[1].substr(start+1));
            } catch (e) {}
        }
        else
        {
            source_obj = conkeror;
            if ("window".substring(0,filter.length) == filter)
                add_completion("window", "object");
            if ("buffer".substring(0,filter.length) == filter)
                add_completion("buffer", "object");
        }

        if (source_obj != null) {
            try {
                for (let i in source_obj) {
                    if (i.substring(0,filter.length) != filter)
                        continue;
                    let type, description;
                    try {
                        type = typeof(source_obj[i]);
                    } catch (e) { type = "unknown type"; }
                    if (type == "number" || type == "string" || type == "boolean") {
                        description = type + ": " + source_obj[i];
                    } else
                        description = type;
                    add_completion(i, description);
                }
            } catch (e) {}
        }
        if (common_prefix != null && common_prefix_len > 0)
            common_prefix = common_prefix.substr(0, common_prefix_len);
        else if (common_prefix_len != null)
            common_prefix = null;
        return {data: data,
                get_string: function (x) x[0],
                get_description: function (x) x[1],
                apply: function (x,m) apply_partial_completion(x[0], offset, pos, input, m),
                common_prefix: common_prefix,
                apply_common_prefix: function (x,m) apply_partial_completion(x, offset, pos, input, m)
               };
    }
}
