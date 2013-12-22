/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 * (C) Copyright 2008 Nelson Elhage
 * (C) Copyright 2010,2012 John J. Foerch
 *
 * Portions of this file (the JavaScript completer) were derived from Vimperator,
 * (C) Copyright 2006-2007 Martin Stubenschrott.
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

function completions (completer, data) {
    this.completer = completer;
    if (data) {
        this.data = data;
        this.count = data.length;
    }
}
completions.prototype = {
    constructor: completions,
    toString: function () "#<completions>",
    completer: null,
    data: null,
    count: null,
    destroy: function () {},
    index_of: function (x) {
        return this.data.indexOf(x);
    },
    get_string: function (i) {
        return this.completer.get_string(this.data[i]);
    },
    get_input_state: function (i) {
        return [this.get_string(i)];
    },
    get_description: function (i) {
        return this.completer.get_description(this.data[i]);
    },
    get_icon: function (i) {
        if (this.completer.get_icon)
            return this.completer.get_icon(this.data[i]);
        else
            return null;
    },
    get_value: function (i) {
        if (this.completer.get_value)
            return this.completer.get_value(this.data[i]);
        else
            return this.data[i];
    }
};


define_keywords("$completions", "$get_string", "$get_description",
                "$get_icon", "$get_value");
function completer () {
    keywords(arguments,
             $completions = [],
             $get_string = identity,
             $get_description = constantly(""),
             $get_icon = null,
             $get_value = null);
    this.completions_src = arguments.$completions;
    this.get_string = arguments.$get_string;
    this.get_description = arguments.$get_description;
    this.get_icon = arguments.$get_icon;
    this.get_value = arguments.$get_value;
    this.refresh();
}
completer.prototype = {
    constructor: completer,
    toString: function () "#<completer>",
    completions_src: null,
    completions: null,
    get_string: null,
    get_description: null,
    get_icon: null,
    get_value: null,
    complete: function (input, pos) {},
    refresh: function () {
        if (typeof this.completions_src == "function") {
            var completions = [];
            this.completions_src(function (x) { completions.push(x); });
            this.completions = completions;
        } else if (this.completions_src)
            this.completions = this.completions_src.slice();
    }
};


/*
 * All Word Completer
 */

function all_word_completer () {
    keywords(arguments);
    completer.call(this, forward_keywords(arguments));
}
all_word_completer.prototype = {
    constructor: all_word_completer,
    __proto__: completer.prototype,
    toString: function () "#<all_word_completer>",
    complete: function (input, pos) {
        var words = input.toLowerCase().split(" ");
        var nwords = words.length;
        var c = this;
        var narrowed = this.completions.filter(function (x) {
                var s = c.get_string(x);
                var d = c.get_description(x);
                for (var i = 0; i < nwords; ++i) {
                    if (s.toLowerCase().indexOf(words[i]) == -1 &&
                        d.toLowerCase().indexOf(words[i]) == -1)
                    {
                        return false;
                    }
                }
                return true;
            });
        return new completions(this, narrowed);
    }
};


/*
 * Prefix Completer
 */

function prefix_completions (completer, data, default_completion,
                             offset, pos, input, common_prefix)
{
    completions.call(this, completer, data);
    this.default_completion = default_completion;
    this.common_prefix = common_prefix;
    this.offset = offset || 0;
    this.pos = pos;
    this.input = input;
}
prefix_completions.prototype = {
    constructor: prefix_completions,
    __proto__: completions.prototype,
    toString: function () "#<prefix_completions>",
    default_completion: null,
    common_prefix: null,
    offset: null,
    pos: null,
    input: null,
    get_partial_completion_input_state: function (x, prefix_end, suffix_begin, orig_str) {
        if (suffix_begin < orig_str.length) {
            if (orig_str[suffix_begin] == " ")
                suffix_begin++;
            var sel = x.length + prefix_end + 1;
            return [orig_str.substring(0, prefix_end) + x + " " +
                    orig_str.substring(suffix_begin),
                    sel, sel];
        } else {
            sel = x.length + prefix_end;
            return [orig_str.substring(0, prefix_end) + x, sel, sel];
        }
    },
    get_input_state: function (i) {
        return this.get_partial_completion_input_state(
            this.get_string(i), 0, this.pos, this.input)
    },
    get common_prefix_input_state () { //used by minibuffer-read
        return (this.common_prefix &&
                this.get_partial_completion_input_state(this.common_prefix,
                                                        this.offset, this.pos,
                                                        this.input));
    }
};

function prefix_completer () {
    keywords(arguments);
    completer.call(this, forward_keywords(arguments));
}
prefix_completer.prototype = {
    constructor: prefix_completer,
    __proto__: completer.prototype,
    toString: function () "#<prefix_completer>",
    complete: function (input, pos) {
        var common_prefix = null;
        var input_prefix = input.substring(0, pos);
        var default_completion = null;
        var i = 0;
        var c = this;
        var narrowed = this.completions.filter(function (x) {
                var s = c.get_string(x);
                if (s == input) {
                    default_completion = i;
                    var retval = true;
                } else
                    retval = (s.substring(0, pos) == input_prefix);
                if (retval)
                    ++i;
                return retval;
            });
        var nnarrowed = narrowed.length;
        if (nnarrowed > 0) {
            var a = this.get_string(narrowed[0]);
            var b = this.get_string(narrowed[nnarrowed - 1]);
            let i = common_prefix_length(a, b);
            if (i > pos) {
                common_prefix = a.substring(0, i);
                if (! default_completion) {
                    for (var j = 0; j < nnarrowed; ++j) {
                        if (this.get_string(narrowed[j]) == common_prefix) {
                            default_completion = j;
                            break;
                        }
                    }
                }
            }
        }
        return new prefix_completions(this, narrowed, default_completion,
                                      null, pos, input, common_prefix);
    },
    refresh: function () {
        completer.prototype.refresh.call(this);
        var c = this;
        this.completions.sort(function (a, b) {
                a = c.get_string(a);
                b = c.get_string(b);
                if (a < b)
                    return -1;
                if (a > b)
                    return 1;
                return 0;
            });
    }
};


