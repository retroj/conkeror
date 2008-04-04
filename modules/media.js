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




function media_scrape(buffer) {
    var scraper = buffer.get("media_scraper");
    var arr = [];
    if (scraper)
        scraper(buffer, arr);
    return arr;
}


function media_setup_local_object_classes(buffer) {
    buffer.local_variables.hints_default_object_classes = {
        __proto__: hints_default_object_classes,
        save: "media",
        shell_command: "media",
        shell_command_url: "media"
    };
}
