/**
 * (C) Copyright 2009 Shawn Betts
 * (C) Copyright 2009 John J. Foerch <jjfoerch@earthlink.net>
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/


in_module(null);

define_variable("headings_xpath",
    "//h1 | //h2 | //h3 | //h4 | //h5 | //h6 | //xhtml:h1 | "+
    "//xhtml:h2 | //xhtml:h3 | //xhtml:h4 | //xhtml:h5 | //xhtml:h6",
    "The xpath expression used by next-heading and previous-heading to find "+
    "headings.  Users will rarely need to change the value of this, but it "+
    "exists especially for page-modes to override with a site-specific "+
    "xpath expression.");


define_variable("scroll_to_heading_wrap", true,
    "If true, will wrap to the topmost heading when the viewport is at the "+
    "bottom of the document and the user tries to access the next heading. "+
    "Does the equivalent thing for \"previous heading\" as well.");


define_browser_object_class("next-heading", null,
    function (I) {
        let xpr = I.buffer.document.evaluate(
            I.local.headings_xpath, I.buffer.document, xpath_lookup_namespace,
            Ci.nsIDOMXPathResult.ORDERED_NODE_ITERATOR_TYPE, null),
        heading, found = null, foundtop = null,
        first = null, firsttop = null;
        while ((heading = xpr.iterateNext())) {
            let rect = heading.getBoundingClientRect();
            if (rect.bottom - rect.top < 2)
                continue;
            if (! first || rect.top < firsttop) {
                first = heading;
                firsttop = rect.top;
            }
            if (rect.top > 2 && (! found || rect.top < foundtop)) {
                found = heading;
                foundtop = rect.top;
            }
        }
        // scrollY can exceed scrollMaxY
        let eod = I.buffer.scrollY - I.buffer.scrollMaxY >= 0;
        if ((!found || eod) && scroll_to_heading_wrap)
            found = first;
        yield co_return(found);
    });


define_browser_object_class("previous-heading", null,
    function (I) {
        let xpr = I.buffer.document.evaluate(
            I.local.headings_xpath, I.buffer.document,  xpath_lookup_namespace,
            Ci.nsIDOMXPathResult.ORDERED_NODE_ITERATOR_TYPE, null),
        heading, found = null, foundtop = null,
        last = null, lasttop = null;
        while ((heading = xpr.iterateNext())) {
            let rect = heading.getBoundingClientRect();
            if (rect.bottom - rect.top < 2)
                continue;
            if (rect.top < -1 && (! found || rect.top > foundtop)) {
                found = heading;
                foundtop = rect.top;
            }
            if (! last || rect.top > lasttop) {
                last = heading;
                lasttop = rect.top;
            }
        }
        if (! found && scroll_to_heading_wrap)
            found = last;
        yield co_return(found);
    });


function scroll (I) {
    var element = yield read_browser_object(I);
    // no scrolling and no error if we failed to get an object.
    if (! element)
        return;
    element.scrollIntoView();
    I.window.minibuffer.message(element.textContent);
}


interactive("scroll",
    "Generalized scroll command.  The amount of scrolling is determined by "+
    "the object passed to the command as a browser-object.  If the object "+
    "is a DOM node, that node will be scrolled to the top of the viewport "+
    "if possible.",
    scroll);

provide("scroll");
