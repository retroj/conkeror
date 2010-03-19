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

in_module(null);

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
    var u = Cc["@mozilla.org/network/standard-url;1"]
        .createInstance(Ci.nsIURL);
    u.spec = result.href;
    yield (co_return(u));
}

define_browser_object_class("google-images-imgrefurl", null,
    function (I, prompt) {
        var u = yield google_images_get_image_uri(I, prompt);
        var imgrefurl = unescape(/&imgrefurl=([^&]*)/(u.query)[1]);
        yield (co_return(imgrefurl));
    });

define_browser_object_class("google-images-imgurl", null,
    function (I, prompt) {
        var u = yield google_images_get_image_uri(I, prompt);
        var imgurl = unescape(/imgurl=([^&]*)/(u.query)[1]);
        yield (co_return(imgurl));
    });

define_page_mode("google_images_mode",
    $display_name = "Google Images",
    $enable = function (buffer) {
        for each (var c in google_images_imgrefurl_commands) {
            buffer.default_browser_object_classes[c] =
                browser_object_google_images_imgrefurl;
        }
        for each (var c in google_images_imgurl_commands) {
            buffer.default_browser_object_classes[c] =
                browser_object_google_images_imgurl;
        }
    });


let (rx = build_url_regex($domain = "images.google",
                          $path = "images")) {
    auto_mode_list.push([rx, google_images_mode]);
};

provide("google-images");
