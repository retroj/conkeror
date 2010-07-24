/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 * (C) Copyright 2009-2010 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

require("content-buffer.js");
require("media.js");

let media_youtube_content_key_regexp = /&t=([^&]+)/;
let media_youtube_content_title_regexp = /<meta name="title" content="([^"]+)">/;


/*
 * Youtube Format Scrapers
 *
 *    Given a push function, the id of the video, the `t' key, and the
 * text of the document (to scrape further data if necessary), the format
 * scrapers' job is to call the push function with four args: url, file
 * extension, mime type, and description.
 *
 *    Scrapers should return true on success and false on failure.
 */
function youtube_scrape_standard_flv (push, id, t, text) {
    push('http://youtube.com/get_video?video_id='+id+'&t='+t+'&asv=3',
         'flv', 'video/x-flv', 'standard flv');
    return true;
}

function youtube_scrape_hq_mp4 (push, id, t, text) {
    if (/"fmt_map": ""/.test(text))
        return false;
    push('http://youtube.com/get_video?video_id='+id+'&t='+t+'&fmt=18'+'&asv=3',
         'mp4', 'video/mp4', 'hq mp4');
    return true;
}

function youtube_scrape_720p_mp4 (push, id, t, text) {
    if (!(/'IS_HD_AVAILABLE': true/.test(text)))
        return false;
    push('http://youtube.com/get_video?video_id='+id+'&t='+t+'&fmt=22'+'&asv=3',
         'mp4', 'video/mp4', '720p mp4');
    return true;
}

function youtube_scrape_1080p_mp4 (push, id, t, text) {
    if (!(/"fmt_map": "37/.test(text)))
        return false;
    push('http://youtube.com/get_video?video_id='+id+'&t='+t+'&fmt=37'+'&asv=3',
         'mp4', 'video/mp4', '1080p mp4');
    return true;
}


/*
 * Scraper Composition
 */

/**
 * make_call_each takes any number of functions as arguments and returns a
 * closure which, when called, calls each of those functions in order, and
 * finally returns true if any of the functions returned true.
 */
function make_call_each () {
    var fns = Array.prototype.slice.call(arguments, 0);
    return function () {
        var args = Array.prototype.slice.call(arguments, 0);
        var found = false;
        fns.map(function (fn) {
            if (fn.apply(this, args))
                found = true;
        });
        return found;
    };
}

/**
 * make_call_each_until_success takes any number of functions as arguments
 * and returns a closure which, when called, calls each of those functions
 * in order until one returns true.
 */
function make_call_each_until_success () {
    var fns = Array.prototype.slice.call(arguments, 0);
    return function () {
        var args = Array.prototype.slice.call(arguments, 0);
        for each (var fn in fns) {
            if (fn.apply(this, args))
                return true;
        }
        return false;
    };
}

define_variable('youtube_scrape_function',
                make_call_each(youtube_scrape_1080p_mp4,
                               youtube_scrape_720p_mp4,
                               youtube_scrape_hq_mp4,
                               youtube_scrape_standard_flv),
    "This function is called as the last step of scraping a youtube page, "+
    "after the basic information needed to build the media url has been "+
    "extracted. Youtube_scape_function is called with four arguments: a "+
    "`push' function, the id, the t key, and the text of the page.  Its "+
    "job is to call the push function for each media url desired with "+
    "the arguments url, file extension, mime type, and description.  It "+
    "should return true if it called the push function at least once, and "+
    "otherwise false.");


function youtube_scrape_text (results, frame, id, text) {
    var title_match = media_youtube_content_title_regexp.exec(text);
    if (!title_match)
        return null;
    var title = decodeURIComponent(title_match[1]);
    var res = media_youtube_content_key_regexp.exec(text);
    if (!res)
        return null;
    function push (url, extension, mime_type, description) {
        results.push(load_spec({
            uri: url,
            suggest_filename_from_uri: false,
            title: title,
            filename_extension: extension,
            source_frame: frame,
            mime_type: mime_type,
            description: description
        }));
    }
    youtube_scrape_function(push, id, res[1], text);
}

function media_scrape_youtube (buffer, results) {
    try {
        var uri = buffer.current_uri.spec;
        var result = media_youtube_uri_test_regexp.exec(uri);
        if (!result)
            return;
        let text = buffer.document.documentElement.innerHTML;
        let id = result[1];
        youtube_scrape_text(results, buffer.top_frame, id, text);
    } catch (e if !(e instanceof interactive_error)) {}
}

define_page_mode("youtube_mode",
    $display_name = "YouTube",
    $enable = function (buffer) {
        media_setup_local_object_classes(buffer);
    });

function media_scrape_embedded_youtube (buffer, results) {
    const embedded_youtube_regexp = /^http:\/\/[a-zA-Z0-9\-.]+\.youtube\.com\/v\/(.*)$/;
    for (let frame in frame_iterator(buffer.top_frame, buffer.focused_frame)) {
        // Look for embedded YouTube videos
        let obj_els = frame.document.getElementsByTagName("object");
        for (let i = 0; i < obj_els.length; ++i) {
            let obj_el = obj_els[i];
            let param_els = obj_el.getElementsByTagName("param");
            inner:
            for (let j = 0; j < param_els.length; ++j) {
                let param_el = param_els[j];
                let match;
                if (param_el.getAttribute("name").toLowerCase() == "movie" &&
                    (match = embedded_youtube_regexp.exec(param_el.getAttribute("value"))) != null) {
                    try {
                        let id = match[1];
                        let lspec = load_spec({uri: "http://youtube.com/watch?v=" + id});
                        var result =
                            yield buffer.window.minibuffer.wait_for(
                                "Requesting " + lspec.uri + "...",
                                send_http_request(lspec));
                        let text = result.responseText;
                        if (text != null && text.length > 0)
                            youtube_scrape_text(results, frame, id, text);
                    } catch (e if (e instanceof abort)) {
                        // Still allow other media scrapers to try even if the user aborted an http request,
                        // but don't continue looking for embedded youtube videos.
                        return;
                    } catch (e) {
                        // Some other error here means there was some problem with the request.
                        // We'll just ignore it.
                    }
                    break inner;
                }
            }
        }
    }
}


let media_youtube_uri_test_regexp = build_url_regex($domain = /(?:[a-z]+\.)?youtube/,
                                                    $path = /watch\?v=([A-Za-z0-9\-_]+)/);
media_scrapers.unshift([/.*/, media_scrape_embedded_youtube]);
media_scrapers.unshift([media_youtube_uri_test_regexp, media_scrape_youtube]);
auto_mode_list.push([media_youtube_uri_test_regexp, youtube_mode]);

provide("youtube");
