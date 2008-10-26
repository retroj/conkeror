/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Portions of this file were derived from Vimperator,
 * (C) Copyright 2007 Doug Kearns
 * (C) Copyright 2007-2008 Martin Stubenschrott.
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("element.js");

const RELATIONSHIP_NEXT = 0;
const RELATIONSHIP_PREVIOUS = 1;

var browser_relationship_rel_name = ["next", "previous"];
var browser_relationship_rel_regexp = ["next", "prev|previous"];
var browser_relationship_rev_regexp = ["prev|previous", "next"];

define_variable("browser_relationship_patterns", {},
    "Patterns used by `follow-next' and `follow-previous'. "+
    "User value may be overridden for specific websites by "+
    "page-modes.");

browser_relationship_patterns[RELATIONSHIP_NEXT] =
    [/^next$/i,
     new RegExp("^>$","i"),
     new RegExp("^(>>|»)$","i"),
     new RegExp("^(>|»)","i"),
     new RegExp("(>|»)$","i"),
     new RegExp("\\bnext","i")
    ];

browser_relationship_patterns[RELATIONSHIP_PREVIOUS] =
    [/^(prev|previous)$/i,
     new RegExp("^<$","i"),
     new RegExp("^(<<|«)$","i"),
     new RegExp("^(<|«)","i"),
     new RegExp("(<|«)$","i"),
     new RegExp("\\bprev|previous\\b","i")
    ];

function document_get_element_by_relationship(buffer, doc, relationship) {
    var patterns = buffer.get('browser_relationship_patterns')[relationship];
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

define_browser_object_class(
    "relationship-next", "Relationship-Next", null,
    function (buf, prompt) {
        check_buffer(buf, content_buffer);
        var doc = buf.document;
        for (let frame in frame_iterator(buf.top_frame, buf.focused_frame)) {
            let elem = document_get_element_by_relationship(
                buf, frame.document, RELATIONSHIP_NEXT);
            if (elem)
                yield co_return(elem);
        }
    });

define_browser_object_class(
    "relationship-previous", "Relationship-Previous", null,
    function (buf, prompt) {
        check_buffer(buf, content_buffer);
        var doc = buf.document;
        for (let frame in frame_iterator(buf.top_frame, buf.focused_frame)) {
            let elem = document_get_element_by_relationship(
                buf, frame.document, RELATIONSHIP_PREVIOUS);
            if (elem)
                yield co_return(elem);
        }
    });

