/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);


function adblockplus_settings (buffer, uri_string) {
    if (! ("@adblockplus.org/abp/startup;1" in Cc))
        throw interactive_error("Adblock Plus not found");
    Components.utils.import("chrome://adblockplus-modules/content/Utils.jsm");
    var frame = null;
    if (buffer)
        frame = buffer.top_frame;
    Utils.openSettingsDialog(frame, uri_string);
}
interactive("adblockplus-settings",
    "Show the Adblock Plus settings dialog.",
    function (I) { adblockplus_settings(I.buffer); });


interactive("adblockplus-add",
    "Add a pattern to Adblock Plus.",
    function (I) {
        if (! ("@adblockplus.org/abp/startup;1" in Cc))
            throw interactive_error("Adblock Plus not found");
        Components.utils.import("chrome://adblockplus-modules/content/Public.jsm");
        var element = yield read_browser_object(I);
        var spec = load_spec(element);
        var pattern = yield I.minibuffer.read_url(
            $prompt = "Adblock:",
            $initial_value = load_spec_uri_string(spec),
            $history = "url");
        AdblockPlus.addPatterns([load_spec_uri_string(pattern)]);
        I.buffer.web_navigation.reload(Ci.nsIWebNavigation.LOAD_FLAGS_NONE);
    },
    $browser_object = browser_object_images,
    $prompt = "Adblock");

provide("adblockplus");
