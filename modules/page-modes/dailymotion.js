/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("content-buffer.js");
require("media.js");

function media_scrape_dailymotion(buffer, results) {
    var text = unescape(buffer.document.documentElement.innerHTML);
    const reg = /video=([^&]+)&/;

    const reg2 = /([^\|]*)@@\w+$/;
    var match = reg.exec(text);
    var param;
    if (!match || !(param = match[1]))
        return;

    param = unescape(param);

    match = reg2.exec(param);
    var path;
    if (!match || !(path = match[1]))
        return;
    let title = get_meta_title(buffer.document);
    if (title)
        title = title.replace("Dailymotion : ", "");
    results.push(load_spec({uri: "http://dailymotion.com" + path,
                            title: title,
                            filename_extension: "flv",
                            source_frame: buffer.top_frame,
                            mime_type: "video/x-flv"}));
}

var dailymotion_mode_test = build_url_regexp($domain = /(?:[^\/]*\.)?dailymotion/);

define_page_mode("dailymotion-mode",
    dailymotion_mode_test,
    function enable (buffer) {
        media_setup_local_object_classes(buffer);
    },
    function disable (buffer) {
        media_disable_local_object_classes(buffer);
    },
    $display_name = "Dailymotion");

page_mode_activate(dailymotion_mode);

media_scrapers.unshift([dailymotion_mode_test, media_scrape_dailymotion]);

provide("dailymotion");
