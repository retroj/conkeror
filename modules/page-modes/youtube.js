require("content-buffer.js");
require("media.js");

const media_youtube_content_key_regexp = /t=[\w-]{10,}/i;
const media_youtube_uri_test_regexp = /^http:\/\/youtube\.com\/watch\?v=([A-Za-z0-9\-]+)/;

function media_scrape_youtube(buffer) {
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
                return [load_spec({uri: 'http://youtube.com/get_video?video_id=' + code + '&' + res[0],
                                   title: title.stringValue,
                                   filename_extension: "flv",
                                   source_frame: buffer.top_frame,
                                   mime_type: "video/x-flv"})];
            }
        }
    } catch (e if !(e instanceof interactive_error)) {}
    return null;
}

define_page_mode("youtube_mode", "YouTube", $enable = function (buffer) {
    buffer.local_variables.media_scraper = media_scrape_youtube;
    media_setup_local_object_classes(buffer);
});

auto_mode_list.push([media_youtube_uri_test_regexp, youtube_mode]);
