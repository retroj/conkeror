/**
 * (C) Copyright 2008 Shawn Betts
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/


var chan_thumbnail_xpath = '//a[@target="_blank"]';
var chan_message_reply_xpath = '//a[@class="quotelink"]';
var chan_thread_top_xpath = '//span[@class="filesize"]/following-sibling::hr | //form[@name="delform"]/preceding-sibling::hr[1]';


require("utils.js");
require("content-buffer.js");
require("bindings/default/content-buffer/normal.js");
require("bindings/default/content-buffer/text.js");
require("bindings/default/content-buffer/textarea.js");


// Define the different keymaps to use.
define_keymap("chan_keymap", $parent = content_buffer_normal_keymap);
define_keymap("chan_keymap_textarea", $parent = content_buffer_textarea_keymap);
define_keymap("chan_keymap_text", $parent = content_buffer_text_keymap);


/**
 * Focus the reply/new thread form.
 */
function chan_make_reply(I) {
    var doc = I.buffer.document;
    var comment = doc.getElementsByName("com");
    if (comment.length > 0) {
	comment[0].focus();
    }
}


/**
 * Submit the reply/new thread.
 */
function chan_post_reply(I) {
    var doc = I.buffer.document;
    var form = doc.getElementsByName("post");
    if (form.length > 0) {
	form[0].submit();
    }
}


/**
 * Adds an attached image to the current form.
 */
function chan_add_image(I) {
    var doc = I.buffer.document;
    var file = doc.getElementsByName("upfile");

    // The length of the array should be 1, otherwise we're doing something silly.
    if (file.length != 1)
        return;

    // Otherwise, get the input element.
    file = file[0];

    // Open the filepicker.
    var nsIFilePicker = Components.interfaces.nsIFilePicker;
    var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(I.window, "Select a File", nsIFilePicker.modeOpen);
    var res = fp.show();

    // If the user chose a file, set the value of the file field to the full
    // path to that file.
    if (res == nsIFilePicker.returnOK) {
	file = doc.getElementsByName("upfile")[0];
	file.value = fp.file.path;
    }
}


/**
 * Scrolls the buffer to the previous thread. If no previous thread was found,
 * doesn't scroll at all.
 */
function chan_previous_thread(I) {
    let doc = I.buffer.document,
        xpr = xpath_lookup(doc, chan_thread_top_xpath);

    let viewportOff = -(doc.body.getBoundingClientRect().top),
	found = -1,
	distance = 9999999;

    while ((thr = xpr.iterateNext())) {
        if (thr.offsetTop < viewportOff &&
            Math.abs(thr.offsetTop - viewportOff) < distance) {
            found = thr;
            distance = Math.abs(thr.offsetTop - viewportOff);
        }
    }

    if (found == -1) return;
    found.scrollIntoView();
}


/**
 * Scrolls the buffer to the next thread.
 */
function chan_next_thread(I) {
    let doc = I.buffer.document,
        xpr = xpath_lookup(doc, chan_thread_top_xpath);

    let viewportOff = -(doc.body.getBoundingClientRect().top),
	found = -1,
	distance = 9999999;

    while ((thr = xpr.iterateNext())) {
        if (thr.offsetTop - 6 > viewportOff &&
            Math.abs(thr.offsetTop - viewportOff) < distance) {
            found = thr;
            distance = Math.abs(thr.offsetTop - viewportOff);
        }
    }

    if (found == -1) return;
    found.scrollIntoView();
}


/**
 * Clears every field in the reply form. Useful for when you've posted in a
 * thread, go backwards in the history and want to post something new. Also
 * focuses the comment field.
 */
function chan_clear_fields(I) {
    var doc = I.buffer.document;
    var form = doc.getElementsByName("post");
    var comment = doc.getElementsByName("com");
    if (form.length > 0)
        form[0].reset();
    if (comment.length > 0)
        comment[0].focus();
}


interactive("chan-make-reply", "Puts the focus to the reply/new thread form.", chan_make_reply);
interactive("chan-post-reply", "Submits the reply form.", chan_post_reply);
interactive("chan-add-image", "Adds an image attachment to the form.", chan_add_image);
interactive("chan-previous-thread", "Scrolls the buffer to the previous thread.", chan_previous_thread);
interactive("chan-next-thread", "Scrolls the buffer to the next thread.", chan_next_thread);
interactive("chan-clear-fields", "Clears the form fields on 4chan.", chan_clear_fields);


function chanmaster(buffer) {

    // Define the same keys for all keymaps.
    let maps = [chan_keymap, chan_keymap_text, chan_keymap_textarea];
    for (i in maps) {
        define_key(maps[i], "C-c C-c", "chan-post-reply");
        define_key(maps[i], "C-c C-i", "chan-add-image");
        define_key(maps[i], "C-c C-n", "chan-next-thread");
        define_key(maps[i], "C-c C-p", "chan-previous-thread");
        define_key(maps[i], "C-c C-r", "chan-make-reply");
        define_key(maps[i], "C-c C-l", "chan-clear-fields");
    }

    // -------------------------------------------------------------------------
    // PREVIEWING OF IMAGES FROM THUMBNAILS
    // -------------------------------------------------------------------------
    let doc = buffer.document;
    let xpr = xpath_lookup(doc, chan_thumbnail_xpath);
    let link, i = 0;

    // Make buffer local arrays for the event listeners so that we can properly
    // remove them when the mode is disabled.
    buffer.local_variables.overlisteners = new Array();
    buffer.local_variables.outlisteners = new Array();

    // For each link to an image...
    while ((link = xpr.iterateNext())) {
	buffer.local_variables.overlisteners[i] = chan_preview_image(buffer, doc, link.href);
	buffer.local_variables.outlisteners[i] = chan_cleanup_previews(doc);
	link.addEventListener("mouseover", buffer.local_variables.overlisteners[i], true);
	link.addEventListener("mouseout",  buffer.local_variables.outlisteners[i],  true);
	i++;
    }

    // -------------------------------------------------------------------------
    // PREVIEWING OF MESSAGES THAT HAVE BEEN REPLIED TO
    // -------------------------------------------------------------------------

    let links = xpath_lookup(doc, chan_message_reply_xpath);
    let temp;

    // For each reply link to an original message...
    while ((link = links.iterateNext())) {
        // Compute the message number from the quote by removing the leading
        // ">>". We start at character 8, because ">>" is really "&gt;&gt;".
        temp = link.innerHTML.substring(8);
        buffer.local_variables.overlisteners[i] = chan_preview_message(buffer, doc, temp);
        buffer.local_variables.outlisteners[i] = chan_cleanup_previews(doc);
        link.addEventListener("mouseover", buffer.local_variables.overlisteners[i], true);
        link.addEventListener("mouseout",  buffer.local_variables.outlisteners[i],  true);
        i++;
    }

}


