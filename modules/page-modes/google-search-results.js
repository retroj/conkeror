require("content-buffer.js");
require("bindings/default/content-buffer/normal.js");

define_keymap("google_search_results_keymap", $parent = content_buffer_normal_keymap);

// Keys for the "experimental" keyboard search
define_key(google_search_results_keymap, "j", null, $fallthrough);
define_key(google_search_results_keymap, "k", null, $fallthrough);
define_key(google_search_results_keymap, "o", null, $fallthrough);
define_key(google_search_results_keymap, "/", null, $fallthrough);

/**
 * Note: return already falls through by default in the content_buffer_normal_keymap,
 * and escape already does the same thing as the Google key binding.
 */

define_browser_object_class("google_search_results_links", $label = "Google Search Results",
                            $xpath_expression = "//a[@class='l']");

define_page_mode("google_search_results_mode", "Google Search Results",
                 $enable = function (buffer) {
                     buffer.local_variables.content_buffer_normal_keymap = google_search_results_keymap;
                     buffer.local_variables.default_browser_object_classes = {
                         __proto__: default_browser_object_classes,
                         follow: "google_search_results_links",
                         copy: "google_search_results_links",
                         save: "google_search_results_links",
                         shell_command: "google_search_results_links",
                         shell_command_url: "google_search_results_links" };
                 });

auto_mode_list.push([/^http:\/\/www\.google\.com\/search\?/, google_search_results_mode]);
