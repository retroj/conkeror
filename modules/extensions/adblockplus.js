/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

var adblockplus_service = Cc["@mozilla.org/adblockplus;1"]
    .createInstance().wrappedJSObject;

function adblockplus_settings (buffer, uri_string) {
    var frame = null;
    if (buffer)
        frame = buffer.top_frame;
    adblockplus_service.openSettingsDialog(frame, uri_string);
}
interactive("adblockplus-settings",
    "Show the Adblock Plus settings dialog.",
    function (I) { adblockplus_settings(I.buffer); });


interactive("adblockplus-add",
    "Add a pattern to Adblock Plus.",
    function (I) {
        var element = yield read_browser_object(I);
        var spec = load_spec(element);
        var pattern = yield I.minibuffer.read_url(
            $prompt = "Adblock:",
            $initial_value = load_spec_uri_string(spec),
            $history = "url");
        adblockplus_service.addPatterns([load_spec_uri_string(pattern)]);
        I.buffer.web_navigation.reload(Ci.nsIWebNavigation.LOAD_FLAGS_NONE);
    },
    $browser_object = browser_object_images,
    $prompt = "Adblock");

provide("adblockplus");
