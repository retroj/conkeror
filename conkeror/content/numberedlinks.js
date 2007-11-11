/***** BEGIN LICENSE BLOCK *****
Version: MPL 1.1/GPL 2.0/LGPL 2.1

The contents of this file are subject to the Mozilla Public License Version
1.1 (the "License"); you may not use this file except in compliance with
the License. You may obtain a copy of the License at
http://www.mozilla.org/MPL/

Software distributed under the License is distributed on an "AS IS" basis,
WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
for the specific language governing rights and limitations under the
License.

The Initial Developer of the Original Code is Shawn Betts.
Portions created by the Initial Developer are Copyright (C) 2004,2005
by the Initial Developer. All Rights Reserved.

Alternatively, the contents of this file may be used under the terms of
either the GNU General Public License Version 2 or later (the "GPL"), or
the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
in which case the provisions of the GPL or the LGPL are applicable instead
of those above. If you wish to allow use of your version of this file only
under the terms of either the GPL or the LGPL, and not to allow others to
use your version of this file under the terms of the MPL, indicate your
decision by deleting the provisions above and replace them with the notice
and other provisions required by the GPL or the LGPL. If you do not delete
the provisions above, a recipient may use your version of this file under
the terms of any one of the MPL, the GPL or the LGPL.
***** END LICENSE BLOCK *****/

//// numbered links

// This is a global override. turn this off and no numbered links will
// be visible. FIXME: It doesn't actually disable numbered links from
// getting added, it just stops them from being visible.
var global_numbered_links_mode = true;

// New buffers check these variables to decide if they should display
// numbered links or image links (or both) by default.
var default_show_numbered_links = true;
var default_show_numbered_images = false;

// Set this to true and after a numberedlink is selected, they will be turned off
var gTurnOffLinksAfter = false;

function toggle_numbered_links ()
{
    toggleNumberedLinks();
}
// FIXME: This command does not yet work
//interactive("toggle-numbered-links", toggle_numbered_links, []);


function toggle_numbered_images ()
{
    toggleNumberedImages();
}
// FIXME: This command does not yet work
//interactive("toggle-numbered-images", toggle_numbered_images, []);


function copy_numbered_image_location (prefix, number)
{
    function fail (number)
    {
        message ("'"+number+"' is not the number of any image here. ");
    }

    var nl = get_numberedlink (number);
    if (! nl) { fail (number); return; }

    // we have a node.  we must now produce some side-effect based on its type
    // and the requested action.
    //
    var type = nl.type;

    if (type == "image") {
        copy_img_location(nl.target_node);
    } else {
        fail (number);
    }
}
// FIXME: This command does not yet work
//interactive("copy-numbered-image-location", copy_numbered_image_location, ['p','image']);


// XXX: get_href should go into some general utilities file, perhaps
//      dom-utils.  can someone explain why we use XPCNativeWrapper here, too?
function get_href (node)
{
    if (node.hasAttribute("href")) {
        var wrapper = new XPCNativeWrapper(node, "href", "getAttribute()");
        return wrapper.href;
    }
}

function get_numberedlink (window, number)
{
    /* It is important to be careful here, since we are accessing an
     * attribute of the content window, and using wrappedJSObject. */
    var data_container = window.content.wrappedJSObject.__conkeror_numbering_helper;
    if (!data_container
        || !(data_container instanceof Components.interfaces.conkerorINumberingHelper))
        return null;
    var data = data_container.wrappedJSObject;
    var arr = data.registrations;
    var num = parseInt(number);
    if (arr && num > 0 && num < arr.length)
    {
        var entry = arr[num];
        return entry;
    }
    return null;
}

const conkerorINumberingHelper = Components.interfaces.conkerorINumberingHelper;

