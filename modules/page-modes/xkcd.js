/**
 * (C) Copyright 2008 Nelson Elhage
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("content-buffer.js");

/* Add the XKCD <img> title text below the image in the page */
function xkcd_add_title(buffer) {
    var document = buffer.document;
    // Find the <img> tag
    var img = document.evaluate(
        "//div[@id='middleContent']//img",
        document, null,
        Ci.nsIDOMXPathResult.ANY_TYPE,null).iterateNext();
    if(!img) return;
    var title = img.title;
    // In some comics, the <img> is a link, so walk up to the surrounding <A>
    if(img.parentNode.tagName == 'A') {
        img = img.parentNode;
    }
    var node = img.nextSibling;
    while(node && node.nodeName != 'BR') {
        node = node.nextSibling;
    }
    if(!node) return;
    // Insert the text inside a <span> with a known ID
    var text = document.createTextNode(title);
    var span = document.createElement('span');
    span.id = 'conkeror:xkcd-title-text';
    span.appendChild(text);
    img.parentNode.insertBefore(span, node.nextSibling);
}

define_page_mode("xkcd_mode","XKCD",
    $enable = function (buffer) {
        if(buffer.browser.webProgress.isLoadingDocument) {
            add_hook.call(buffer, "buffer_dom_content_loaded_hook", xkcd_add_title);
        } else {
            xkcd_add_title(buffer);
        }
    },
    // When we disable the mode, remove the <span>
    $disable = function(buffer) {
        remove_hook.call(buffer, "buffer_dom_content_loaded_hook", xkcd_add_title);
        var span = buffer.document.getElementById('conkeror:xkcd-title-text');
        if(span) {
            span.parentNode.removeChild(span);
        }
    });

var xkcd_re = build_url_regex($domain = "xkcd",
                              $allow_www = true,
                              $tlds = ["com", "net", "org"],
                              $path = /(\d+\/)?/);
auto_mode_list.push([xkcd_re, xkcd_mode]);
