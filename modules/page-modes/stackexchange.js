/**
 * (C) Copyright 2010 Dave Kerschner
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
 *
 * StackExchange page mode
 *
 * My attempt to add the ability to vote on stack exchange sites with out
 * having to grab the mouse.
 */

in_module(null);

/**
 * browser_object_class that finds the vote images
 */
define_browser_object_class("stackexchange-votes",
    "Browser object class for selecting a vote arrow via hinting.",
                            xpath_browser_object_handler('//span[contains(@class,"vote-up-off")]' +
                                  ' | //span[contains(@class,"vote-down-off")]'),
     $hint = "select a vote");

interactive("stackexchange-vote",
    "Vote on StackExchange sites",
    function (I) {
        var elem = yield read_browser_object(I);
        dom_node_click(elem, 1, 1);
    },
    $browser_object = browser_object_stackexchange_votes);

define_keymap("stackexchange_keymap");
define_key(stackexchange_keymap, "V", "stackexchange-vote");

function stackexchange_modality (buffer, element) {
    if (! buffer.input_mode)
        buffer.keymaps.push(stackexchange_keymap);
}

define_page_mode("stackexchange_mode",
    $display_name = "StackExchange",
    $enable = function (buffer) {
        buffer.modalities.push(stackexchange_modality);
    },
    $disable = function (buffer) {
         var i = buffer.modalities.indexOf(stackexchange_modality);
         if (i > -1)
             buffer.modalities.splice(i, 1);
    });

auto_mode_list.push([/^https?:\/\/(?:www.|meta.)?(stackoverflow|serverfault|superuser|stackapps)\.(?:com)\//,
    stackexchange_mode]);

provide("stackexchange");
