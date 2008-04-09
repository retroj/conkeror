require("content-buffer.js");
require("media.js");

function media_scrape_dailymotion(buffer) {
    var text = unescape(buffer.document.documentElement.innerHTML);
    const reg = /video=([^&]+)&/;

    const reg2 = /([^\|]*)@@\w+$/;
    var match = reg.exec(text);
    var param;
    if (!match || !(param = match[1]))
        return null;

    param = unescape(param);
    
    match = reg2.exec(param);
    var path;
    if (!match || !(path = match[1]))
        return null;
    let title = get_meta_title(buffer.document);
    if (title)
        title = title.replace("Dailymotion : ", "");
    return [load_spec({uri: "http://dailymotion.com" + path,
                       suggest_filename_from_uri: (title == null),
                       title: title,
                       filename_extension: "flv",
                       source_frame: buffer.top_frame,
                       mime_type: "video/x-flv"})];
}

define_page_mode("dailymotion_mode", "Dailymotion", $enable = function (buffer) {
    buffer.local_variables.media_scraper = media_scrape_dailymotion;
    media_setup_local_object_classes(buffer);
});


auto_mode_list.push([/^http:\/\/(?:[^\/]*\.)?dailymotion\.com\//, dailymotion_mode]);
