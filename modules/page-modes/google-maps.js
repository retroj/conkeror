require("content-buffer.js");
require("bindings/default/content-buffer/normal.js");

function google_maps_control(buffer, control) {
    var doc = buffer.document;
    let iter = doc.evaluate("//div[@log='" + control + "']",
                            doc,
                            xpath_lookup_namespace,
                            Ci.nsIDOMXPathResult.FIRST_ORDERED_NODE_TYPE ,
                            null);
    let node = iter.singleNodeValue;
    if(node) {
        var rect = node.getBoundingClientRect();
        browser_follow_link_with_click(buffer, node, rect.left + 1, rect.top + 1);
    }
}

function define_google_maps_command(name, doc, control) {
    interactive("google-maps-" + name, doc, function(I) {
                google_maps_control(I.buffer, control);
                });
}
ignore_function_for_get_caller_source_code_reference("define_google_maps_command");

define_google_maps_command('zoom-in', "Zoom in on a google map", 'zi');
define_google_maps_command('zoom-out', "Zoom out of a google map", 'zo');
define_google_maps_command('pan-left', "Pan a google map left", 'pan_lt');
define_google_maps_command('pan-right', "Pan a google map right", 'pan_rt');
define_google_maps_command('pan-up', "Pan a google map up", 'pan_up');
define_google_maps_command('pan-down', "Pan a google map down", 'pan_down');

define_keymap("google_maps_keymap", $parent = content_buffer_normal_keymap);
define_key(google_maps_keymap, "+",   "google-maps-zoom-in");
define_key(google_maps_keymap, "-",   "google-maps-zoom-out");
define_key(google_maps_keymap, "C-f", "google-maps-pan-right");
define_key(google_maps_keymap, "C-b", "google-maps-pan-left");
define_key(google_maps_keymap, "C-n", "google-maps-pan-down");
define_key(google_maps_keymap, "C-p", "google-maps-pan-up");


define_page_mode("google_maps_mode", "Google Maps", $enable = function(buffer) {
                     buffer.local_variables.content_buffer_normal_keymap = google_maps_keymap;
                 });

var google_maps_re = build_url_regex($domain = "maps.google");
auto_mode_list.push([google_maps_re, google_maps_mode]);
