/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2008 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

//// web jump stuff

var webjumps = new string_hashmap();

define_keywords("$completer", "$description", "$no_argument");
function define_webjump(key, handler) {
    keywords(arguments);

    var no_argument = arguments.$no_argument;

    if (typeof(handler) == "string") {
        let template = handler;
        let b = template.indexOf('%s');
        if (b == -1)
            no_argument = true;        
        handler = function (arg) {
            var a = b + 2;
            // Just return the same string if it doesn't contain a %s
            if (b == -1)
                return template;
            else
                return template.substr(0,b) + encodeURIComponent(arg) + template.substring(a);
        };
    }
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
    add_webjump("delicious", " http://del.icio.us/" + username);
    add_webjump("adelicious", "javascript:location.href='http://del.icio.us/" + username + "?v=2&url='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title);");
    add_webjump("sdelicious", " http://del.icio.us/search/?search=%s");
    add_webjump("sadelicious", " http://del.icio.us/search/all?search=%s");
}

function clear_webjumps()
{
    webjumps = {};
}

// Some built in web jumps
function define_default_webjumps()
{
    add_webjump("conkerorwiki",
                "http://conkeror.org/?action=fullsearch&context=60&value=%s&fullsearch=Text");
    add_webjump("lucky",      "http://www.google.com/search?q=%s&btnI=I'm Feeling Lucky");
    add_webjump("maps",       "http://maps.google.com/?q=%s");
    add_webjump("scholar",    "http://scholar.google.com/scholar?q=%s");
    add_webjump("clusty",     "http://www.clusty.com/search?query=%s");
    add_webjump("slang",      "http://www.urbandictionary.com/define.php?term=%s");
    add_webjump("dictionary", "http://dictionary.reference.com/search?q=%s");
    add_webjump("xulplanet",  "http://www.google.com/custom?q=%s&cof=S%3A"+
                "http%3A%2F%2Fwww.xulplanet.com%3BAH%3Aleft%3BLH%3A65%3BLC"+
                "%3A4682B4%3BL%3Ahttp%3A%2F%2Fwww.xulplanet.com%2Fimages%2F"+
                "xulplanet.png%3BALC%3Ablue%3BLW%3A215%3BAWFID%3A0979f384d5"+
                "181409%3B&domains=xulplanet.com&sitesearch=xulplanet.com&sa=Go");
    add_webjump("image",      "http://images.google.com/images?q=%s");
    add_webjump("clhs",       "http://www.xach.com/clhs?q=%s");
    add_webjump("emacswiki",  "http://www.emacswiki.org/cgi-bin/wiki?search=%s");
    add_webjump("cliki",      "http://www.cliki.net/admin/search?words=%s");
    add_webjump("ratpoisonwiki", "http://ratpoison.elektrubadur.se/?search=%s");
    add_webjump("stumpwmwiki", "http://stumpwm.elektrubadur.se/?search=%s");
    add_webjump("savannah", "http://savannah.gnu.org/search/?words=%s&type_of_search=soft&Search=Search&exact=1");
    add_webjump("sourceforge", "http://sourceforge.net/search/?words=%s");
    add_webjump("freshmeat", "http://freshmeat.net/search/?q=%s");
    add_webjump("slashdot", "http://slashdot.org/search.pl?query=%s");
    add_webjump("kuro5hin", "http://www.kuro5hin.org/?op=search&string=%s");
    add_webjump("sheldonbrown",     "http://www.google.com/search?q=site:sheldonbrown.com %s");
    add_webjump("youtube", "http://www.youtube.com/results?search_query=%s&search=Search");
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
        $get_string = function (x) x.key + (x.no_argument ? "" : " "),
        $get_description = function (x) x.description || "");

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
    }
}
