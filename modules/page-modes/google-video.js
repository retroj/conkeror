/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

require("content-buffer.js");
require("media.js");

function media_scrape_google_video(buffer, results) {

    var doc = buffer.document;

    try {
        let frame_doc = buffer.top_frame.frames[0].document;
        let mime_type;
        let ext;
        let elem;
        let target_uri;
        if ((elem = frame_doc.getElementById('macdownloadlink'))) {
            mime_type = "video/x-msvideo";
            ext = "avi";
            target_uri = elem.href;
        } else if ((elem = frame_doc.getElementById('ipoddownloadlink'))) {
            mime_type = "video/mp4";
            ext = "mp4";
            target_uri = elem.href;
        } else if ((elem = frame_doc.getElementsByTagName('embed'))) {
            elem = elem[0];
            let tu = elem.src;
            let l = tu.indexOf("videoUrl") + 9;
            let r = tu.indexOf("&",l);
            target_uri = unescape(tu.substr(l, r-l));
            ext = "flv";
            mime_type = "video/x-flv";
        } else
            return;
        results.push(load_spec({uri: target_uri,
                                suggest_filename_from_uri: false,
                                title: doc.title,
                                filename_extension: ext,
                                source_frame: buffer.top_frame,
                                mime_type: mime_type}));
    } catch (e if !(e instanceof interactive_error)) {}
}


define_page_mode("google_video_mode",
    $display_name = "Google Video",
    $enable = function (buffer) {
        buffer.page.local.media_scraper = [media_scrape_google_video];
        media_setup_local_object_classes(buffer);
    });

var google_video_re = build_url_regex($domain = "video.google");
auto_mode_list.push([google_video_re, google_video_mode]);

provide("google-video");
