/**
 * (C) Copyright 2009-2011 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("content-buffer.js");

function dom_click_xpath (doc, xpath) {
    var iter = doc.evaluate(xpath,
                            doc,
                            xpath_lookup_namespace,
                            Ci.nsIDOMXPathResult.FIRST_ORDERED_NODE_TYPE ,
                            null);
    var node = iter.singleNodeValue;
    if (node) {
        var rect = node.getBoundingClientRect();
        dom_node_click(node, rect.left + 1, rect.top + 1);
    }
}

interactive("google-maps-zoom-in",
    "Zoom in on a google map",
    function (I) {
        dom_click_xpath(I.buffer.document,
                        "//div[@guidedhelpid='zoom_in']/div[@title]");
    });

interactive("google-maps-zoom-out",
    "Zoom out on a google map",
    function (I) {
        dom_click_xpath(I.buffer.document,
                        "//div[@guidedhelpid='zoom_out']/div[@title]");
    });

interactive("google-maps-pan-left",
    "Pan a google map left",
    function (I) {
        dom_click_xpath(I.buffer.document,
                        "//div[@log='pan_lt']");
    });

interactive("google-maps-pan-right",
    "Pan a google map right",
    function (I) {
        dom_click_xpath(I.buffer.document,
                        "//div[@log='pan_rt']");
    });

interactive("google-maps-pan-up",
    "Pan a google map up",
    function (I) {
        dom_click_xpath(I.buffer.document,
                        "//div[@log='pan_up']");
    });

interactive("google-maps-pan-down",
    "Pan a google map down",
    function (I) {
        dom_click_xpath(I.buffer.document,
                        "//div[@log='pan_down']");
    });

define_keymap("google_maps_keymap", $display_name = "google-maps");
define_key(google_maps_keymap, "C-c +",   "google-maps-zoom-in");
define_key(google_maps_keymap, "C-c -",   "google-maps-zoom-out");
define_key(google_maps_keymap, "C-f", "google-maps-pan-right");
define_key(google_maps_keymap, "C-b", "google-maps-pan-left");
define_key(google_maps_keymap, "C-n", "google-maps-pan-down");
define_key(google_maps_keymap, "C-p", "google-maps-pan-up");

define_keymaps_page_mode("google-maps-mode",
    build_url_regexp($domain = "maps.google"),
    { normal: google_maps_keymap },
    $display_name = "Google Maps");

page_mode_activate(google_maps_mode);

provide("google-maps");
