/**
 * (C) Copyright 2008 Shawn Betts
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/


var chan_thumbnail_xpath = '//a[@target="_blank"]';


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
    if (comment.length > 0)
	comment[0].focus();
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
    if (file.length != 1) return;

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
 * Scrolls the buffer to the previous thread.
 */
function chan_previous_thread(I) {
    var doc = I.buffer.document,
	threads = doc.getElementsByTagName("HR"),
	viewportOff = -(doc.body.getBoundingClientRect().top),
	curT = -1,
	curD = 99999;

    // TODO: Eliminate non-thread HRs, probably using XPath.
    for (t in threads) {
	if (threads[t].offsetTop < viewportOff &&
	    Math.abs(threads[t].offsetTop - viewportOff) < curD) {
	    curT = threads[t];
	    curD = Math.abs(threads[t].offsetTop - viewportOff);
	}
    }
    if (curT == -1) return;
    curT.scrollIntoView();
}


/**
 * Scrolls the buffer to the next thread.
 */
function chan_next_thread(I) {
    var doc = I.buffer.document,
	threads = doc.getElementsByTagName("HR"),
	viewportOff = -(doc.body.getBoundingClientRect().top),
	curT = -1,
	curD = 99999;

    // TODO: Eliminate non-thread HRs, probably using XPath.
    for (t in threads) {
	if (threads[t].offsetTop - 6 > viewportOff && // "-6 hack" because of scrollIntoView()
	    Math.abs(threads[t].offsetTop - viewportOff) < curD) {
	    curT = threads[t];
	    curD = Math.abs(threads[t].offsetTop - viewportOff);
	}
    }
    if (curT == -1) return;
    curT.scrollIntoView();
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
    var maps = [chan_keymap, chan_keymap_text, chan_keymap_textarea];
    for (i in maps) {
        define_key(maps[i], "C-c C-c", "chan-post-reply");
        define_key(maps[i], "C-c C-i", "chan-add-image");
        define_key(maps[i], "C-c C-n", "chan-next-thread");
        define_key(maps[i], "C-c C-p", "chan-previous-thread");
        define_key(maps[i], "C-c C-r", "chan-make-reply");
        define_key(maps[i], "C-c C-l", "chan-clear-fields");
    }

    var doc = buffer.document;
    var xpr = doc.evaluate(chan_thumbnail_xpath, doc, null, Ci.nsIDOMXPathResult.ANY_TYPE, null);
    let link, i = 0;

    // Make buffer local arrays for the event listeners so that we can properly
    // remove them when the mode is disabled.
    buffer.local_variables.overlisteners = new Array();
    buffer.local_variables.outlisteners = new Array();

    // For each link...
    while ((link = xpr.iterateNext())) {

	buffer.local_variables.overlisteners[i] = chan_show_preview(buffer, doc, link.href);

	buffer.local_variables.outlisteners[i] = function (event) {
	    // Loop through all the 4chan previews just in case somethin went
	    // terribly wrong. I have yet to see this happen.
	    var previews = doc.getElementsByClassName("4chan-preview");
	    for (let j = 0; j < previews.length; j++) {
		previews[j].parentNode.removeChild(previews[j]);
	    }
	};

	link.addEventListener("mouseover", buffer.local_variables.overlisteners[i], true);
	link.addEventListener("mouseout",  buffer.local_variables.outlisteners[i],  true);

	i++;
    }

}


/**
 * Given the URI to an image, shows it as a preview in the top right hand side
 * corner of the browser.
 */
function chan_show_preview(buffer, doc, uri) {
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
    }
}


/**
 * Removes all of the mouseover/mouseout event listeners and removes any preview
 * images that might have been left over.
 */
function dechanmaster(buffer) {

    var doc = buffer.document;
    var xpr = doc.evaluate(chan_thumbnail_xpath, doc, null, Ci.nsIDOMXPathResult.ANY_TYPE, null);

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