/*
 * Javascript Completer
 */

function javascript_completer (scope) {
    prefix_completer.call(this,
                          $get_string = first,
                          $get_description = second);
    this.scope = scope;
}
javascript_completer.prototype = {
    constructor: javascript_completer,
    __proto__: prefix_completer.prototype,
    toString: function () "#<javascript_completer>",
    scope: null,
    complete: function (input, pos) {
        var str = input.substr(0, pos);
        var matches = str.match(/^(.*?)(\s*\.\s*)?(\w*)$/);
        var filter = matches[3] || "";
        var start = matches[1].length - 1;
        var offset = matches[1] ? matches[1].length : 0;
        offset += matches[2] ? matches[2].length : 0;

        if (matches[2]) {
            let brackets = 0, parentheses = 0;
        outer:
            for (; start >= 0; start--) {
                switch (matches[1][start]) {
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
        var narrowed = [];
        var common_prefix_len = null;
        var common_prefix = null;
        var c = this;

        function add_completion (str, desc) {
            if (common_prefix != null)
                common_prefix_len = common_prefix_length(common_prefix, str, common_prefix_len);
            else
                common_prefix = str;
            narrowed.push([str, desc]);
        }
        if (matches[1].substr(start+1)) {
            try {
                var source_obj = eval(matches[1].substr(start+1));
            } catch (e) {}
        } else {
            source_obj = this.scope;
        }
        if (source_obj != null) {
            try {
                for (let i in source_obj) {
                    if (i.substring(0, filter.length) != filter)
                        continue;
                    try {
                        var type = typeof source_obj[i];
                    } catch (e) {
                        type = "unknown type";
                    }
                    if (type == "number" || type == "string" || type == "boolean") {
                        var description = type + ": " + source_obj[i];
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
        return new prefix_completions(this, narrowed, null, offset, pos, input, common_prefix);
    },
    refresh: function () {}
};


/*
 * Merged Completer (combinator)
 */

function merged_completions (results, count) {
    completions.call(this, null);
    this.results = results;
    this.nresults = results.length;
    this.count = count;
}
merged_completions.prototype = {
    constructor: merged_completions,
    __proto__: completions.prototype,
    toString: function () "#<merged_completions>",
    results: null,
    nresults: 0,
    forward: function (name, i) {
        for (var j = 0; j < this.nresults; ++j) {
            var r = this.results[j];
            if (i < r.count)
                return r[name](i);
            i -= r.count;
        }
        return null;
    },
    destroy: function () {
        for (var j = 0; j < this.nresults; ++j) {
            this.results[j].destroy();
        }
    },
    //XXX: index_of: function (x) { },
    get_string: function (i) {
        return this.forward("get_string", i);
    },
    get_input_state: function (i) {
        return this.forward("get_input_state", i);
    },
    get_description: function (i) {
        return this.forward("get_description", i);
    },
    get_icon: function (i) {
        return this.forward("get_icon", i);
    },
    get_value: function (i) {
        return this.forward("get_value", i);
    }
};

function merged_completer (completers) {
    this.completers = completers;
    this.ncompleters = completers.length;
    completer.call(this);
}
merged_completer.prototype = {
    constructor: merged_completer,
    __proto__: completer.prototype,
    toString: function () "#<merged_completer>",
    completers: null,
    ncompleters: 0,
    complete: function (input, pos) {
        var merged_results = [];
        var count = 0;
        for (let i = 0; i < this.ncompleters; ++i) {
            let r = yield this.completers[i].complete(input, pos);
            if (r != null && r.count > 0) {
                merged_results.push(r);
                count += r.count;
            }
        }
        yield co_return(new merged_completions(merged_results, count));
    },
    refresh: function () {
        for (var i = 0; i < this.ncompleters; ++i) {
            this.completers[i].refresh();
        }
    },
    get require_match () {
        for (var i = 0; i < this.ncompleters; ++i) {
            var r = this.completers[i];
            if (r.require_match)
                return r.require_match;
        }
        return false;
    }
};


/*
 * Nest Completions
 *
 *   Adjust input_state of a prefix_completions object for prefix and/or
 * suffix strings.
 */

function nest_completions (completions_o, prefix, suffix) {
    if (prefix == null)
        prefix = "";
    if (suffix == null)
        suffix = "";
    function nest (x) {
        let [s, a, b] = x;
        if (a == null)
            a = s.length;
        if (b == null)
            b = s.length;
        return [prefix + s + suffix, a + prefix.length, b + prefix.length];
    }
    return {
        __proto__: completions_o,
        get_input_state: function (i) {
            var x = completions_o.get_input_state(i);
            return nest(x);
        },
        get common_prefix_input_state () {
            let x = completions_o.common_prefix_input_state;
            if (x)
                return nest(x);
            return null;
        }
    };
}


provide("completers");
