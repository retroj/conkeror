
function media_scrape(buffer) {
    var scraper = buffer.get("media_scraper");
    if (scraper)
        return scraper(buffer);
    return null;
}


function media_setup_local_object_classes(buffer) {
    buffer.local_variables.hints_default_object_classes = {
        __proto__: hints_default_object_classes,
        save: "media",
        shell_command: "media",
        shell_command_url: "media"
    };
}