function numberedlinks_do_link (frame, prefix, link, action)
{
    var window = frame;
    // See if the number is a link.
    var nl = get_numberedlink (window, link);
    if (! nl) {
        window.message ("No link with number '" + link + "'");
        return;
    }

    // we have a node.  we must now produce some side-effect based on its type
    // and the requested action.
    //
    var type = nl.type;
    var href = get_href (nl.target_node);

    if (type == conkerorINumberingHelper.TYPE_LINK) {
        if (action == "numberedlinks-focus") {
            nl.target_node.focus();
        } else if (action == "numberedlinks-follow-other-buffer") {
            window.newBrowser(href);
        } else if (action == "numberedlinks-follow-other-frame") {
          open_url_in (window, 5, href);
        } else if (action == "numberedlinks-save") {
            nl.target_node.focus();
            call_interactively(window, "save-focused-link");
        } else {
            var img = nl.target_node.getElementsByTagName("IMG");
            var evt = nl.document.createEvent('MouseEvents');
            var x = 1;
            var y = 1;
            if (prefix == 1) {
                if (nl.target_node.localName.toLowerCase() == "area") {
                    var coords = nl.target_node.getAttribute("coords").split(",");
                    x = Number(coords[0]);
                    y = Number(coords[1]);
                }
                evt.initMouseEvent('click', true, true, nl.document.defaultView, 0, x, y, 0, 0, null, null, null, null, 0, null);
                // Handle the annoying case where
                // there's a link with an image inside
                // it and the onclick is on the image
                // not the A tag.
                if (img.length > 0)
                    img[0].dispatchEvent(evt);
                else
                    nl.target_node.dispatchEvent(evt);
            } else {
              open_url_in (window, prefix, nl.target_node.href);
            }
        }
    } else if (type == conkerorINumberingHelper.TYPE_BUTTON) {
        if (action == "numberedlinks-focus") {
            nl.target_node.focus();
        } else {
            var evt = nl.document.createEvent('MouseEvents');
            evt.initMouseEvent('click', true, true, nl.document.defaultView, 0, 0, 0, 0, 0, null, null, null, null, 0, null);
            nl.target_node.dispatchEvent(evt);
        }
    } else {
        nl.target_node.focus ();
    }
}
interactive("numberedlinks-1", numberedlinks_do_link, ['current_frame', "p", ["link", null, function (a) { return "1"; }], "minibuffer_exit"]);
interactive("numberedlinks-2", numberedlinks_do_link, ['current_frame', "p", ["link", null, function (a) { return "2"; }], "minibuffer_exit"]);
interactive("numberedlinks-3", numberedlinks_do_link, ['current_frame', "p", ["link", null, function (a) { return "3"; }], "minibuffer_exit"]);
interactive("numberedlinks-4", numberedlinks_do_link, ['current_frame', "p", ["link", null, function (a) { return "4"; }], "minibuffer_exit"]);
interactive("numberedlinks-5", numberedlinks_do_link, ['current_frame', "p", ["link", null, function (a) { return "5"; }], "minibuffer_exit"]);
interactive("numberedlinks-6", numberedlinks_do_link, ['current_frame', "p", ["link", null, function (a) { return "6"; }], "minibuffer_exit"]);
interactive("numberedlinks-7", numberedlinks_do_link, ['current_frame', "p", ["link", null, function (a) { return "7"; }], "minibuffer_exit"]);
interactive("numberedlinks-8", numberedlinks_do_link, ['current_frame', "p", ["link", null, function (a) { return "8"; }], "minibuffer_exit"]);
interactive("numberedlinks-9", numberedlinks_do_link, ['current_frame', "p", ["link", null, function (a) { return "9"; }], "minibuffer_exit"]);
interactive("goto-numbered-link", numberedlinks_do_link, ['current_frame', "p", "link", "minibuffer_exit"]);


interactive("numberedlinks-focus", exit_minibuffer, ['current_frame', 'current_command']);
interactive("numberedlinks-follow", exit_minibuffer, ['current_frame', 'current_command']);
interactive("numberedlinks-follow-other-buffer", exit_minibuffer, ['current_frame', 'current_command']);
interactive("numberedlinks-follow-other-frame", exit_minibuffer, ['current_frame', 'current_command']);
interactive("numberedlinks-save", exit_minibuffer, ['current_frame', 'current_command']);

