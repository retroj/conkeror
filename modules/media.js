/**
 * This module provides convenient facilities for automatically finding embedded media,
 * like videos and even flash videos.  It is based on code taken from the Flash Video Download
 * firefox extension.
 */



function media_spec() {}

function media_spec_simple_uri(uri, title, filename, frame, mime_type) {
    this.uri = uri;
    this.title = title;
    this.filename = filename;
    this.frame = frame;
    this.mime_type = mime_type;
}
media_spec_simple_uri.prototype = {
    __proto__: media_spec.prototype
}



const media_youtube_uri_test_regexp = /http:\/\/youtube\.com\/watch\?v=(\w+)/;
const media_youtube_content_key_regexp = /t=[\w-]{10,}/i;
function media_scrape_youtube(buffer, results) {
    try {
        var uri = buffer.current_URI.spec;

        var result = media_youtube_uri_test_regexp.exec(uri);

        var doc = buffer.top_document;

        var title = doc.evaluate("//meta[@name='title']/@content", doc, xpath_lookup_namespace,
                                 Ci.nsIDOMXPathResult.STRING_TYPE , null);
        if (title != null && title.stringValue != null && result != null) {
            let text = doc.documentElement.innerHTML;
            let code = result[1];
            let res = media_youtube_content_key_regexp.exec(text);
            if (res) {
                let key = res[0];
                let target_uri = 'http://youtube.com/get_video?video_id=' + code + '&' + key;
                let title_str = title.stringValue;
                let filename = title_str.replace(/^\s+|\s+$/g, "");
                filename = generate_filename_safely_fn(title_str) + ".flv";
                results.push(new media_spec_simple_uri(target_uri, title_str, filename, buffer.top_frame, "video/x-flv"));
            }
        }
    } catch (e if !(e instanceof interactive_error)) {}
}

const media_google_video_uri_test_regexp = /http:\/\/video\.google\.com\//;
function media_scrape_google_video(buffer, results) {
    if (!media_google_video_uri_test_regexp.test(buffer.current_URI.spec))
        return;

    var doc = buffer.top_document;

    try {
        let title = doc.title;
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
        let filename = title.replace(/^\s+|\s+$/g, "");
        filename = generate_filename_safely_fn(title) + "." + ext;
        results.push(new media_spec_simple_uri(target_uri, title, filename, buffer.top_frame, mime_type));
    } catch (e if !(e instanceof interactive_error)) {}
}

function media_scrape(buffer) {
    var arr = [];
    media_scrape_youtube(buffer, arr);
    media_scrape_google_video(buffer, arr);
    return arr;
}
