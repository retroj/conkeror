require("element.js");

const RELATIONSHIP_NEXT = 0;
const RELATIONSHIP_PREVIOUS = 1;

var browser_relationship_rel_name = ["next", "previous"];
var browser_relationship_rel_regexp = ["next", "prev|previous"];
var browser_relationship_rev_regexp = ["prev|previous", "next"];

define_variable("browser_relationship_patterns", {}, "Patterns used by `browser-follow-next' and `browser-follow-previous'.");

browser_relationship_patterns[RELATIONSHIP_NEXT] = 
    [new RegExp("\\bnext","i"),
     new RegExp("^>$","i"),
     new RegExp("^(>>|»)$","i"),
     new RegExp("^(>|»)","i"),
     new RegExp("(>|»)$","i")];

browser_relationship_patterns[RELATIONSHIP_PREVIOUS] = 
    [new RegExp("\\bprev|previous\\b","i"), 
     new RegExp("^<$","i"), 
     new RegExp("^(<<|«)$","i"), 
     new RegExp("^(<|«)","i"), 
     new RegExp("(<|«)$","i")];

function document_get_element_by_relationship(doc, relationship) {
    var patterns = browser_relationship_patterns[relationship];
    var rel_name = new RegExp(browser_relationship_rel_regexp[relationship], "i");
    var rev_name = new RegExp(browser_relationship_rev_regexp[relationship], "i");
    
    var elems = doc.getElementsByTagName("link");
    // links have higher priority than normal <a> hrefs
    for (var i = 0; i < elems.length; i++)
    {
        if (rel_name.test(elems[i].rel) || rev_name.test(elems[i].rev))
            return elems[i];
    }

    // no links? ok, look for hrefs
    elems = doc.getElementsByTagName("a");
    for (var i = 0; i < elems.length; i++)
    {
        if (rel_name.test(elems[i].rel) || rev_name.test(elems[i].rev))
            return elems[i];
    }

    for (var j = 0; j < patterns.length; ++j)
    {
        var pattern = patterns[j];
        for (var i = 0; i < elems.length; i++) // Loop through list of A elements again
        {
            if (pattern.test(elems[i].textContent))
                return elems[i];

            // images with alt text being href
            var children = elems[i].childNodes;
            for (var k = 0; k < children.length; k++)
            {
                if (pattern.test(children[k].alt))
                    return elems[i];
            }
        }
    }
    return null;
}

function browser_follow_relationship(buffer, relationship, target) {
    check_buffer(buffer, content_buffer);
    function helper(win) {
        var elem = document_get_element_by_relationship(win.document, relationship);
        if (elem)
            return elem;
        for (var i = 0; i < win.frames.length; ++i) {
            elem = document_get_element_by_relationship(win.frames[i].document, relationship);
            if (elem)
                return elem;
        }
        return null;
    }

    var elem = helper(buffer.top_frame);
    if (!elem)
        throw interactive_error("No \"" + browser_relationship_rel_name[relationship]
                                + "\" link found");
    browser_element_follow(buffer, target, elem);
}

default_browse_targets["follow-relationship"] = "follow";

interactive("browser-follow-next", function (I) {
    browser_follow_relationship(I.buffer, RELATIONSHIP_NEXT, I.browse_target("follow-relationship"))
});

interactive("browser-follow-previous", function (I) {
    browser_follow_relationship(I.buffer, RELATIONSHIP_PREVIOUS, I.browse_target("follow-relationship"))
});
