/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2008 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

var webjumps = new string_hashmap();

define_keywords("$completer", "$description", "$no_argument");
function define_webjump(key, handler) {
    keywords(arguments);
    var no_argument;

    // handler may be a function, a string, or an array
    // of a string and a "no args" alternate string.
    //
    // if the no_argument property is set on a webjump,
    // completing on the name of the webjump will not
    // result in a space being appended.
    //
    // we only pay attention to the no_argument keyword
    // if the handler is a function.  for string webjumps,
    // we simply see if there is a "%s" in the string.
    //
    if (typeof(handler) == "object" &&
        handler[0].indexOf('%s') == -1)
    {
        // we discard the alternate if the main webjump does
        // not take an arg.
        handler=handler[0];
        no_argument = true;
    } else if (typeof(handler) == "function") {
        no_argument = arguments.$no_argument;
    } else if (typeof(handler) == "string") {
        if (handler.indexOf('%s') == -1)
            no_argument = true;
    }

    function make_handler (template, alternative) {
        if (alternative == null)
            alternative = url_path_trim(template);
        var b = template.indexOf('%s');
        return function (arg) {
            var a = b + 2;
            if (arg == null && b > -1)
                return alternative;
            // Just return the same string if it doesn't contain a %s
            if (b == -1)
                return template;
            return template.substr(0,b) + encodeURIComponent(arg) + template.substring(a);
        };
    }

    if (typeof(handler) == "string")
        handler = make_handler(handler);
    if (typeof(handler) == "object")
        // An array of a template and an alternative url (for no args)
        handler = make_handler(handler[0], handler[1]);

    webjumps.put(key,
                 {key: key,
                  handler: handler, completer: arguments.$completer,
                  description: arguments.$description,
                  no_argument: no_argument});
}

// Compatibility
var add_webjump = define_webjump;

function add_delicious_webjumps (username)
{
    define_webjump("delicious", "http://del.icio.us/" + username);
    define_webjump("adelicious", "javascript:location.href='http://del.icio.us/"+username+
                   "?v=2&url='+encodeURIComponent(location.href)+'&title='+"+
                   "encodeURIComponent(document.title);");
    define_webjump("sdelicious", "http://delicious.com/search?p=%s&u="+username+
                   "&chk=&context=userposts&fr=del_icio_us&lc=1");
    define_webjump("sadelicious", "http://del.icio.us/search/all?search=%s");
}

function add_lastfm_webjumps(username)
{
    if (! username) username = "";
    define_webjump("lastfm", "http://www.last.fm/user/"+username);
    define_webjump("lastfm-user", "http://www.last.fm/user/%s");
    define_webjump("lastfm-music", "http://www.last.fm/search?m=all&q=%s");
    define_webjump("lastfm-group", "http://www.last.fm/users/groups?s_bio=%s");
    define_webjump("lastfm-tag", "http://www.last.fm/search?m=tag&q=%s");
    define_webjump("lastfm-label", "http://www.last.fm/search?m=label&q=%s");
    define_webjump("lastfm-event", "http://www.last.fm/events?by=artists&q=%s");
}

function clear_webjumps()
{
    webjumps = {};
}

