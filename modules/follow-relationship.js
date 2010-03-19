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

in_module(null);

require("element.js");

const RELATIONSHIP_NEXT = 0;
const RELATIONSHIP_PREVIOUS = 1;

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

function document_get_element_by_relationship (doc, patterns, relationship) {
    patterns = patterns[relationship];
    var rel_name = new RegExp(browser_relationship_rel_regexp[relationship], "i");
    var rev_name = new RegExp(browser_relationship_rev_regexp[relationship], "i");

    var elems = doc.getElementsByTagName("link");
    // links have higher priority than anchors
    for (var i = 0; i < elems.length; i++) {
        if (rel_name.test(elems[i].rel) || rev_name.test(elems[i].rev))
            return elems[i];
    }

    // no links? look for anchors
    elems = doc.getElementsByTagName("a");
    for (var i = 0; i < elems.length; i++) {
        if (rel_name.test(elems[i].rel) || rev_name.test(elems[i].rev))
            return elems[i];
    }

    for (var j = 0; j < patterns.length; ++j) {
        var pattern = patterns[j];
        for (var i = 0; i < elems.length; i++) { // loop through list of anchors again
            if (pattern.test(elems[i].textContent))
                return elems[i];

            // images with alt text being href
            var children = elems[i].childNodes;
            for (var k = 0; k < children.length; k++) {
                if (children[k].alt && pattern.test(children[k].alt))
                    return elems[i];
            }
        }
    }
    return null;
}

define_browser_object_class("relationship-next", null,
    function (I, prompt) {
        var doc = I.buffer.document;
        for (let frame in frame_iterator(I.buffer.top_frame, I.buffer.focused_frame)) {
            let elem = document_get_element_by_relationship(
                frame.document,
                I.local.browser_relationship_patterns,
                RELATIONSHIP_NEXT);
            if (elem)
                yield co_return(elem);
        }
        throw interactive_error("No \"next\" link found.");
    });

define_browser_object_class("relationship-previous", null,
    function (I, prompt) {
        var doc = I.buffer.document;
        for (let frame in frame_iterator(I.buffer.top_frame, I.buffer.focused_frame)) {
            let elem = document_get_element_by_relationship(
                frame.document,
                I.local.browser_relationship_patterns,
                RELATIONSHIP_PREVIOUS);
            if (elem)
                yield co_return(elem);
        }
        throw interactive_error("No \"previous\" link found.");
    });

provide("follow-relationship");
