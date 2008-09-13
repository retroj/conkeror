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

define_browser_object_class("google_search_results_links", $label = "Google search result",
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

var google_search_re = build_url_regex($domain = "google",
                                       $allow_www = true,
                                       $path = "search?");
auto_mode_list.push([google_search_re, google_search_results_mode]);
