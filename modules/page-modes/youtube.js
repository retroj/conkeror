require("content-buffer.js");
require("media.js");

const media_youtube_content_key_regexp = /t=[\w-]{10,}/i;
const media_youtube_uri_test_regexp = /^http:\/\/youtube\.com\/watch\?v=([A-Za-z0-9\-]+)/;

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

define_page_mode("youtube_mode", "YouTube", $enable = function (buffer) {
    buffer.local_variables.media_scraper = media_scrape_youtube;
    media_setup_local_object_classes(buffer);
});

auto_mode_list.push([media_youtube_uri_test_regexp, youtube_mode]);
