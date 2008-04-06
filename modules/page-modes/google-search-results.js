
define_browser_object_class("google_search_results_links", $label = "Google Search Results",
                            $xpath_expression = "//a[@class='l']");

define_page_mode("google_search_results_mode", "Google Search Results",
                 $enable = function (buffer) {
                     buffer.local_variables.default_browser_object_classes = {
                         __proto__: default_browser_object_classes,
                         follow: "google_search_results_links",
                         copy: "google_search_results_links",
                         save: "google_search_results_links",
                         shell_command: "google_search_results_links",
                         shell_command_url: "google_search_results_links" };
                 });

auto_mode_list.push([/^http:\/\/www\.google\.com\/search\?/, google_search_results_mode]);
