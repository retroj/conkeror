require("content-buffer.js");
require("media.js");

function media_scrape_google_video(buffer, results) {

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


define_page_mode("google_video_mode", "GoogleVideo", $enable = function (buffer) {
    buffer.local_variables.media_scraper = media_scrape_google_video;
    media_setup_local_object_classes(buffer);
});

auto_mode_list.push([/^http:\/\/video\.google\.com\//, google_video_mode]);
