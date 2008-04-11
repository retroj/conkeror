
function media_scrape(buffer) {
    var scraper = buffer.get("media_scraper");
    if (scraper)
        yield co_return((yield scraper(buffer)));
    yield co_return(null);
}

function media_setup_local_object_classes(buffer) {
    buffer.local_variables.default_browser_object_classes = {
        __proto__: default_browser_object_classes,
        save: "media",
        shell_command: "media",
        shell_command_url: "media"
    };
}

define_browser_object_class("media", $handler = function (buf, prompt) {
    let media = yield media_scrape(buf);
    if (!media || media.length == 0)
        throw interactive_error("No media found.");

    if (media.length == 1)
        yield co_return(media[0]);

    let completer = all_word_completer(
        $completions = media,
        $get_string = function (x) load_spec_uri_string(x),
        $get_description = function (x) load_spec_title(x) || "");

    let result = yield this.read(
        $prompt = prompt,
        $match_required,
        $completer = completer,
        $auto_complete_initial,
        $auto_complete = "media");

    yield co_return(result);
});
