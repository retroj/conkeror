/**
 * (C) Copyright 2008 Ævar Arnfjörð Bjarmason
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("content-buffer.js");
require("media.js");

/* We could use the wrappedJSObject to get the player_url but this is
 * probably more secure, and simpler
 */
const media_youporn_flv_regexp = /var player_url = '(.*?)';/;

function media_scrape_youporn(buffer, results) {
    try {
        var doc = buffer.document;

        let text = doc.documentElement.innerHTML;
        let res = media_youporn_flv_regexp.exec(text);

        if (res) {
            results.push(load_spec({uri: res[1],
                                    filename_extension: "flv",
                                    source_frame: buffer.top_frame,
                                    mime_type: "video/x-flv"}));
        }
    } catch (e if !(e instanceof interactive_error)) {}
}

define_page_mode("youporn_mode", "YouPorn", $enable = function (buffer) {
    buffer.local_variables.media_scrapers = [media_scrape_youporn];
    media_setup_local_object_classes(buffer);
});

var youporn_re = build_url_regex($domain = "youporn");
auto_mode_list.push([youporn_re, youporn_mode]);
