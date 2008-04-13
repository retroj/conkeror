require("content-buffer.js");
require("media.js");

const media_youporn_title_regexp = /^.*? - (.*)$/;
const media_youporn_flv_regexp = /var player_url = '(.*?)';/;

function media_scrape_youporn(buffer, results) {
    try {
        var doc = buffer.document;

        var title = doc.title;
        var usable_title_res = media_youporn_title_regexp.exec(title);
        var usable_title = usable_title_res[0];

        let text = doc.documentElement.innerHTML;
        let res = media_youporn_flv_regexp.exec(text);

        if (res) {
            results.push(load_spec({uri: res[1],
                                    suggest_filename_from_uri: false,
                                    title: usable_title,
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

auto_mode_list.push([/^http:\/\/youporn\.com\//, youporn_mode]);
