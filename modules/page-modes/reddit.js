/**
 * (C) Copyright 2008 Martin Dybdal
 * (C) Copyright 2009-2010,2012 John Foerch
 * (C) Copyright 2013 Joren Van Onder
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

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
            "@-moz-document url-prefix(http://www.reddit.com/)," +
		"url-prefix(https://pay.reddit.com) {" +
                "body>.content .last-clicked {" +
                " background-color: #bfb !important;" +
                " border: 0px !important;"+
                "}}"));


/**
 * Scroll, if necessary, to make the given element visible
 */
function reddit_scroll_into_view (window, element) {
    var rect = element.getBoundingClientRect();
    if (rect.top < 0 || rect.bottom > window.innerHeight)
        element.scrollIntoView();
}


/**
 * Select the next entry down from the currently highlighted one.
 * Checks the URL to figure out if one a link page or comment page.
 */
function reddit_next (I) {
    var doc = I.buffer.document;
    if (doc.URL.search("/comments/") == -1) {
        // Not on comment page, so highlight next link
        reddit_next_link(I);
    } else {
        // On comment page, so highlight next comment
        reddit_next_comment(I, true);
    }
}
interactive("reddit-next",
    "Move the 'cursor' to the next reddit entry.",
    reddit_next);


/**
 * Selects the next parent comment if on a comment page.
 */
function reddit_next_parent_comment (I) {
    var doc = I.buffer.document;
    if (doc.URL.search("/comments/") != -1)
        reddit_next_comment(I, false);
}
interactive("reddit-next-parent-comment",
    "Move the 'cursor' to the next comment which isn't "+
    "a child of another comment.",
    reddit_next_parent_comment);


/**
 * Move select the next link down from the currently highlighted one.
 * When the end of the page is reached, the behavior is controlled by
 * the variable reddit_end_behavior.
 */