// Some built in web jumps
function define_default_webjumps()
{
    define_webjump("conkerorwiki",
                "http://conkeror.org/?action=fullsearch&context=60&value=%s&fullsearch=Text");
    define_webjump("lucky",      "http://www.google.com/search?q=%s&btnI=I'm Feeling Lucky");
    define_webjump("maps",       "http://maps.google.com/?q=%s");
    define_webjump("scholar",    "http://scholar.google.com/scholar?q=%s");
    define_webjump("clusty",     "http://www.clusty.com/search?query=%s");
    define_webjump("slang",      "http://www.urbandictionary.com/define.php?term=%s");
    define_webjump("dictionary", "http://dictionary.reference.com/search?q=%s");
    define_webjump("xulplanet",  ["http://www.google.com/custom?q=%s&cof=S%3A"+
				  "http%3A%2F%2Fwww.xulplanet.com%3BAH%3Aleft%3BLH%3A65%3BLC"+
				  "%3A4682B4%3BL%3Ahttp%3A%2F%2Fwww.xulplanet.com%2Fimages%2F"+
				  "xulplanet.png%3BALC%3Ablue%3BLW%3A215%3BAWFID%3A0979f384d5"+
				  "181409%3B&domains=xulplanet.com&sitesearch=xulplanet.com&sa=Go",
				  "http://xulplanet.com"]);
    define_webjump("image",      "http://images.google.com/images?q=%s");
    define_webjump("imdb",       "http://www.imdb.com/find?s=all&q=%s&x=0&y=0");
    define_webjump("clhs",       ["http://www.xach.com/clhs?q=%s", "http://www.lispworks.com/documentation/HyperSpec/Front/index.htm"]);
    define_webjump("emacswiki",  "http://www.emacswiki.org/cgi-bin/wiki?search=%s");
    define_webjump("cliki",      "http://www.cliki.net/admin/search?words=%s");
    define_webjump("ratpoisonwiki", "http://ratpoison.antidesktop.net/?search=%s");
    define_webjump("stumpwmwiki", "http://stumpwm.antidesktop.net/wiki?search=%s");
    define_webjump("savannah", "http://savannah.gnu.org/search/?words=%s&type_of_search=soft&Search=Search&exact=1");
    define_webjump("sourceforge", "http://sourceforge.net/search/?words=%s");
    define_webjump("freshmeat", "http://freshmeat.net/search/?q=%s");
    define_webjump("slashdot", "http://slashdot.org/search.pl?query=%s");
    define_webjump("kuro5hin", "http://www.kuro5hin.org/?op=search&string=%s");
    define_webjump("sheldonbrown",     "http://www.google.com/search?q=site:sheldonbrown.com %s");
    define_webjump("youtube", "http://www.youtube.com/results?search_query=%s&search=Search");
}

function match_webjump(str) {
    var sp = str.indexOf(' ');

    var key, arg;
    if (sp == -1) {
        key = str;
        arg = null;
    } else {
        key = str.substring(0, sp);
        arg = str.substring(sp + 1);
        if (/^\s*$/.test(arg))
            arg = null;
    }

    // Look for an exact match
    var match = webjumps.get(key);

    // Look for a partial match
    if (!match) {
        for (let [k,v] in webjumps.iterator()) {
            if (k.substring(0, key.length) == key) {
                if (match) {
                    // key is not a unique prefix, as there are multiple partial matches
                    return null;
                }
                match = v;
            }
        }
    }

    if (match) {
        if (arg == null && !match.no_argument) {
            throw interactive_error('Webjump '+key+' requires an argument.');
        }
        return [match, key, arg];
    }
    return null;
}


function getWebJump(value)
{
    var res = match_webjump(value);
    if (!res)
        return null;
    let [match,key,arg] = res;
    return match.handler(arg);
}

function get_url_or_webjump(input)
{
    var url = getWebJump(input);

    if (url != null) {
        return url;
    } else {
        return input;
    }
}

define_default_webjumps();

function webjump_completer()
{
    let base_completer = prefix_completer(
        $completions = [ v for ([k,v] in webjumps.iterator()) ],
        $get_string = function (x) { return x.key + (x.no_argument==true ? "" : " "); },
        $get_description = function (x) { return x.description || ""; });

    return function(input, pos, conservative) {
        let str = input.substring(0,pos);
        let res;
        try { res = match_webjump(str); }
        catch (e) { res = null; }
        if (res) {
            let [match, key, arg] = res;
            if (arg != null) { // If there is no argument yet, we use the base completer
                if (match.completer) {
                    let c = yield match.completer.call(null, arg, pos - key.length - 1, conservative);
                    yield co_return(nest_completions(c, match.key + " "));
                }
                yield co_return(null);
            }
        }
        yield co_return(base_completer(input, pos, conservative));
    };
}
