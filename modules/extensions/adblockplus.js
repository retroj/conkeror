/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

interactive("adblockplus-settings",
    "Show the Adblock Plus settings dialog.",
    function (I) {
        if (! ("@adblockplus.org/abp/public;1" in Cc))
            throw interactive_error("Adblock Plus not found");
        make_chrome_window("chrome://adblockplus/content/ui/settings.xul");
    });

interactive("adblockplus-filters",
    "Show the Adblock Plus filter settings dialog.",
    function (I) {
        if (! ("@adblockplus.org/abp/public;1" in Cc))
            throw interactive_error("Adblock Plus not found");
        make_chrome_window("chrome://adblockplus/content/ui/filters.xul");
    });

interactive("adblockplus-add",
    "Add a pattern to Adblock Plus.",
    function (I) {
        if (! ("@adblockplus.org/abp/public;1" in Cc))
            throw interactive_error("Adblock Plus not found");

        // Access the API per the instructions here:
        // https://adblockplus.org/en/IAdblockPlus
        var abpURL = Components.classes["@adblockplus.org/abp/public;1"]
            .getService(Components.interfaces.nsIURI);
        var AdblockPlus = Components.utils.import(abpURL.spec, null).AdblockPlus;

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