function reddit_next_link (I) {
    var doc = I.buffer.document;
    // the behavior of this command depends on whether we have downloaded
    // enough of the page to include all of the article links.
    var complete = doc.getElementsByClassName('footer').length > 0;
    var links = doc.querySelectorAll("body>.content .link");
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
    if (! first || (current && !next && !complete))
        return;
    if (! next) {
        if (current) {
            if (reddit_end_behavior == 'stop')
                return;
            if (reddit_end_behavior == 'wrap')
                next = first;
            if (reddit_end_behavior == 'page') {
                let (xpr = doc.evaluate(
                    '//p[@class="nextprev"]/a[contains(text(),"next")]', doc, null,
                    Ci.nsIDOMXPathResult.ORDERED_NODE_ITERATOR_TYPE, null))
                {
                    var nextpage;
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
    var anchor = doc.querySelector("body>.content .last-clicked a.title");
    browser_set_element_focus(I.buffer, anchor);
    reddit_scroll_into_view(I.buffer.focused_frame, next);
}
interactive("reddit-next-link",
    "Move the 'cursor' to the next reddit link.",
    reddit_next_link);


/**
 * Checks if comment is a child of parent. Used on collapsed
 * parents, to determine whether the child should be selected or
 * not.
 */
function comment_is_child (parent, comment) {
    var parent_comments = parent.querySelectorAll(".comment");
    for (var i = 0, llen = parent_comments.length; i < llen; i++) {
        if (parent_comments[i].getAttribute("data-fullname") ==
            comment.getAttribute("data-fullname"))
        {
            return true;
        }
    }
    return false;
}


/**
 * Returns entries (top link + comments) that are visible (are not
 * collapsed).
 */
function get_entries_without_collapsed_comments (entries) {
    var entries_without_collapsed = [];
    var collapsed_parent = null;
    for (var i = 0, elen = entries.length; i < elen; i++) {
        if (collapsed_parent) {
            // Discard the 'load more comments' buttons
            var current_classname = entries[i].getElementsByTagName("span")[0].className;
            if (!comment_is_child(collapsed_parent, entries[i].parentNode) &&
                current_classname != "morecomments")
            {
                collapsed_parent = null;
            } else { // Skip collapsed comments
                continue;
            }
        }
        // Collapsed comment
        if (i != 0 &&
            entries[i].getElementsByTagName("div")[1].style.display == "none")
        {
            collapsed_parent = entries[i].parentNode;
        }
        entries_without_collapsed.push(entries[i]);
    }
    return entries_without_collapsed;
}


/**
 * Select the next comment down from the currently highlighted one.
 * When select_all_comments is true, select the next comment. When
 * it's false select the next comment which isn't a child of another
 * comment.
 */
function reddit_next_comment (I, select_all_comments) {
    var doc = I.buffer.document;
    // Get all comments plus the top link
    var entries = doc.querySelectorAll("body>.content .entry");
    // Remove all the collapsed comments
    entries = get_entries_without_collapsed_comments(entries);
    // Get the div which contains all comments
    var comments_div = doc.getElementsByClassName("nestedlisting")[0];
    var first = null;
    var current = null;
    var next = null;
    for (var i = 0, elen = entries.length; i < elen && !next; i++) {
        var parent_div_current = entries[i].parentNode.parentNode;
        // Next link/comment can be selected if either:
        //  1) All comments have to be selected
        //  2) It's the first entry, which is the top link
        //  3) It's a top level comment
        if (select_all_comments || i == 0 ||
            parent_div_current.id == comments_div.id)
        {
            if (! first)
                first = entries[i];
            if (current)
                next = entries[i];
        }
        if (entries[i].className.indexOf("last-clicked") >= 0)
            current = entries[i];
    }
    // There are no comments on the page
    if (! first)
        return;
    // Last comment on page, try to load more
    if (current && ! next) {
        var load_more_link = comments_div.querySelector(
            ".nestedlisting > .morechildren .button");
        if (load_more_link) {
            // Go to the previous comment first, since the current one will disappear
            reddit_prev_comment(I, true);
            browser_object_follow(I.buffer, FOLLOW_DEFAULT, load_more_link);
        }
        return;
    }
    // No next yet, because there is no current. So make the first entry the next one
    if (! next)
        next = first;
    // Dehighlight old
    if (current)
        dom_remove_class(current, "last-clicked");
    // Highlight the next comment
    dom_add_class(next, "last-clicked");
    // Focus the link on the comment page
    var anchor = doc.querySelector("body>.content .last-clicked a.title");
    browser_set_element_focus(I.buffer, anchor);
    reddit_scroll_into_view(I.buffer.focused_frame, next);
}
interactive("reddit-next-comment",
    "Move the 'cursor' to the next reddit comment.",
    reddit_next_comment);


/**
 * Select the next entry up from the currently highlighted one.
 * Checks the URL to figure out if one a link page or comment page.
 */
function reddit_prev (I) {
    var doc = I.buffer.document;
    if (doc.URL.search("/comments/") == -1) {
        // Not on comment page, so highlight prev link
        reddit_prev_link(I);
    } else {
        // On comment page, so highlight prev comment
        reddit_prev_comment(I, true);
    }
}
interactive("reddit-prev",
    "Move the 'cursor' to the previous reddit entry.",
    reddit_prev);


function reddit_prev_parent_comment (I) {
    var doc = I.buffer.document;
    if (doc.URL.search("/comments/") != -1)
        reddit_prev_comment(I, false);
}
interactive("reddit-prev-parent-comment",
    "Move the 'cursor' to the previous comment which isn't "+
    "a child of another comment.",
    reddit_prev_parent_comment);


/**
 * Select the link before the currently highlighted one.  When the
 * beginning of the page is reached, behavior is controlled by the
 * variable reddit_end_behavior.
 */
function reddit_prev_link (I) {
    var doc = I.buffer.document;
    // the behavior of this command depends on whether we have downloaded
    // enough of the page to include all of the article links.
    var complete = doc.getElementsByClassName('footer').length > 0;
    var links = doc.querySelectorAll("body>.content .link");
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
    {
        return;
    }
    if (! prev) {
        // the first visible link is the `current' link.
        // dispatch on reddit_end_behavior.
        if (reddit_end_behavior == 'stop') {
            return;
        } else if (reddit_end_behavior == 'wrap') {
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
                '//p[@class="nextprev"]/a[contains(text(),"prev")]', doc, null,
                Ci.nsIDOMXPathResult.ORDERED_NODE_ITERATOR_TYPE, null))
            {
                var prevpage;
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
    var anchor = doc.querySelector("body>.content .last-clicked a.title");
    browser_set_element_focus(I.buffer, anchor);
    reddit_scroll_into_view(I.buffer.focused_frame, prev);
}
interactive("reddit-prev-link",
    "Move the 'cursor' to the previous reddit link.",
    reddit_prev_link);


/**
 * Select the prev comment down from the currently highlighted
 * one.  When select_all_comments is true, select the previous
 * comment. When it's false select the previous comment which
 * isn't a child of another comment.
 */
function reddit_prev_comment (I, select_all_comments) {
    var doc = I.buffer.document;
    // Get all comments plus the top link
    var entries = doc.querySelectorAll("body>.content .entry");
    // Remove all the collapsed comments
    entries = get_entries_without_collapsed_comments(entries);
    // Get the div which contains all comments
    var comments_div = doc.getElementsByClassName("nestedlisting")[0];
    var current = null;
    var prev = null;
    var prev_parent = null;
    for (var i = 0, elen = entries.length; i < elen && !current; i++) {
        if (entries[i].className.indexOf("last-clicked") >= 0) {
            current = entries[i];
            // Don't bother if the top link is selected, since
            // that means there is no previous entry
            if (i != 0) {
                if (select_all_comments)
                    prev = entries[i - 1];
                else
                    prev = prev_parent;
            }
        }
        var parent_div_current = entries[i].parentNode.parentNode;
        // Remember the last parent comment and consider the top
        // link to be a parent comment
        if (i == 0 || parent_div_current.id == comments_div.id)
            prev_parent = entries[i];
    }
    // Nothing is selected yet or there are no comments on the page.
    if (! prev)
        return;
    // Dehighlight old
    if (current)
        dom_remove_class(current, "last-clicked");
    // Highlight the prev comment
    dom_add_class(prev, "last-clicked");
    reddit_scroll_into_view(I.buffer.focused_frame, prev);
}
interactive("reddit-prev-comment",
    "Move the 'cursor' to the previous reddit comment.",
    reddit_prev_comment);


function reddit_open_comments (I, target) {
    var doc = I.buffer.document;
    var link = doc.querySelector("body>.content .last-clicked a.comments");
    if (link)
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
    var doc = I.buffer.document;
    if (doc.URL.search("/comments/") == -1)
        reddit_vote_link(I, true);
    else
        reddit_vote_comment(I, true);
}
interactive("reddit-vote-up",
    "Vote the currently selected entry up.",
    reddit_vote_up);


function reddit_vote_down (I) {
    var doc = I.buffer.document;
    if (doc.URL.search("/comments/") == -1)
        reddit_vote_link(I, false);
    else
        reddit_vote_comment(I, false);
}
interactive("reddit-vote-down",
    "Vote the currently selected entry down.",
    reddit_vote_down);


function reddit_vote_link (I, upvote) {
    // get the current article and send a click to its vote button.
    var doc = I.buffer.document;
    if (upvote)
        var arrow_class = ".up";
    else
        arrow_class = ".down";
    var link = doc.querySelector(
        "body>.content .last-clicked .midcol " + arrow_class);
    if (link)
        browser_object_follow(I.buffer, FOLLOW_DEFAULT, link);
}

function reddit_vote_comment (I, upvote) {
    // get the current entry and send a click to its vote button.
    var doc = I.buffer.document;
    var link = doc.querySelector("body>.content .last-clicked");
    if (upvote)
        var arrow_class = ".up";
    else
        arrow_class = ".down";
    // Is there anything selected?
    if (link && link.getElementsByTagName("span")[0].className != "morecomments") {
        // Get the vote arrow
        link = link.parentNode.getElementsByClassName("midcol")[0]
            .querySelector(arrow_class);
        if (link)
            browser_object_follow(I.buffer, FOLLOW_DEFAULT, link);
    }
}

define_browser_object_class("reddit-current",
    null,
    function (I, prompt) {
        var doc = I.buffer.document;
        var link = doc.querySelector("body>.content .last-clicked .entry p.title a");
        yield co_return(link);
    });


define_keymap("reddit_keymap", $display_name = "reddit");
define_key(reddit_keymap, "j", "reddit-next");
define_key(reddit_keymap, "J", "reddit-next-parent-comment");
define_key(reddit_keymap, "k", "reddit-prev");
define_key(reddit_keymap, "K", "reddit-prev-parent-comment");
define_key(reddit_keymap, ",", "reddit-vote-up");
define_key(reddit_keymap, ".", "reddit-vote-down");
define_key(reddit_keymap, "h", "reddit-open-comments");


var reddit_link_commands =
    ["follow-current", "follow-current-new-buffer",
     "follow-current-new-buffer-background",
     "follow-current-new-window", "copy"];


var reddit_modality = {
    normal: reddit_keymap
};


define_page_mode("reddit-mode",
    build_url_regexp($domain = /([a-zA-Z0-9\-]*\.)*reddit/),
    function enable (buffer) {
        for each (var c in reddit_link_commands) {
            buffer.default_browser_object_classes[c] =
                browser_object_reddit_current;
        }
        buffer.content_modalities.push(reddit_modality);
    },
    function disable (buffer) {
        for each (var c in reddit_link_commands) {
            delete buffer.default_browser_object_classes[c];
        }
        var i = buffer.content_modalities.indexOf(reddit_modality);
        if (i > -1)
            buffer.content_modalities.splice(i, 1);
    },
    $display_name = "reddit",
    $doc = "reddit page-mode: keyboard navigation for reddit.");

page_mode_activate(reddit_mode);

provide("reddit");
