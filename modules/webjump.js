/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2008,2012 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

define_keywords("$alternative", "$completer", "$doc", "$post_data",
                "$require_match");
function webjump (name, handler) {
    keywords(arguments,
             $alternative = null,
             $require_match = false);
    this.name = name;
    this.alternative = arguments.$alternative;
    this.completer = arguments.$completer;
    this.doc = arguments.$doc;
    this.post_data = arguments.$post_data;
    this.require_match = arguments.$require_match;
    if (typeof handler == "function") {
        if (handler.length == 0)
            this.argument = false;
        else if (this.alternative == null)
            this.argument = true;
        this.handler = handler;
    } else if (typeof handler == "string") {
        if (handler.indexOf("%s") == -1 &&
            (! this.post_data || this.post_data.every(function (x) x[1] != "%s")))
        {
            this.argument = false;
        } else if (this.alternative == null) {
            if (this.post_data)
                this.alternative = true; // use same handler
            else
                this.alternative = url_path_trim(handler);
        }
        if (this.post_data)
            this.handler = this._make_post_handler(handler);
        else
            this.handler = this._make_string_handler(handler);
    } else
        throw Error("bad handler type");
}
webjump.prototype = {
    constructor: webjump,
    toString: function () "#<webjump>",
    name: null,
    handler: null,
    alternative: null,
    completer: null,
    doc: null,
    argument: null, // null represents optional argument
    require_match: false,
    _make_string_handler: function (template) {
        var b = template.indexOf('%s');
        return function (arg) {
            var a = b + 2;
            // Just return the same string if it doesn't contain a %s
            if (b == -1)
                return template;
            return template.substr(0,b) + encodeURIComponent(arg) + template.substring(a);
        };
    },
    _make_post_handler: function (uri) {
        var w = this;
        return function (arg) {
            return load_spec({
                uri: uri,
                post_data: make_post_data(w.post_data.map(function (pair) {
                    if (pair[1] == '%s')
                        return [pair[0], arg];
                    else
                        return pair;
                }))
            });
        };
    },
    call: function (arg) {
        if (arg == null && this.argument == true)
            throw interactive_error("Webjump "+this.name+" requires an argument.");
        if (arg || this.alternative == true || this.argument == false)
            return this.handler(arg);
        return this.alternative
    }
};


var webjumps = {};

function define_webjump (name, handler) {
    keywords(arguments);
    var w = new webjump(name, handler, forward_keywords(arguments));
    webjumps[w.name] = w;
}

function clear_webjumps () {
    webjumps = {};
}

define_variable("webjump_partial_match", true,
    "When entering a url, if the input is not a webjump, " +
    "but would uniquely complete to a webjump, then accept " +
    "that webjump only if this is true.");

function match_webjump (str) {
    var sp = str.split(/(\s+)/, 2);
    var key = sp[0];
    if (sp.length > 1)
        var sep = sp[1];
    if (sep)
        var arg = str.substr(key.length + sep.length);

    // Look for an exact match
    var match = webjumps[key];

    // Look for a partial match
    if (! match && webjump_partial_match) {
        for (let [k, v] in Iterator(webjumps)) {
            if (String(k).substring(0, key.length) == key) {
                if (match) // prefix must be unique for a partial match
                    return [null, null, null, null];
                match = v;
            }
        }
    }
    if (match)
        return [match, key, sep, arg];
    return [null, null, null, null];
}


function get_webjump (value) {
    let [w, key, sep, arg] = match_webjump(value);
    if (! w)
        return null;
    return w.call(arg);
}

function get_url_or_webjump (input) {
    return get_webjump(input) || input;
}


// a webjump completer is a nesting of two completers: one that completes
// on webjump names, and one specific to the individual webjump.
function webjump_name_completer () {
    prefix_completer.call(this,
        $completions = [v for ([k, v] in Iterator(webjumps))],
        $get_string = function (x) x.name + (x.argument == false ? "" : " "),
        $get_description = function (x) x.doc || "");
}
webjump_name_completer.prototype = {
    constructor: webjump_name_completer,
    __proto__: prefix_completer.prototype,
    toString: function () "#<webjump_name_completer>"
};


function webjump_completer () {
    completer.call(this);
    this.webjump_name_completer = new webjump_name_completer();
}
webjump_completer.prototype = {
    constructor: webjump_completer,
    __proto__: completer.prototype,
    toString: function () "#<webjump_completer>",
    webjump_name_completer: null,
    require_match: false,
    complete: function (input, pos) {
        this.require_match = false;
        let [w, key, sep, arg] = match_webjump(input);
        var current_part = position_in_strings([key, sep, arg], pos);
        if (current_part % 2)
            current_part++;
        if (current_part) { // complete on the argument
            if (w.completer) {
                this.require_match = w.require_match;
                var c = yield w.completer.complete(arg, pos - key.length - sep.length);
                yield co_return(nest_completions(c, w.name + " "));
            } else {
                yield co_return(null);
            }
        }
        // complete on the webjump name
        yield co_return(this.webjump_name_completer.complete(input, pos));
    }
};


/*
 * Built-in webjumps
 */

function define_delicious_webjumps (username) {
    define_webjump("delicious", "http://www.delicious.com/" + username + "/%s",
                   $alternative = "http://www.delicious.com/" + username);
    define_webjump("adelicious", "javascript:location.href='http://www.delicious.com/save"+
                   "?v=2&url='+encodeURIComponent(location.href)+'&title='+"+
                   "encodeURIComponent(document.title);");
    define_webjump("sdelicious", "http://www.delicious.com/search?p=%s&u="+username+
                   "&chk=&context=userposts&fr=del_icio_us&lc=1");
    define_webjump("sadelicious", "http://www.delicious.com/search/all?search=%s");
}

function define_lastfm_webjumps (username) {
    if (! username) username = "";
    define_webjump("lastfm", "http://www.last.fm/user/"+username);
    define_webjump("lastfm-user", "http://www.last.fm/user/%s");
    define_webjump("lastfm-music", "http://www.last.fm/search?m=all&q=%s");
    define_webjump("lastfm-group", "http://www.last.fm/users/groups?s_bio=%s");
    define_webjump("lastfm-tag", "http://www.last.fm/search?m=tag&q=%s");
    define_webjump("lastfm-label", "http://www.last.fm/search?m=label&q=%s");
    define_webjump("lastfm-event", "http://www.last.fm/events?by=artists&q=%s");
}

function define_default_webjumps () {
    define_webjump("conkerorwiki",
                   "http://conkeror.org/?action=fullsearch&context=60&value=%s&fullsearch=Text");
    define_webjump("lucky",      "http://www.google.com/search?q=%s&btnI=I'm Feeling Lucky");
    define_webjump("maps",       "http://maps.google.com/?q=%s");
    define_webjump("scholar",    "http://scholar.google.com/scholar?q=%s");
    define_webjump("slang",      "http://www.urbandictionary.com/define.php?term=%s");
    define_webjump("dictionary", "http://dictionary.reference.com/search?q=%s");
    define_webjump("image",      "http://images.google.com/images?q=%s");
}

define_default_webjumps();

provide("webjump");