/**
 * Previews a message that has been replied to. Searches the current document
 * for the quote using some hot XPath. If the quote wasn't found in the
 * document, uses AJAX to fetch the target document. If the target document
 * doesn't have it, we give up.
 *
 * TODO: Implement the AJAX stuff.
 */
function chan_preview_message(buffer, doc, no) {
    return function (event) {

        // Returns a suitable offset from the document top for the preview.
        let suitable_top_offset = function (link)  {
            return abs_point(link.parentNode.parentNode).y;
        };

        // This XPath expression uniquely fetches the message that the reply was
        // for. It intelligently handles both OP and non-OP posts, as the DOM
        // looks a bit different depending on that. Don't fear... This is such a
        // huge XPath expression merely because 4chan in its entirety is just a
        // shitty hack.
        let blockquote_xpath = '//blockquote[preceding-sibling::span[position() = 1 and a[@class="quotejs" and . = "' + no + '"]]]';
        let found = xpath_lookup(doc, blockquote_xpath);
        let content;

        // If we found the quote...
        if ((found = found.iterateNext())) {
            content = found.innerHTML;
        } else {
            // http://img.4chan.org/b/res/105618188.html#105618721
            content = "Not found in the current document.";
        }

        // Calculate the positioning of the preview.
        let left = abs_point(event.target).x + event.target.offsetWidth + 10;
        let top_off = abs_point(event.target).y;

        // Set up the element holding the quote and show it.
        let el = doc.createElement("div");
        el.setAttribute("class", "4chan-preview");
        el.setAttribute("style", "background: white; color: black; padding: 5px; border: 2px solid red; position: absolute; top: " + top_off + "px; left: " + left + "px");
        el.innerHTML = content;
        doc.body.appendChild(el);
    };
}


/**
 * Given the URI to an image, shows it as a preview in the top right hand side
 * corner of the browser.
 */
function chan_preview_image(buffer, doc, uri) {
    return function(event) {

        // Get the information needed to prevent the preview image from covering
        // the cursor or the thumbnail.
        let targ = event.currentTarget.firstChild; // IMG or SPAN (if "Thumbnail unavailable")
        let maxw = doc.width - targ.clientWidth - abs_point(targ).x - 10;
        let maxh = buffer.browser.contentWindow.innerHeight - 4;

        // Set up the element and add it to the document's DOM.
        let el = doc.createElement("img");
        el.src = uri;
        el.setAttribute("class", "4chan-preview");
        el.setAttribute("style", "border: 2px solid red; position: fixed; top: 0; right: 0; max-width: " + maxw + "px; max-height: " + maxh + "px;");
        doc.body.appendChild(el);
    };
}


/**
 * Returns a function which removes any preview elements from the DOM.
 */
function chan_cleanup_previews(doc) {
    return function (event) {
        // Loop through all the 4chan previews just in case somethin went
        // terribly wrong. I have yet to see this happen.
        let previews = doc.getElementsByClassName("4chan-preview");
        for (let j = 0; j < previews.length; j++) {
            previews[j].parentNode.removeChild(previews[j]);
        }
    };
}


/**
 * Removes all of the mouseover/mouseout event listeners and removes any preview
 * images that might have been left over.
 */
function dechanmaster(buffer) {

    let doc = buffer.document;
    let xpr = xpath_lookup(doc, chan_thumbnail_xpath);

    // Remove all of the event listeners.
    let img, i = 0;
    while ((img = xpr.iterateNext())) {
	img.removeEventListener("mouseover", buffer.local_variables.overlisteners[i], true);
	img.removeEventListener("mouseout",  buffer.local_variables.outlisteners[i],  true);
	i++;
    }

    // Remove any left over preview images.
    let previews = doc.getElementsByClassName("4chan-preview");
    for (let j = 0; j < previews.length; j++) {
	previews[j].parentNode.removeChild(previews[j]);
    }

}


define_page_mode("chan_mode", "4chan mode",
		 $enable = function (buffer) {
                     buffer.local_variables.content_buffer_normal_keymap = chan_keymap;
                     buffer.local_variables.content_buffer_textarea_keymap = chan_keymap_textarea;
                     buffer.local_variables.content_buffer_text_keymap = chan_keymap_text;
                     add_hook.call(buffer, "buffer_dom_content_loaded_hook", chanmaster);
		 },
		 $disable = function (buffer) {
		     remove_hook.call(buffer, "buffer_dom_content_loaded_hook", chanmaster);
		     dechanmaster(buffer);
		 });


// This regular expression should match just about anything but the main page.
var chan_re = new RegExp("http://(orz|rs|zip|cgi|img).4chan.org/.+/", "i");
auto_mode_list.push([chan_re, chan_mode]);
