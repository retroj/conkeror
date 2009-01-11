/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("content-buffer.js");
require("bindings/default/content-buffer/normal.js");

define_keymap("google_search_results_keymap", $parent = content_buffer_normal_keymap);

// Keys for the "experimental" keyboard search
define_key(google_search_results_keymap, "j", "ensure-content-focused", $fallthrough);
define_key(google_search_results_keymap, "k", "ensure-content-focused", $fallthrough);
define_key(google_search_results_keymap, "o", "ensure-content-focused", $fallthrough);
define_key(google_search_results_keymap, "/", "ensure-content-focused", $fallthrough);
define_key(google_search_results_keymap, "return", "ensure-content-focused", $fallthrough);

/**
 * Note: escape already does the same thing as the Google key binding.
 */

define_browser_object_class(
    "google-search-results-links",
    "Google search result",
    null,
    xpath_browser_object_handler("//a[@class='l']"));


// Bind keys 1 through 9 to follow corresponding results links
//
define_browser_object_class(
    "google-search-result-by-digit", "Google Search Result", null,
    function (I, prompt) {
        check_buffer(I.buffer, content_buffer);
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


define_page_mode("google_search_results_mode", "Google Search Results",
                 $enable = function (buffer) {
                     buffer.local_variables.content_buffer_normal_keymap = google_search_results_keymap;
                     buffer.default_browser_object_classes = {
                         follow: browser_object_google_search_results_links,
                         copy: browser_object_google_search_results_links,
                         save: browser_object_google_search_results_links };
                     buffer.default_browser_object_classes['shell-command-on-file'] =
                         browser_object_google_search_results_links;
                     buffer.default_browser_object_classes['shell-command-on-url'] =
                         browser_object_google_search_results_links;
                 });

var google_search_re = build_url_regex($domain = "google",
                                       $allow_www = true,
                                       $path = "search?",
                                       $tlds = ["com", "co.uk", "de", "dk", "es",
                                                "fr", "it", "no", "se", "uk"]);
auto_mode_list.push([google_search_re, google_search_results_mode]);
