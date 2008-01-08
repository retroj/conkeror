require("minibuffer.js");

/**

We have a completer  that is a function that gives a list completions in response to the input state.


It gives back an array of objects, each with the fields: text, help, and value.
The field `text' is required and specifies the string text to be 



completion_minibuffer_state:

  completer


function from (string, cursor) to completions




*/




/**
 * The parameter `args' specifies the arguments.  In addition, the
 * arguments for text_entry_minibuffer_state are also allowed.
 *
 * completions:       [required] specifies an array of possible completions
 *
 * allow_non_matches: [optional] if completions is non-null, setting
 *                               this allows a non-match to be successfully entered; the callback
 *                               with be called with the match as the first argument, and the true
 *                               value as the second argument.
 *
 * default_match:     [optional] if completions is non-null, specifies a default
 *                               match to use if the user entered a blank string.
 *
 * callback:          [optional] Called with the match as the first argument, and possibly with
 *                               the true value as the second argument, depending on allow_non_matches.
 *
 */
define_keywords("$completions", "$allow_non_matches", "$default_match");
function completion_minibuffer_state() {
    text_entry_minibuffer_state.call(this, forward_keywords(arguments));
    keywords(arguments, $allow_non_matches = false);
    this.keymap = minibuffer_completion_keymap;
    this.completions = arguments.$completions.slice().sort(function (a,b) {
            if (a[0] < b[0]) return -1;
            else if (a[0] == b[0]) return 0;
            else return 1;
        });
    this.allow_non_matches = arguments.$allow_non_matches;
    this.default_match = arguments.$default_match;
}
// inherit from text_entry_minibuffer_state
completion_minibuffer_state.prototype.__proto__ = text_entry_minibuffer_state.prototype;


function find_complete_match(matches, val)
{
    for (var i=0; i<matches.length; i++) {
        if (matches[i][0] == val)
            return matches[i][1];
    }
    return null;
}


function minibuffer_complete_old (window)
{
    var m = window.minibuffer;
    var s = m.current_state;
    if (!(s instanceof completion_minibuffer_state))
        throw "Invalid minibuffer state";
    var str = m._input_text;
    var entered_text = str.substring(0, m._selection_start);
    var matches = get_completions(entered_text, s.completions);

    // If no completions, then nothing to do
    if (matches.length == 0)
    {
        m._set_selection(); // moves cursor to end
        return;
    }

    /* Find longest common prefix; since s.completions is sorted, this
     * is easy */
    var lcp = find_longest_common_prefix(matches);

    if (lcp == entered_text.length)
    {
        /* Cycle: find current match */
        var current_index = -1;
        for (var i = 0; i < matches.length; ++i)
            if (matches[i][0] == str)
            {
                current_index = i;
                break;
            }
        current_index = (current_index + 1) % matches.length;
        m._input_text = matches[current_index][0];
        m._set_selection(lcp); // select after lcp
    } else {
        m._input_text = matches[0][0];
        m._set_selection(lcp);
    }
}
interactive("minibuffer-complete-old", minibuffer_complete_old, I.current_window);


function minibuffer_accept_match (window)
{
    var m = window.minibuffer;
    var s = m.current_state;
    if (!(s instanceof completion_minibuffer_state))
        throw "Invalid minibuffer state";
    var sel_start = m._selection_start;
    var sel_end = m._selection_end;
    var str = m._input_text;
    if (sel_start == sel_end) {
        m._input_text = str.substr(0, sel_start) + " " + str.substr(sel_end);
        m._set_selection(sel_start + 1, sel_start + 1);
    } else {
        // When we allow non-matches it generally means the
        // completion takes an argument. So add a space.
        if (s.allow_non_matches && str[str.length-1] != ' ')
            m._input_text = str + " ";
        m._set_selection();
    }
}
interactive("minibuffer-accept-match", minibuffer_accept_match, I.current_window);


