/**
 * (C) Copyright 2008 Martin Dybdal
 * (C) Copyright 2009-2010 John Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

require("content-buffer.js");

define_variable("reddit_end_behavior", "stop",
    "Controls the behavior of the commands reddit-next-link and "+
    "reddit-prev-link when at the last or first link, respectively. "+
    "Given as a string, the supported values are 'stop', 'wrap', "+
    "and 'page'.  'stop' means to not move the highlight in any "+
    "way.  'wrap' means to wrap around to the first (or last) "+
    "link.  'page' means to navigate the buffer to the next (or "+
    "previous) page on reddit.");

register_user_stylesheet(
    "data:text/css," +
        escape (
            "@-moz-document url-prefix(http://www.reddit.com/) {" +
                ".last-clicked {" +
                " background-color: #bfb !important;" +
                " border: 0px !important;"+
                "}}"));


/* Scroll, if necessary, to make the given element visible */
function reddit_scroll_into_view (window, element) {
    var rect = element.getBoundingClientRect();
    if (rect.top < 0 || rect.bottom > window.innerHeight)
        element.scrollIntoView();
}


/* Move select the next link down from the currently highlighted one.
 * When the end of the page is reached, the behavior is controlled by
 * the variable reddit_end_behavior.
 */
function reddit_next (I) {
    var doc = I.buffer.document;
    // the behavior of this command depends on whether we have downloaded
    // enough of the page to include all of the article links.
    var complete = doc.getElementsByClassName('footer').length > 0;
    var links = doc.getElementsByClassName('link');
    var first = null;
    var current = null;
    var next = null;
    for (var i = 0, llen = links.length; i < llen; i++) {
        if (links[i].style.display == 'none')
            continue;
        if (! first)
            first = links[i];
        if (current) {
            next = links[i];
            break;
        }
        if (links[i].className.indexOf("last-clicked") >= 0)
            current = links[i];
    }
    // The following situations are null-ops:
    //  1) there are no links on the page.
    //  2) page is incomplete and the current link is the last link.
    if (!first || (current && !next && !complete))
        return;
    if (! next) {
        if (current) {
            if (reddit_end_behavior == 'stop')
                return;
            if (reddit_end_behavior == 'wrap')
                next = first;
            if (reddit_end_behavior == 'page') {
                let (xpr = doc.evaluate(
                    '//p[@class="nextprev"]/a[text()="next"]', doc, null,
                    Ci.nsIDOMXPathResult.ORDERED_NODE_ITERATOR_TYPE, null))
                {
                    let nextpage;
                    if (xpr && (nextpage = xpr.iterateNext())) {
                        dom_remove_class(current, "last-clicked");
                        browser_object_follow(I.buffer, FOLLOW_DEFAULT, nextpage);
                        return;
                    }
                }
            }
        } else {
            // Page may or may not be complete.  If the page is not
            // complete, it is safe to assume that there is no current
            // link because a current link can only persist on a
            // cached page, which would load instantaneously, not
            // giving the user the opportunity to run this command.
            //
            next = first;
        }
    }
    // ordinaries (highlight new, maybe dehighlight old)
    if (current)
        dom_remove_class(current, "last-clicked");
    dom_add_class(next, "last-clicked");
    let (anchor = doc.evaluate(
        '//*[contains(@class,"last-clicked")]//a[contains(@class,"title")]',
        next, null, Ci.nsIDOMXPathResult.FIRST_ORDERED_NODE_TYPE, null))
    {
        browser_set_element_focus(I.buffer, anchor.singleNodeValue);
    }
    reddit_scroll_into_view(I.buffer.focused_frame, next);
}
interactive("reddit-next-link",
            "Move the 'cursor' to the next reddit entry.",
            reddit_next);


/* Select the link before the currently highlighted one.  When the
 * beginning of the page is reached, behavior is controlled by the
 * variable reddit_end_behavior.
 */
