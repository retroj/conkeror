/**
 * (C) Copyright 2009 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

require("content-buffer.js");

function google_maps_control (buffer, xpath) {
    var doc = buffer.document;
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

function define_google_maps_command (name, doc, control) {
    interactive("google-maps-" + name, doc, function(I) {
                google_maps_control(I.buffer, "//div[@log='" + control + "']");
                });
}
ignore_function_for_get_caller_source_code_reference("define_google_maps_command");

function define_google_maps_zoom_command (name, doc, control_container) {
    // In order to find the right element, this function abuses the fact
    // that google provides mouse-over text for the buttons in the
    // interface.
    interactive("google-maps-" + name, doc, function(I) {
                google_maps_control(I.buffer, "//div[@id='" + control_container + "']/div[@title]");
       });
}
ignore_function_for_get_caller_source_code_reference("define_google_maps_zoom_command");

define_google_maps_zoom_command('zoom-in', "Zoom in on a google map", 'lmcslider');
define_google_maps_zoom_command('zoom-out', "Zoom out on a google map", 'lmczo');
define_google_maps_command('pan-left', "Pan a google map left", 'pan_lt');
define_google_maps_command('pan-right', "Pan a google map right", 'pan_rt');
define_google_maps_command('pan-up', "Pan a google map up", 'pan_up');
define_google_maps_command('pan-down', "Pan a google map down", 'pan_down');

define_keymap("google_maps_keymap");
define_key(google_maps_keymap, "+",   "google-maps-zoom-in");
define_key(google_maps_keymap, "-",   "google-maps-zoom-out");
define_key(google_maps_keymap, "C-f", "google-maps-pan-right");
define_key(google_maps_keymap, "C-b", "google-maps-pan-left");
define_key(google_maps_keymap, "C-n", "google-maps-pan-down");
define_key(google_maps_keymap, "C-p", "google-maps-pan-up");

function google_maps_modality (buffer, element) {
    if (! buffer.input_mode)
        buffer.keymaps.push(google_maps_keymap);
}

define_page_mode("google_maps_mode",
                 $display_name = "Google Maps",
                 $enable = function (buffer) {
                     buffer.modalities.push(google_maps_modality);
                 },
                 $disable = function (buffer) {
                     var i = buffer.modalities.indexOf(google_maps_modality);
                     if (i > -1)
                         buffer.modalities.splice(i, 1);
                 });

var google_maps_re = build_url_regex($domain = "maps.google");
auto_mode_list.push([google_maps_re, google_maps_mode]);

provide("google-maps");
