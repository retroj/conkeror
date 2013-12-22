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

function media_scrape_default (buffer, results) {
    var initial_length = results.length;
    for (let frame in frame_iterator(buffer.top_frame)) {
        var text = frame.document.documentElement.innerHTML;
        var matches = text.match(media_scrape_default_regexp);
        //matches = matches.concat(unescape(text).match(media_scrape_default_regexp));

        let base_uri = frame.document.documentURIObject;

        var uris = {};
        for each (let x in matches) {
            let str = x;
            try {
                let uri_obj = make_uri(str, null, base_uri);
                if (! uris[uri_obj.spec])  {
                    uris[uri_obj.spec] = true;
                    results.push(load_spec({uri: uri_obj.spec, source_frame: frame}));
                }
            } catch (e) {}
        }
    }

    // If there is exactly 1, use the document title as the video title
    if (initial_length == 0 && results.length == 1 &&
        buffer.document.title && buffer.document.title.length > 0)
    {
        results[0].title = buffer.document.title;
    }
    return results;
}


define_variable("media_scrapers",
                [[/.*/, media_scrape_default]],
    "Associative list of regexps for matching urls, mapped to functions "+
    "(or coroutines) to use to scrape a page for embedded media.")


function media_scrape (I, buffer) {
    var results = [];
    for (var i = 0, nscrapers = media_scrapers.length; i < nscrapers; i++) {
        if (media_scrapers[i][0].test(buffer.current_uri.spec))
            yield media_scrapers[i][1](buffer, results);
    }
    yield co_return(results);
}


define_browser_object_class("media", null,
    function (I, prompt) {
        let media = yield media_scrape(I, I.buffer);
        if (!media || media.length == 0)
            throw interactive_error("No media found.");
        if (media.length == 1)
            yield co_return(media[0]);
        let completer = new all_word_completer(
            $completions = media,
            $get_string = function (x) {
                x = load_spec(x);
                return load_spec_uri_string(x);
            },
            $get_description = function (x) {
                x = load_spec(x);
                return (load_spec_title(x) || "") +
                    (x.description ? " ("+x.description+")" : "");
            });
        let result = yield I.buffer.window.minibuffer.read(
            $prompt = prompt,
            $require_match,
            $completer = completer,
            $auto_complete_initial,
            $auto_complete = "media");
        yield co_return(result);
    },
    $hint = "select media");
minibuffer_auto_complete_preferences["media"] = true;


function media_setup_local_object_classes (buffer) {
    buffer.default_browser_object_classes = {
        save: browser_object_media
    };
    buffer.default_browser_object_classes['shell-command-on-file'] =
        browser_object_media;
    buffer.default_browser_object_classes['shell-command-on-url'] =
        browser_object_media;
}

function media_disable_local_object_classes (buffer) {
    buffer.default_browser_object_classes = {};
}

provide("media");
