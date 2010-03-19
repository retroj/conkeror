/**
 * (C) Copyright 2010 Dave Kerschner
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
 *
 * StackOverflow page mode
 *
 * My attempt to add the ability to vote on stack exchange sites with out
 * having to grab the mouse.
 */

in_module(null);

/**
 * browser_object_class that finds the vote images
 */
define_browser_object_class("stackoverflow-votes",
    "Browser object class for selecting a vote arrow via hinting.",
     xpath_browser_object_handler('//img[@class="vote-up"]' +
                                  ' | //img[@class="vote-down"]'),
     $hint = "select a vote");

interactive("stackoverflow-vote",
    "Vote on StackOverflow",
    function (I) {
        var elem = yield read_browser_object(I);
        dom_node_click(elem, 1, 1);
    },
    $browser_object = browser_object_stackoverflow_votes);

define_keymap("stackoverflow_keymap");
define_key(stackoverflow_keymap, "V", "stackoverflow-vote");

function stackoverflow_modality (buffer, element) {
    if (! buffer.input_mode)
        buffer.keymaps.push(stackoverflow_keymap);
}

define_page_mode("stackoverflow_mode",
    $display_name = "StackOverflow",
    $enable = function (buffer) {
        buffer.modalities.push(stackoverflow_modality);
    },
    $disable = function (buffer) {
         var i = buffer.modalities.indexOf(stackoverflow_modality);
         if (i > -1)
             buffer.modalities.splice(i, 1);
    });

auto_mode_list.push([/^https?:\/\/(?:www.|meta.)?(stackoverflow|serverfault|superuser)\.(?:com)\//,
    stackoverflow_mode]);

provide("stackoverflow");
