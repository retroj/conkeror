/**
 * (C) Copyright 2009 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

/**
 * Google Images Mode
 *
 *   Provides browser-object overrides for various commands at
 * google-images, to follow directly to the page that contains an
 * image, or directly save the full-size image.  Never see that
 * annoying frameset page from google again!
 */

define_variable('google_images_imgrefurl_commands',
                ["follow", "follow-new-buffer",
                 "follow-new-buffer-background",
                 "follow-new-window", "copy"],
    "List of commands for which the google-images-imgrefurl browser object "+
    "should be used in Google Images Mode");

define_variable('google_images_imgurl_commands',
                ["save", "shell-command-on-file"],
    "List of commands for which the google-images-imgurl browser object "+
    "should be used in Google Images Mode");

function google_images_get_image_uri (I, prompt) {
    var result = yield I.buffer.window.minibuffer.read_hinted_element(
        $buffer = I.buffer,
        $prompt = prompt,
        $hint_xpath_expression = "//a[img]");
    if (result instanceof Ci.nsIDOMHTMLElement) {
        var u = Cc["@mozilla.org/network/standard-url;1"]
            .createInstance(Ci.nsIURL);
        u.spec = result.href;
        yield co_return(u);
    } else
        yield co_return(result);
}

define_browser_object_class("google-images-imgrefurl", null,
    function (I, prompt) {
        var u = yield google_images_get_image_uri(I, prompt);
        if (u instanceof Ci.nsIURL) {
            var imgrefurl = unescape(u.query.match(/&imgrefurl=([^&]*)/)[1]);
            yield co_return(imgrefurl);
        } else
            yield co_return(u);
    });

define_browser_object_class("google-images-imgurl", null,
    function (I, prompt) {
        var u = yield google_images_get_image_uri(I, prompt);
        if (u instanceof Ci.nsIURL) {
            var imgurl = unescape(u.query.match(/imgurl=([^&]*)/)[1]);
            yield co_return(imgurl);
        } else
            yield co_return(u);
    });

define_page_mode("google-images-mode",
    build_url_regexp($domain = /(.*\.)?google/, $path = "images"),
    function enable (buffer) {
        for each (var c in google_images_imgrefurl_commands) {
            buffer.default_browser_object_classes[c] =
                browser_object_google_images_imgrefurl;
        }
        for each (var c in google_images_imgurl_commands) {
            buffer.default_browser_object_classes[c] =
                browser_object_google_images_imgurl;
        }
    },
    function disable (buffer) {
        for each (var c in google_images_imgrefurl_commands) {
            delete buffer.default_browser_object_classes[c];
        }
        for each (var c in google_images_imgurl_commands) {
            delete buffer.default_browser_object_classes[c];
        }
    },
    $display_name = "Google Images");

page_mode_activate(google_images_mode);

provide("google-images");
