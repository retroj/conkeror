/**
 * (C) Copyright 2010 Dave Kerschner
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
 *
 * StackExchange page mode
 *
 * Provides ability to vote on Stack Exchange sites without having to grab
 * the mouse.
 */

/**
 * browser_object_class that finds the vote images
 */
define_browser_object_class("stackexchange-votes",
    "Browser object class for selecting a vote arrow via hinting.",
    xpath_browser_object_handler('//a[contains(@class,"vote-up-off")]' +
                                 ' | //a[contains(@class,"vote-down-off")]'),
    $hint = "select a vote");

define_browser_object_class("stackexchange-accept-answers",
    "Browser object class for selecting an accepted answer check via hinting.",
    xpath_browser_object_handler('//a[contains(@class,"vote-accepted-off")]'),
    $hint = "select an accepted answer");


interactive("stackexchange-vote",
    "Vote on StackExchange sites",
    function (I) {
        var elem = yield read_browser_object(I);
        dom_node_click(elem, 1, 1);
    },
    $browser_object = browser_object_stackexchange_votes);

interactive("stackexchange-accept-answer",
    "Accept an answer on StackExchange site",
    function (I) {
        var elem = yield read_browser_object(I);
        dom_node_click(elem, 1, 1);
    },
    $browser_object = browser_object_stackexchange_accept_answers);

interactive("stackexchange-favorite-question",
    "Favorite a question on StackExchange site",
    function (I) {
        var xpr = I.buffer.document.evaluate(
            '//a[contains(@class,"star-off")]',
            I.buffer.document, null,
            Ci.nsIDOMXPathResult.ORCERD_NOTE_ITERATOR_TYPE, null);
        let elem;
        if(xpr && (elem = xpr.iterateNext())) {
            dom_node_click(elem, 1, 1);
        }
    });


define_keymap("stackexchange_keymap", $display_name = "stackexchange");
define_key(stackexchange_keymap, "V", "stackexchange-vote");
define_key(stackexchange_keymap, "A", "stackexchange-accept-answer");
define_key(stackexchange_keymap, "O", "stackexchange-favorite-question");

[// Site-wide shortcuts
    "?",   // Bring up the help dialog
    "a",   // ask question
    "b",   // badges
    "c",   // chat
    "e",   // edit
    "f",   // Freshly Updated
    "g",   // Goto
    "h",   // home page
    "i",   // Inbox
    "j",   // Next
    "k",   // Previous
    "l",   // link
    "m",   // meta site
    "n",   // unanswered
    "o",   // Order by
    "p",   // my profile
    "q",   // questions
    "r",   // Recent
    "s",   // Search
    "t",   // tags
    "u",   // First question
    "v",   // vote...
    "0", "1", "2", "3", "4",
    "5", "6", "7", "8", "9",
    "return"
].map(function (x) define_key(stackexchange_keymap, x, null, $fallthrough));

define_keymaps_page_mode("stackexchange-mode",
    /^https?:\/\/(?:www\.|meta\.)?(stackoverflow|[a-z]+\.stackexchange|serverfault|superuser|stackapps)\.(?:com)\/(?!review|users)/,
    { normal: stackexchange_keymap },
    $display_name = "StackExchange");

page_mode_activate(stackexchange_mode);

provide("stackexchange");
