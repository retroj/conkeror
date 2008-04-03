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
        return {count: data.length,
                index_of:  function (x) data.indexOf(x),
                get_string: function (i) get_string(data[i]),
                get_description : function (i) get_description(data[i]),
                apply : function (i, m) apply_completion_string(get_string(data[i]), m),
                get_value : function(i) (get_value ? get_value(data[i]) : data[i])
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
        var default_completion = null;
        var i = 0;
        var data = arr.filter(function (x) {
            var s = get_string(x);
            var retval;

            if (s == input) {
                default_completion = i;
                retval = true;
            } else
                retval = (s.length >= pos && s.substring(0,pos) == input_prefix);
            if (retval)
                ++i;
            return retval;
        });
        if (data.length > 0)
        {
            let a = get_string(data[0]);
            let b = get_string(data[data.length - 1]);
            let i = get_common_prefix_length(a, b);
            if (i > pos) {
                common_prefix = a.substring(0,i);
                if (!default_completion) {
                    for (let j = 0; j < data.length; ++j) {
                        if (get_string(data[j]) == common_prefix) {
                            default_completion = j;
                            break;
                        }
                    }
                }
            }
        }
        return {count:data.length,
                index_of:  function (x) data.indexOf(x),
                get_string: function (i) get_string(data[i]),
                get_description : function (i) get_description(data[i]),
                apply : function (i, m) apply_partial_completion(get_string(data[i]), 0, pos, input, m),
                get_value : function(i) get_value(data[i]),
                apply_common_prefix: (common_prefix &&
                                      function (m) apply_partial_completion(common_prefix, 0, pos, input, m)),
                default_completion: default_completion
               };
    }
}

function javascript_completer(buffer) {
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
        return {count:data.length,
                get_string: function (i) data[i][0],
                get_description: function (i) data[i][1],
                apply: function (i,m) apply_partial_completion(data[i][0], offset, pos, input, m),
                apply_common_prefix: (common_prefix &&
                                      function (m) apply_partial_completion(common_prefix, offset, pos, input, m))
               };
    }
}


function merge_completers(completers) {
    if(completers.length == 0)
        return null;
    return function (input, pos, conservative) {
        var results = [];
        var count = 0;
        var results = completers.map(function(c) {
                var r = c(input, pos, conservative);
                if(r != null) {
                        count += r.count;
                }
                return r;
        });

        function forward(name) {
            return function() {
                var args = Array.prototype.slice.call(arguments);
                var i = args.shift();
                for(var j=0; j < results.length; j++) {
                    var r = results[j];
                    if(r == null) continue;
                    if(i < r.count) {
                        args.unshift(i);
                        return r[name].apply(this, args);
                    }
                    i -= r.count;
                }
                return null;
            }
        }
        return {count: count,
                get_string: forward('get_string'),
                get_description: forward('get_description'),
                apply: forward('apply'),
                destroy: forward('destroy')
                };
    };
}
