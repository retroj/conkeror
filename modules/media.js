/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

/**
 * Default media scraper
 *
 * Looks for <embed> and <object> elements, and also uses regular
 * expresisons to attempt to match strings that look like URIs to
 * embedded media.
 **/

define_variable("media_scrape_default_regexp",
                new RegExp("(?:http://[a-zA-Z0-9.\\-]+/)?(?!://)[^=&<>\"'|\\s]+\\."
                           + "(?:aiff|au|avi|flv|mid|mov|mp3|mpg|mpeg|ogg|ra|rm|spl|wav|wma|wmv)(?!\\w)", "ig"),
                "Regular expression used by the default media scraper to match URIs for "
                + "embedded media in the page source code.");

function media_scrape_default(buffer, results) {
    var initial_length = results.length;
    for (let frame in frame_iterator(buffer.top_frame)) {
        var text = frame.document.documentElement.innerHTML;
        var matches = text.match(media_scrape_default_regexp);
        //matches = matches.concat(unescape(text).match(media_scrape_default_regexp));

        let base_uri = frame.document.documentURIObject;

        var uris = new string_hashset();
        for each (let x in matches) {
            let str = x;
            try {
                let uri_obj = make_uri(str, null, base_uri);
                if (!uris.contains(uri_obj.spec))  {
                    uris.add(uri_obj.spec);
                    results.push(load_spec({uri: uri_obj.spec, source_frame: frame}));
                }
            } catch (e) {}
        }
    }

    // If there is exactly 1, use the document title as the video title
    if (initial_length == 0 && results.length == 1 &&
        buffer.document.title && buffer.document.title.length > 0) {

        results[0].title = buffer.document.title;
        results[0].suggest_filename_from_uri = false;
    }
    return results;
}

define_variable("media_scrapers", [media_scrape_default],
                "Function (or coroutine) to use to scrape the current buffer for embedded media.");


function media_scrape(buffer) {
    var scrapers = buffer.get("media_scrapers");
    var results = [];
    if (scrapers)  {
        for each (let scraper in scrapers) {
            yield scraper(buffer, results);
        }
    }
    yield co_return(results);
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

    let result = yield buf.window.minibuffer.read(
        $prompt = prompt,
        $match_required,
        $completer = completer,
        $auto_complete_initial,
        $auto_complete = "media");

    yield co_return(result);
});
