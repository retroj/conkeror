/**
 * (C) Copyright 2008 Martin Dybdal
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("content-buffer.js");
require("bindings/default/content-buffer/normal.js");

/* Initially based on the greasemonkey userscript "Reddit keyboard
 * shortcuts", found on userscripts.org. But much has changed because of
 * a reddit-remake.
 */
var reddit_highlight_color = "#BFB";
default_browse_targets["reddit-open"] = "find-url";
default_browse_targets["reddit-open-comments"] = "find-url";


function reddit_highlight(elem) {
    elem.highlighted = true;
    elem.style.backgroundColor = reddit_highlight_color;
}

function reddit_dehighlight(elem) {
    elem.style.backgroundColor = elem.originalBackgroundColor;
    elem.highlighted = false;
}

function reddit_toggleHighlight(elem) {
    if(elem) {
      if(elem.highlighted)
        reddit_dehighlight(elem);
      else
        reddit_highlight(elem);
    }
}

function reddit_addGlobalStyle(document, css) {
    var head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    head.appendChild(style);
}


/* Sets up the reddit-mode for the given buffer. */
function reddit_mode_setup(buffer) {
    var document = buffer.document;
    if(document.reddit_mode_loaded) return;
    else document.reddit_mode_loaded = true;
    siteTable = document.getElementById("siteTable");
    if (!siteTable) {
        /* siteTable not found, abort. This happens e.g. when browsing the
       preferences */
        return;
    }

    // Get all divs that have a id that starts with "thingrow"
    var links = siteTable.getElementsByTagName("div");
    links = Array.filter(links, function (element) {
        var start = element.id.substr(0, 12);
        if (start === "thingrow_t3_") {

            element.articleId  = element.id.substr(12, element.id.length-12);
            element.highlighted = false;
            if(element.style.backgroundColor == "")
                element.originalBackgroundColor = "transparent";
            else
                element.originalBackgroundColor = element.style.backgroundColor;
            return true;
        }
        return false;
    });

    /* Get the last links on the page titled "next" and "prev" */
    var anchors = document.getElementsByTagName("a");
    var nextLinks = Array.filter(anchors, function (element) {
        return element.textContent && "next" === element.textContent;
    });
    var previousLinks = Array.filter(anchors, function (element) {
        return element.textContent && "prev" === element.textContent;
    });
    document.redditNextPage = nextLinks[nextLinks.length-1];
    document.redditPrevPage = previousLinks[previousLinks.length-1];

    if (!links || !links.length) {
        return;
    }
    // remove ugly white background (error in their css)
    reddit_addGlobalStyle(document, ".linkcompressed .entry .buttons li { background-color: inherit !important; }");

    var current = 0;
    var beforeLinkRegex = /^https?:\/\/([a-zA-Z0-9\-]*\.)*reddit\.com\/.*before=.*/;
    if(beforeLinkRegex.test(buffer.current_URI.spec)) {
      current = links.length-1;
      reddit_showElement(buffer, links[current]);
    }
    reddit_toggleHighlight(links[current]);

    document.redditCurrent = current;
    document.redditLinkDivs = links;
}

/* Scroll the buffer down to the specified element */
function reddit_showElement(buffer, element) {
    function getElementY(element) {
        var offsetY = 0;
        var parent;
        for (parent = element; parent; parent = parent.offsetParent) {
            if (parent.offsetTop) {
                offsetY += parent.offsetTop;
            }
        }
        return offsetY;
    }

    if(element) {
        var position = getElementY(element);
        var height = buffer.document.body.offsetHeight;
        var scrollPosition = buffer.top_frame.pageYOffset;
        if ((height + scrollPosition - position) < 10 || (position - scrollPosition) < 10) {
            buffer.top_frame.scroll(0, position);
        }
    }
}

/* Go to the next link (eventually the next page).
 */
function reddit_next(I) {
    var document = I.buffer.document;
    var links = document.redditLinkDivs;
    var current = document.redditCurrent;
    if(links !== undefined && current !== undefined) {
        if (current < (links.length - 1)) {
            reddit_toggleHighlight(links[current]);
            current++;
            reddit_toggleHighlight(links[current]);
            reddit_showElement(I.buffer, links[current]);
        }
        else if (document.redditNextPage) {
            I.buffer.window.content.location.href = document.redditNextPage.href;
        }
        document.redditCurrent = current;
    }
}

