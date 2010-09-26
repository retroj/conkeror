/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 * (C) Copyright 2009-2010 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

require("content-buffer.js");


define_keymap("google_search_results_keymap", $display_name = "google-search-results");

// Keys for the "experimental" keyboard search
define_key(google_search_results_keymap, "j", "ensure-content-focused", $fallthrough);
define_key(google_search_results_keymap, "k", "ensure-content-focused", $fallthrough);
define_key(google_search_results_keymap, "o", "ensure-content-focused", $fallthrough);
define_key(google_search_results_keymap, "/", "ensure-content-focused", $fallthrough);
define_key(google_search_results_keymap, "return", "ensure-content-focused", $fallthrough);//BAD

/**
 * Note: escape already does the same thing as the Google key binding.
 */

define_browser_object_class("google-search-results-links", null,
    xpath_browser_object_handler("//a[@class='l']|//a[@class='l vst']"),
    $hint = "select search result");


// Bind keys 1 through 9 to follow corresponding results links
//
define_browser_object_class("google-search-result-by-digit", null,
    function (I, prompt) {
        var doc = I.buffer.document;
        var digit = I.event.charCode - 48;
        var res = doc.evaluate("//a[parent::node()/@class='r']", doc, null,
                               Ci.nsIDOMXPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                               null);
        yield co_return(res.snapshotItem(digit - 1));
    });

function google_search_bind_number_shortcuts () {
    for (var j = 1; j <= 9; j++) {
        let o = j;
        var function_name = "gsearch-follow-result-" + j;
        interactive(function_name,
                    "Follow google search result number " + j,
                    "follow",
                    $browser_object = browser_object_google_search_result_by_digit);
        define_key(google_search_results_keymap, String(j), function_name);
    }
}


var google_search_results_modality = {
    normal: google_search_results_keymap
};


define_page_mode("google_search_results_mode",
                 $display_name = "Google Search Results",
                 $enable = function (buffer) {
		     var link_using_commands = ["follow",
						"follow-new-buffer",
						"follow-new-buffer-background",
						"follow-new-window",
						"save",
						"copy",
						"shell-command-on-file"];
		     for each (var c in link_using_commands)
			 buffer.default_browser_object_classes[c] =
			     browser_object_google_search_results_links;
                     buffer.content_modalities.push(google_search_results_modality);
                 },
                 $disable = function (buffer) {
                     var i = buffer.content_modalities.indexOf(google_search_results_modality);
                     if (i > -1)
                         buffer.content_modalities.splice(i, 1);
                 });

let (google_search_re = build_url_regex(
         $domain = "google",
         $allow_www = true,
         $path = "search?",
         $tlds = ["com", "com.au", "co.uk", "de", "dk", "es",
                  "fr", "it", "no", "se", "uk"])) {
    auto_mode_list.push([google_search_re, google_search_results_mode]);
};

provide("google-search-results");