function setVisibility (doc, link_state, img_state)
{
    var nodes = doc.getElementsByTagName('SPAN');
    for (var i=0; i<nodes.length; i++) {
	if (nodes[i].hasAttribute("__conkid")) {
	    if (nodes[i].getAttribute("__conktype") == "image")
		nodes[i].style.display = img_state ? "inline":"none";
	    else
		nodes[i].style.display = link_state ? "inline":"none";
	}
	// 	alert(nodes[i].hidden);
    }
    // Changing the visibility may have changed the layout. So update
    // the floater positions
    if (img_state || link_state)
	update_nl_pos (doc);
}

function setNumberedLinksVisibility(content, link_state, img_state)
{
    try {
	var frames = content;
	setVisibility(content.document, link_state && global_numbered_links_mode, img_state && global_numbered_links_mode);
	for (var i=0; i<frames.length; i++) {
	    setVisibility(frames[i].document, link_state, img_state);
	}
    } catch (e) {alert("setNumberedLinksVisibility: " + e);}
}

function toggleNumberedLinks()
{
    var buf_state = getBrowser().numberedLinks;
    getBrowser().numberedLinks = !buf_state;
    setNumberedLinksVisibility (window._content, getBrowser().numberedLinks, getBrowser().numberedImages);
}

function toggleNumberedImages()
{
    var buf_state = getBrowser().numberedImages;
    getBrowser().numberedImages = !buf_state;
    setNumberedLinksVisibility (window._content, getBrowser().numberedLinks, getBrowser().numberedImages);
}

const nl_document_observer = {
    observe: function(subject, topic, url)
    {
        // domcontentloaded handles creating the links. here we just need to move the floater links over the now loaded content
        numberedlinks_resize (subject);
    }
};

// function update_nl_pos (doc)
// {
//     var nodes = doc.getElementsByTagName("SPAN");
//     for (var i=0; i<nodes.length; i++) {
// 	if (!nodes[i].hasAttribute("__nodeid")) continue;
// 	var node = doc.getElementById(nodes[i].getAttribute("__nodeid"));
// 	if (nodes[i].style.position == "absolute"
// 	    && nodes[i].style.display != "none") {
// 	    var pt;
// 	    // image links are handled slightly differently
// 	    if (node.tagName == "A") {
// 		var img = node.getElementsByTagName("IMG");
// 		if (img.length > 0)
// 		   pt = abs_point (img[0]);
// 		else
// 		    pt = abs_point (node);
// 	    } else 
// 		pt = abs_point (node);
// 	    nodes[i].style.left =  pt.x + "px";
// 	    nodes[i].style.top = pt.y + "px";
// 	}
//     }
// }

function update_span_pos (doc, span)
{
    try {
    if (!span.hasAttribute("__nodeid")) return;

    var node = doc.getElementById(span.getAttribute("__nodeid"));
    if (span.style.position == "absolute"
	&& span.style.display != "none") {
	var pt;
	// image links are handled slightly differently
	if (node.tagName == "A") {
	    var img = node.getElementsByTagName("IMG");
	    if (img.length > 0)
		pt = abs_point (img[0]);
	    else
		pt = abs_point (node);
	} else 
	    pt = abs_point (node);
	span.style.left =  pt.x + "px";
	span.style.top = pt.y + "px";
    }
    } catch(e) { dumpln ("update_span_pos: " + e); }
}

function do_some_spans (doc, n, spans)
{
    var upto = n+100<spans.length ? n+100:spans.length;

    for (var i=n; i<upto; i++) {
	update_span_pos (doc, spans[i]);
    }

    // schedule the rest
    if (upto < spans.length)
	setTimeout (do_some_spans, 0, doc, upto, spans);
}

function update_nl_pos (doc)
{
    try {
    do_some_spans (doc, 0, doc.getElementsByTagName("SPAN"));
    } catch(e) { dumpln ("update_nl_pos: " + e); }
}

function numberedlinks_resize (cont)
{
    var frames = cont.frames;
    update_nl_pos (cont.document);
    for (var i=0; i<frames.length; i++) {
	update_nl_pos (frames[i].document);
    }   
}
