/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("window.js");
require("utils.js");

if (!extension_is_enabled("{d10d0bf8-f5b5-c8b4-a8b2-2b9879e08c5d}"))
    throw skip_module_load;

var adblockplus_service = Cc["@mozilla.org/adblockplus;1"].createInstance().wrappedJSObject;

function adblockplus_settings(buffer, uri_string) {
    var frame = null;
    if (buffer)
        frame = buffer.top_frame;

    adblockplus_service.openSettingsDialog(frame, uri_string);
}
interactive("adblockplus-settings", "Show the Adblock Plus settings dialog.",
            function (I) { adblockplus_settings(I.buffer); });

default_browser_object_classes.adblock = "images";

interactive("adblockplus-add", "Add a pattern to Adblock Plus.",
            function (I) {
    var element = yield I.read_browser_object("adblock", "Adblock");

    var spec = element_get_load_spec(element);
    if (spec == null)
        throw interactive_error("Element has no associated URI");

    var pattern = yield I.minibuffer.read_url(
        $prompt = "Adblock:",
        $initial_value = load_spec_uri_string(spec),
        $history = "url");

    adblockplus_service.addPatterns([pattern]);

    I.buffer.web_navigation.reload(Ci.nsIWebNavigation.LOAD_FLAGS_NONE);
});