function reddit_prev (I) {
    var doc = I.buffer.document;
    // the behavior of this command depends on whether we have downloaded
    // enough of the page to include all of the article links.
    var complete = doc.getElementsByClassName('footer').length > 0;
    var links = doc.getElementsByClassName('link');
    var llen = links.length;
    var first = null;
    var prev = null;
    var current = null;
    for (var i = 0; i < llen; i++) {
        if (links[i].style.display == 'none')
            continue;
        if (! first)
            first = links[i];
        if (links[i].className.indexOf("last-clicked") >= 0) {
            current = links[i];
            break;
        }
        prev = links[i];
    }
    if (! first || // no links were found at all.
        (!current && !complete)) // don't know where current is.
        return;
    if (! prev) {
        // the first visible link is the `current' link.
        // dispatch on reddit_end_behavior.
        if (reddit_end_behavior == 'stop')
            return;
        else if (reddit_end_behavior == 'wrap') {
            // need to get last link on page.
            if (complete) {
                for (var i = 0; i < llen; i++) {
                    if (links[i].style.display == 'none')
                        continue;
                    prev = links[i];
                }
            }
        } else if (reddit_end_behavior == 'page') {
            let (xpr = doc.evaluate(
                '//p[@class="nextprev"]/a[text()="prev"]', doc, null,
                Ci.nsIDOMXPathResult.ORDERED_NODE_ITERATOR_TYPE, null))
            {
                let prevpage;
                if (xpr && (prevpage = xpr.iterateNext())) {
                    dom_remove_class(current, "last-clicked");
                    browser_object_follow(I.buffer, FOLLOW_DEFAULT, prevpage);
                    return;
                }
            }
        }
    }
    // ordinaries (highlight new, maybe dehighlight old)
    if (current)
        dom_remove_class(current, "last-clicked");
    dom_add_class(prev, "last-clicked");
    let (anchor = doc.evaluate(
        '//*[contains(@class,"last-clicked")]//a[contains(@class,"title")]',
        prev, null, Ci.nsIDOMXPathResult.FIRST_ORDERED_NODE_TYPE, null))
    {
        browser_set_element_focus(I.buffer, anchor.singleNodeValue);
    }
    reddit_scroll_into_view(I.buffer.focused_frame, prev);
}
interactive("reddit-prev-link",
            "Move the 'cursor' to the previous reddit entry.",
            reddit_prev);


function reddit_open_comments (I, target) {
    var xpr = I.buffer.document.evaluate(
        '//*[contains(@class,"last-clicked")]/descendant::a[@class="comments"]',
        I.buffer.document, null,
        Ci.nsIDOMXPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    let link;
    if (xpr && (link = xpr.iterateNext()))
        browser_object_follow(I.buffer, target || FOLLOW_DEFAULT, link);
}
function reddit_open_comments_new_buffer (I) {
    reddit_open_comments(I, OPEN_NEW_BUFFER);
}
function reddit_open_comments_new_window (I) {
    reddit_open_comments(I, OPEN_NEW_WINDOW);
}
interactive("reddit-open-comments",
            "Open the comments-page associated with the currently selected link.",
            alternates(reddit_open_comments,
                       reddit_open_comments_new_buffer,
                       reddit_open_comments_new_window));


function reddit_vote_up (I) {
    // get the current article and send a click to its vote-up button.
    var xpr = I.buffer.document.evaluate(
        '//*[contains(@class,"last-clicked")]/div[contains(@class,"midcol")]/div[contains(@class,"up")]',
        I.buffer.document, null,
        Ci.nsIDOMXPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    let link;
    if (xpr && (link = xpr.iterateNext()))
        browser_object_follow(I.buffer, FOLLOW_DEFAULT, link);
}
interactive("reddit-vote-up",
            "Vote the currently selected link up.",
            reddit_vote_up);


function reddit_vote_down (I) {
    // get the current article and send a click to its vote-down button.
    var xpr = I.buffer.document.evaluate(
        '//*[contains(@class,"last-clicked")]/div[contains(@class,"midcol")]/div[contains(@class,"down")]',
        I.buffer.document, null,
        Ci.nsIDOMXPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    let link;
    if (xpr && (link = xpr.iterateNext()))
        browser_object_follow(I.buffer, FOLLOW_DEFAULT, link);
}
interactive("reddit-vote-down",
            "Vote the currently selected link down.",
            reddit_vote_down);


define_browser_object_class("reddit-current", null,
    function (I, prompt) {
        var xpr = I.buffer.document.evaluate(
            '//*[contains(@class,"last-clicked")]/*[contains(@class,"entry")]/p[@class="title"]/a',
            I.buffer.document, null,
            Ci.nsIDOMXPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        yield co_return(xpr.iterateNext());
    });


define_keymap("reddit_keymap", $display_name = "reddit");
define_key(reddit_keymap, "j", "reddit-next-link");
define_key(reddit_keymap, "k", "reddit-prev-link");
define_key(reddit_keymap, ",", "reddit-vote-up");
define_key(reddit_keymap, ".", "reddit-vote-down");
define_key(reddit_keymap, "h", "reddit-open-comments");


var reddit_modality = {
    normal: reddit_keymap
};


define_page_mode("reddit_mode",
                 $display_name = "reddit",
                 $enable = function (buffer) {
                     let (cmds = ["follow-current",
                                  "follow-current-new-buffer",
                                  "follow-current-new-buffer-background",
                                  "follow-current-new-window",
                                  "copy"]) {
                         for each (var c in cmds) {
                             buffer.default_browser_object_classes[c] =
                                 browser_object_reddit_current;
                         }
                     }
                     buffer.content_modalities.push(reddit_modality);
                 },
                 $disable = function (buffer) {
                     var i = buffer.content_modalities.indexOf(reddit_modality);
                     if (i > -1)
                         buffer.content_modalities.splice(i, 1);
                 },
                 $doc = "reddit page-mode: keyboard navigation for reddit.");

let (re = build_url_regex($domain = /([a-zA-Z0-9\-]*\.)*reddit/)) {
    auto_mode_list.push([re, reddit_mode]);
};

provide("reddit");