/* Go to the previous link (above). Change to the previous page if we
 * are at the top.
 */
function reddit_prev(I) {
    var document = I.buffer.document;
    var links = document.redditLinkDivs;
    var current = document.redditCurrent;
    if(links !== undefined && current !== undefined) {
        if (current > 0) {
            reddit_toggleHighlight(links[current]);
            current--;
            reddit_toggleHighlight(links[current]);
            reddit_showElement(I.buffer, links[current]);
        }
        else if (document.redditPrevPage) {
            I.buffer.window.content.location.href = document.redditPrevPage.href;
        }
        document.redditCurrent = current;
    }
}

function reddit_getArticleId(buffer) {
    if(buffer.document.redditLinkDivs !== undefined &&
       buffer.document.redditCurrent !== undefined)
        return buffer.document.redditLinkDivs[buffer.document.redditCurrent].articleId;
    else
        return false;
}


function reddit_open(I) {
    var articleId = reddit_getArticleId(I.buffer);
    if(articleId) {
        var dest = "http://reddit.com/goto?id=" + articleId;
        open_in_browser(I.buffer, I.browse_target("reddit-open"), dest);
    }
}

function reddit_open_comments(I) {
    var articleId = reddit_getArticleId(I.buffer);
    if(articleId) {
        var dest = "http://reddit.com/info/" + articleId + "/comments/";
        open_in_browser(I.buffer, I.browse_target("reddit-open-comments"), dest);
    }
}

function reddit_mod_up (I) {
    var articleId = reddit_getArticleId(I.buffer);
    if(articleId)
        I.buffer.top_frame.wrappedJSObject.mod("t3_" + articleId, 1);
}

function reddit_mod_down(I) {
    var articleId = reddit_getArticleId(I.buffer);
    if(articleId)
        I.buffer.top_frame.wrappedJSObject.mod("t3_" + articleId, 0);
}

interactive("reddit-next-link",
            "Move the 'cursor' to the next reddit entry.",
            reddit_next);

interactive("reddit-prev-link",
            "Move the 'cursor' to the previous reddit entry.",
            reddit_prev);

interactive("reddit-open-current",
            "Open the currently selected link.",
            reddit_open);

interactive("reddit-open-comments",
            "Open the comments-page associated with the currently selected link.",
            reddit_open_comments);

interactive("reddit-vote-up",
            "Vote the currently selected link up.",
            reddit_mod_up);

interactive("reddit-vote-down",
            "Vote the currently selected link down.",
            reddit_mod_down);

/* Creating the keymap */
define_keymap("reddit_keymap", $parent = content_buffer_normal_keymap);
define_key(reddit_keymap, "j", "reddit-next-link");
define_key(reddit_keymap, "k", "reddit-prev-link");
define_key(reddit_keymap, ",", "reddit-vote-up");
define_key(reddit_keymap, ".", "reddit-vote-down");

define_key(reddit_keymap, "o", "reddit-open-current");
define_key(reddit_keymap, "h", "reddit-open-comments");

/* Setting up and tearing down the mode */

function enable_reddit_mode(buffer) {
  var doc = buffer.document;
  if(doc.redditCurrent != null)
    reddit_highlight(doc.redditLinkDivs[doc.redditCurrent]);
  buffer.local_variables.content_buffer_normal_keymap = reddit_keymap;
  add_hook.call(buffer, "content_buffer_finished_loading_hook", reddit_mode_setup);
}

function disable_reddit_mode(buffer) {
  var doc = buffer.document;

  if(doc.redditCurrent != null)
    reddit_dehighlight(doc.redditLinkDivs[doc.redditCurrent]);
  remove_hook.call(buffer, "content_buffer_finished_loading_hook", reddit_mode_setup);
}

define_page_mode("reddit_mode", "reddit",
                 $enable = enable_reddit_mode,
                 $disable = disable_reddit_mode,
                 $doc = "reddit page-mode: keyboard navigation for reddit.");

var reddit_re = build_url_regex($domain = /([a-zA-Z0-9\-]*\.)*reddit/);
auto_mode_list.push([reddit_re, reddit_mode]);
