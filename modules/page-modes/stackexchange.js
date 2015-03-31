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

define_keymaps_page_mode("stackexchange-mode",
    /^https?:\/\/(?:www.|meta.)?(stackoverflow|serverfault|superuser|stackapps)\.(?:com)\//,
    { normal: stackexchange_keymap },
    $display_name = "StackExchange");

page_mode_activate(stackexchange_mode);

provide("stackexchange");
