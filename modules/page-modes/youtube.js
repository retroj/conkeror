/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 * (C) Copyright 2009-2011 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("content-buffer.js");
require("media.js");

var youtube_t_regexp = /"t": "([^"]+)"/;
var youtube_title_regexp = /<meta name="title" content="([^"]+)">/;

function regexp_exec (regexp, string, group) {
    var res = regexp.exec(string);
    if (! res)
        return null;
    return res[group];
}

function youtube_parse_video_info (info) {
    var sp = info.split("&");
    var res = {};
    for each (var kv in sp) {
        let [k, v] = kv.split("=");
        res[k] = decodeURIComponent(v);
    }
    if (! res.url_encoded_fmt_stream_map) {
        dumpln(dump_obj(res));
        return [];
    }
    var url_encoded_fmt_stream_map =
        res.url_encoded_fmt_stream_map.split(",");
    var data = [];
    for each (var chunk in url_encoded_fmt_stream_map) {
        var d = {};
        for each (kv in chunk.split("&")) {
            let [k, v] = kv.split("=");
            d[k] = decodeURIComponent(v);
        }
        data.push(d);
    }
    return data;
}

function youtube_get_video_info (url, id, t) {
    for each (var el in ["profilepage", "detailpage"]) {
        var video_info_url =
            "http://www.youtube.com/get_video_info?&video_id="+
            encodeURIComponent(id)+"&el="+el+"&ps=default&eurl="+
            encodeURIComponent(url)+"&hl=en_US&t="+encodeURIComponent(t);
        var res = yield send_http_request({uri: video_info_url});
        if (res) {
            var info = youtube_parse_video_info(res.responseText);
            yield co_return(info);
        }
    }
}

function youtube_scrape_text (results, frame, url, id, text) {
    var title = decodeURIComponent(regexp_exec(youtube_title_regexp, text, 1)
                                   || "video"+Date.now());
    var t = regexp_exec(youtube_t_regexp, text, 1);
    if (! t)
        yield co_return();
    var info = yield youtube_get_video_info(url, id, t);
    for each (var d in info) {
        var extension = mime_service.getPrimaryExtension(
            d.type, regexp_exec(/\/([^;]+)/, d.type, 1));
        results.push(load_spec({
            uri: d.url + "&signature=" + d.sig,
            title: title,
            filename_extension: extension,
            source_frame: frame,
            mime_type: d.type,
            description: d.quality + " " + extension
        }));
    }
}

function youtube_scrape_buffer (buffer, results) {
    var url = buffer.current_uri.spec;
    var id = regexp_exec(youtube_mode_test, url, 1);
    if (! id)
        yield co_return();
    var text = buffer.document.documentElement.innerHTML;
    yield youtube_scrape_text(results, buffer.top_frame, url, id, text);
}

function youtube_scrape_embedded (buffer, results) {
    const embedded_youtube_regexp = /^http:\/\/[a-zA-Z0-9\-.]+\.youtube\.com\/v\/([^?]*).*$/;
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
                            yield youtube_scrape_text(results, frame, lspec.uri, id, text);
                    } catch (e if (e instanceof abort)) {
                        // Still allow other media scrapers to try even if the user aborted an http request,
                        // but don't continue looking for embedded youtube videos.
                        yield co_return();
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

var youtube_mode_test =
    build_url_regexp($domain = /(?:[a-z]+\.)?youtube/,
                     $path = /watch\?(?:.*?&)?v=([A-Za-z0-9\-_]+)/);

define_page_mode("youtube-mode",
    youtube_mode_test,
    function enable (buffer) {
        media_setup_local_object_classes(buffer);
    },
    function disable (buffer) {
        media_disable_local_object_classes(buffer);
    },
    $display_name = "YouTube");

page_mode_activate(youtube_mode);

media_scrapers.unshift([/.*/, youtube_scrape_embedded]);
media_scrapers.unshift([youtube_mode_test, youtube_scrape_buffer]);

provide("youtube");