/* FIXME: Change this to use a binary search */
function get_completions(str, matches)
{
    if (str.length == 0)
        return matches;
    var ret = [];
    for (var i=0; i<matches.length; i++)
	{
	    if (str == matches[i][0].substr(0, str.length))
            ret.push(matches[i]);
	}
    return ret;
}

function find_longest_common_prefix(matches)
{
    var a = matches[0][0];
    var b = matches[matches.length - 1][0];
    for (var i = 0; i < a.length && i < b.length; i++)
        if (a.charAt(i) != b.charAt(i))
            return i;
    return Math.min(a.length,b.length);
}

function minibuffer_insert_character_complete(window, n, event)
{
    var m = window.minibuffer;
    var s = m.current_state;
    if (!(s instanceof completion_minibuffer_state))
        throw "Invalid minibuffer state";

    minibuffer_insert_character(window, n, event);

    // Check for completions

    var entered_text = m._input_text.substring(0, m._selection_start);
    var matches = get_completions(entered_text, s.completions);
    if (matches.length == 0)
        return;
    m._input_text = matches[0][0];
    m._set_selection(entered_text.length);
}
interactive("minibuffer-insert-character-complete", minibuffer_insert_character_complete,
            I.current_window, I.p, I.e);




/* FIXME: Above this point is old junk */

/**
 * Completions is either a visit function or an array.
 */


function apply_completion_string(str, m) {
    m._set_selection();
    m._input_text = str;
}

define_keywords("$completions", "$get_string", "$get_description", "$get_value", "$complete_blank");
function all_word_completer()
{
    keywords(arguments);
    var completions = arguments.$completions;
    var get_string = arguments.$get_string;
    var get_description = arguments.$get_description;
    var get_value = arguments.$get_value;
    var complete_blank = arguments.$complete_blank;
    var arr;
    if (typeof(completions) == "function")
    {
        arr = [];
        completions(function (x) { arr.push(x); });
    } else
        arr = completions;
    return function (input, pos) {
        var data;
        if (input.length == 0 && !complete_blank)
            data = [];
        else {
            var words = input.toLowerCase().split(" ");
            data = arr.filter(function (x) {
                    var s = get_string(x);
                    var d = get_description(x);
                    for (var i = 0; i < words.length; ++i)
                    {
                        if (s.toLowerCase().indexOf(words[i]) == -1 && d.toLowerCase().indexOf(words[i]) == -1)
                            return false;
                    }
                    return true;
                });
        }
        return { data: data,
                 get_string: get_string,
                 get_description : get_description,
                 apply : function (x, m) { apply_completion_string(get_string(x), m); },
                 get_value : get_value
               };
    }
}

function apply_prefix_completion_string(x, pos, str, m) {
    m._input_text = x + str.substring(pos);
    m._set_selection(x.length, x.length);
}

function prefix_completer()
{
    keywords(arguments);
    var completions = arguments.$completions;
    var get_string = arguments.$get_string;
    var get_description = arguments.$get_description;
    var get_value = arguments.$get_value;
    var complete_blank = arguments.$complete_blank;
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
    return function (input, pos) {
        var data;
        var common_prefix = null;
        if (pos == 0 && !complete_blank)
            data = [];
        else {
            var input_prefix = input.substring(0,pos);
            data = arr.filter(function (x) {
                    var s = get_string(x);
                    return s.length >= pos && s.substring(0,pos) == input_prefix;
                });
            if (data.length > 0)
            {
                var a = get_string(data[0]);
                var b = get_string(data[data.length - 1]);
                var lim = a.length < b.length ? a.length : b.length;
                for (var i = 0; i < lim; ++i) {
                    if (a[i] != b[i])
                        break;
                }
                if (i > pos)
                    common_prefix = a.substring(0,i);
            }
        }
        return { data: data,
                get_string: get_string,
                get_description : get_description,
                apply : function (x, m) { apply_prefix_completion_string(get_string(x), pos, input, m); },
                get_value : get_value,
                common_prefix : common_prefix,
                apply_common_prefix : function (x, m) { apply_prefix_completion_string(x, pos, input, m); }
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
	},
	$complete_blank = false)
}
