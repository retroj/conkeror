
//// web jump stuff

var webjumps = {};
function add_webjump(key, loc)
{
    webjumps[key] = loc;
}

function add_delicious_webjumps (username)
{
    add_webjump("delicious", " http://del.icio.us/" + username);
    add_webjump("adelicious", "javascript:location.href='http://del.icio.us/" + username + "?v=2&url='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title);");
    add_webjump("sdelicious", " http://del.icio.us/search/?search=%s");
    add_webjump("sadelicious", " http://del.icio.us/search/all?search=%s");
}

// Some built in web jumps
function init_webjumps()
{
    add_webjump("conkerorwiki","http://dev.technomancy.us/conkeror/index.cgi/search?q=%s&wiki=on&changeset=on&ticket=on");
    add_webjump("google",     "http://www.google.com/search?q=%s");
    add_webjump("lucky",      "http://www.google.com/search?q=%s&btnI=I'm Feeling Lucky");
    add_webjump("maps",       "http://maps.google.com/?q=%s");
    add_webjump("scholar",    "http://scholar.google.com/scholar?q=%s");
    add_webjump("clusty",     "http://www.clusty.com/search?query=%s");
    add_webjump("wikipedia",  "http://en.wikipedia.org/wiki/Special:Search?search=%s");
    add_webjump("slang",      "http://www.urbandictionary.com/define.php?term=%s");
    add_webjump("dictionary", "http://dictionary.reference.com/search?q=%s");
    add_webjump("xulplanet",  "http://www.google.com/custom?q=%s&cof=S%3A"+
                "http%3A%2F%2Fwww.xulplanet.com%3BAH%3Aleft%3BLH%3A65%3BLC"+
                "%3A4682B4%3BL%3Ahttp%3A%2F%2Fwww.xulplanet.com%2Fimages%2F"+
                "xulplanet.png%3BALC%3Ablue%3BLW%3A215%3BAWFID%3A0979f384d5"+
                "181409%3B&domains=xulplanet.com&sitesearch=xulplanet.com&sa=Go");
    add_webjump("image",      "http://images.google.com/images?q=%s");
    add_webjump("bugzilla",   "https://bugzilla.mozilla.org/show_bug.cgi?id=%s");
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
}

function webjump_build_url(template, subs)
{
    var b = template.indexOf('%s');
    var a = b + 2;
    // Just return the same string if it doesn't contain a %s
    if (b == -1)
        return template;
    else
        return template.substr(0,b) + encodeURIComponent(subs) + template.substring(a);
}

function get_partial_match(hash, part)
{
    var matches = [];
    for (x in hash) {
        if (part == x.substr(0, part.length))
            matches.push(x);
    }
    if (matches.length == 1)
        return matches[0];
    else
        return null;
}

function getWebJump(value)
{
    try {
    var start = value.indexOf(' ');
    var jump;
    if (start == -1)
        jump = webjumps[value];
    else
        jump = webjumps[value.substr(0,start)];
    // Try to find a web jump match
    if (!jump) {
        var match = get_partial_match(webjumps, value.substr(0,start));
        if (match)
            jump = webjumps[match];
        else
            return null;
    }
    return webjump_build_url(jump, value.substring(start + 1));
    } catch(e) {/* FIXME: figure out why we need this */ dump_error(e); return null;}
}

function get_url_or_webjump(input)
{
    var url = getWebJump(input);

    if (url) {
        return url;
    } else {
        return input;
    }
}
