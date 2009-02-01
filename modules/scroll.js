/**
 * (C) Copyright 2009 Shawn Betts
 * (C) Copyright 2009 John J. Foerch <jjfoerch@earthlink.net>
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/


define_browser_object_class(
    "next-heading", null, null,
    function (I) {
        let headings_xpath = "//h1 | //h2 | //h3 | //h4 | //h5 | //h6";
        let doc = I.buffer.document,
            xpr = doc.evaluate(
                headings_xpath, doc, null,
                Ci.nsIDOMXPathResult.ORDERED_NODE_ITERATOR_TYPE, null),
            heading, first = null, current = null, found = null,
            eod = true;
        // we have to look at all headings because if the heading of our
        // current scroll-location is positioned vertically higher than a
        // heading earlier in document order, then we must take care to
        // skip past those earlier headings to get the correct *next*
        // heading.
        while ((heading = xpr.iterateNext())) {
            if (! first)
                first = heading;
            let rect = heading.getBoundingClientRect();
            if (rect.bottom - rect.top < 2)
                continue;
            if (current) {
                found = heading;
                eod = false;
                break;
            } else if (rect.top > 2) {
                if (! found)
                    found = heading;
                if (rect.top > I.window.innerHeight)
                    eod = false;
            } else if (rect.top >= -1 && rect.top <= 2) {
                current = heading;
            }
        }
        if (! found || eod)
            found = first;
        yield co_return(found);
    });

define_browser_object_class(
    "previous-heading", null, null,
    function (I) {
        let headings_xpath = "//h1 | //h2 | //h3 | //h4 | //h5 | //h6";
        let doc = I.buffer.document,
            xpr = doc.evaluate(
                headings_xpath, doc, null,
                Ci.nsIDOMXPathResult.ORDERED_NODE_ITERATOR_TYPE, null),
            heading, found = false, last = null;
        while ((heading = xpr.iterateNext())) {
            let rect = heading.getBoundingClientRect();
            if (rect.bottom - rect.top < 2)
                continue;
            if (rect.top >= -1 && rect.top <= 2) {
                // this is our current heading
                found = last;
            } else if (rect.top >= -1 && found === false) {
                found = last;
            }
            last = heading;
        }
        if (! found)
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
    "Scroll the DOM node provided as a browser object to the top of the view port.",
    scroll);


