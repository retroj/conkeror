/**
 * (C) Copyright 2008 Deniz Dogan
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/


require("content-buffer.js");
require("bindings/default/content-buffer/normal.js");


// Define the keymap to use.
define_keymap("chan_keymap", $parent = content_buffer_normal_keymap);


function chan_make_reply(I) {
    var doc = I.buffer.document;
    var name = doc.getElementsByClassName("inputtext");
    dumpln(name[0]);
    if (name) {
	name[0].scrollIntoView(true);
	name[0].focus();
    }
}


function chan_post_reply(I) {
    var doc = I.buffer.document;
    var form = doc.getElementsByName("post");
    dumpln(form[0]);
    if (form) {
	form[0].submit();
    }
}


function chan_add_image(I) {
    
}


interactive("chan-make-reply", "Puts the focus to the reply/new thread form.", chan_make_reply);
interactive("chan-post-reply", "Submits the reply form.", chan_post_reply);
interactive("chan-add-image", "Adds an image attachment to the form.", chan_add_image);


function chanmaster(buffer) {

    dumpln("Defined.");

    define_key(chan_keymap, "C-c C-r", "chan-make-reply");
    define_key(chan_keymap, "C-c C-p", "chan-post-reply");
    define_key(chan_keymap, "C-c C-i", "chan-add-image");

    var doc = buffer.document;
    var xpr = doc.evaluate("//img[@md5]", doc, null, Ci.nsIDOMXPathResult.ANY_TYPE, null);
    let img, i = 0;

    // Make buffer local arrays for the event listeners so that we can properly
    // remove them when the mode is disabled.
    buffer.local_variables.overlisteners = new Array();
    buffer.local_variables.outlisteners = new Array();

    // For each thumbnail picture...
    while (img = xpr.iterateNext()) {

	buffer.local_variables.overlisteners[i] = function (event) {

	    // Find out what the URL to the image is.
	    let img = event.currentTarget;
	    let href = img.parentNode.href;
	    let el = doc.createElement("img");

	    // Find out the maximum dimensions still making the image visible.
	    let maxw = doc.width - img.x - img.clientWidth - 10;
	    let maxh = buffer.browser.contentWindow.innerHeight - 4;

	    // Set up the element and add it to the document's DOM.
	    el.src = href;
	    el.setAttribute("class", "4chan-preview");
	    el.setAttribute("style", "border: 2px solid red; position: fixed; top: 0; right: 0; max-width: " + maxw + "px; max-height: " + maxh + "px;");
	    doc.body.appendChild(el);
	};

	buffer.local_variables.outlisteners[i] = function (event) {
	    // Loop through all the 4chan previews just in case somethin went
	    // terribly wrong. I have yet to see this happen.
	    var previews = doc.getElementsByClassName("4chan-preview");
	    for (let j = 0; j < previews.length; j++) {
		previews[j].parentNode.removeChild(previews[j]);
	    }
	};

	img.addEventListener("mouseover", buffer.local_variables.overlisteners[i], true);
	img.addEventListener("mouseout",  buffer.local_variables.outlisteners[i],  true);

	i++;
    }

}


/**
 * Removes all of the mouseover/mouseout event listeners and removes any preview
 * images that might have been left over.
 */
function dechanmaster(buffer) {

    var doc = buffer.document;
    var xpr = doc.evaluate("//img[@md5]", doc, null, Ci.nsIDOMXPathResult.ANY_TYPE, null);

    // Remove all of the event listeners.
    let img, i = 0;
    while (img = xpr.iterateNext()) {
	img.removeEventListener("mouseover", buffer.local_variables.overlisteners[i], true);
	img.removeEventListener("mouseout",  buffer.local_variables.outlisteners[i],  true);
	i++;
    }

    // Remove any left over preview images.
    var previews = doc.getElementsByClassName("4chan-preview");
    for (let j = 0; j < previews.length; j++) {
	previews[j].parentNode.removeChild(previews[j]);
    }

}


define_page_mode("chan_mode", "4chan mode",
		 $enable = function (buffer) {
                     buffer.local_variables.content_buffer_normal_keymap = chan_keymap;
		     if(buffer.browser.webProgress.isLoadingDocument) {
			 add_hook.call(buffer, "buffer_dom_content_loaded_hook", chanmaster);
		     } else {
			 chanmaster(buffer);
		     }
		 },
		 $disable = function (buffer) {
		     remove_hook.call(buffer, "buffer_dom_content_loaded_hook", chanmaster);
		     dechanmaster(buffer);
		 });


// This regular expression should match just about anything but the main page.
var chan_re = new RegExp("http://(rs|zip|cgi|img).4chan.org/.+/", "i");
auto_mode_list.push([chan_re, chan_mode]);
