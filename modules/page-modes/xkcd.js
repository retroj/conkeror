/**
 * (C) Copyright 2008 Nelson Elhage
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("content-buffer.js");

define_variable('xkcd_add_title', false,
    "When true, xkcd-mode will insert the title caption of the comic "+
    "into the page, below the comic.");

/**
 * xkcd_do_add_title adds the XKCD <img> title text below the image in the
 * page
 */
function xkcd_do_add_title (buffer) {
    var document = buffer.document;
    // Find the <img> tag
    var img = document.evaluate("//div[@id='comic']//img",
        document, null,
        Ci.nsIDOMXPathResult.ANY_TYPE,null).iterateNext();
    if (!img)
        return;
    var title = img.title;
    // In some comics, the <img> is a link, so walk up to the surrounding <A>
    if (img.parentNode.tagName == 'A')
        img = img.parentNode;
    // Insert the text inside a <p> with a known ID
    var text = document.createTextNode(title);
    var span = document.createElement('p');
    span.id = 'conkeror:xkcd-title-text';
    span.appendChild(text);
    img.parentNode.appendChild(span);
}

define_page_mode("xkcd-mode",
    build_url_regexp($domain = "xkcd",
                     $allow_www = true,
                     $tlds = ["com", "net", "org"],
                     $path = /(\d+\/)?/),
    function enable (buffer) {
        if (xkcd_add_title) {
            if (buffer.browser.webProgress.isLoadingDocument)
                add_hook.call(buffer, "buffer_loaded_hook", xkcd_do_add_title);
            else
                xkcd_do_add_title(buffer);
        }
        buffer.page.local.browser_relationship_patterns = {};
        buffer.page.local.browser_relationship_patterns[RELATIONSHIP_NEXT] =
            [new RegExp("\\bnext","i")];
        buffer.page.local.browser_relationship_patterns[RELATIONSHIP_PREVIOUS] =
            [new RegExp("\\bprev","i")];
    },
    function disable (buffer) {
        remove_hook.call(buffer, "buffer_loaded_hook", xkcd_do_add_title);
        // When we disable the mode, remove the <span>
        var span = buffer.document.getElementById('conkeror:xkcd-title-text');
        if (span)
            span.parentNode.removeChild(span);
    },
    $display_name = "XKCD");

page_mode_activate(xkcd_mode);

provide("xkcd");
