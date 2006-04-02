// -*- mode: java -*-
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

// This decides whether the link is opened in the current buffer, a
// new one, or a new frame.
var gNumberedLinksPrefix = null;
// Set this to true and after a numberedlink is selected, they will be turned off
var gTurnOffLinksAfter = false;
// Set this to true to display only images
var gOnlyImages = false;

function selectNumberedLink_1(args) { selectNthLink(1, args); }
function selectNumberedLink_2(args) { selectNthLink(2, args); }
function selectNumberedLink_3(args) { selectNthLink(3, args); }
function selectNumberedLink_4(args) { selectNthLink(4, args); }
function selectNumberedLink_5(args) { selectNthLink(5, args); }
function selectNumberedLink_6(args) { selectNthLink(6, args); }
function selectNumberedLink_7(args) { selectNthLink(7, args); }
function selectNumberedLink_8(args) { selectNthLink(8, args); }
function selectNumberedLink_9(args) { selectNthLink(9, args); }

function selectNthLink (num, args)
{
    var buf_state = getBrowser().numberedLinks;
    if (!buf_state) {
	gTurnOffLinksAfter = true;
	toggleNumberedLinks();
    }

    selectNumberedLink(num, args);
}

function toggle_numbered_links (args)
{
    toggleNumberedLinks();
}

function toggle_numbered_images (args)
{
    toggleNumberedImages();
}


function goto_numbered_image (args)
{
    var buf_state = getBrowser().numberedImages;
    if (!buf_state) {
	gTurnOffLinksAfter = true;
	toggleNumberedImages();
    }
    gOnlyImages = true;
    selectNumberedLink("", args);
}

function goto_numbered_link(args)
{
    var buf_state = getBrowser().numberedLinks;
    if (!buf_state) {
	gTurnOffLinksAfter = true;
	toggleNumberedLinks();
    }
    selectNumberedLink("", args);
}

function selectNumberedLink(num, args)
{
    gNumberedLinksPrefix = args[0];
    readInput("Goto Numbered Link:", null, "onNumberedLinkKeyPress(event);");
    var field = document.getElementById('input-field');
    field.value = num;
}

function closeNumberedLinkBar()
{
    closeInput(true);
    if (gTurnOffLinksAfter) {
	if (gOnlyImages) {
	    toggleNumberedImages();
	    gOnlyImages = false;
	} else {
	    toggleNumberedLinks();
	}
	gTurnOffLinksAfter = false;
    }
	
}

function get_href (node)
{
    if (node.hasAttribute("href")) {
	var wrapper = new XPCNativeWrapper(node, "href", "getAttribute()");
	return wrapper.href;
    }
}

function matchLink (evt, doc, link)
{
    try {
	var nodes = doc.getElementsByTagName('SPAN');
	for (var i=0; i<nodes.length; i++) {
	    // 	    if (nodes[i].style.visibility == "hidden") continue;
	    if (link == nodes[i].getAttribute("__conkid")) {
		var node = doc.getElementById(nodes[i].getAttribute("__nodeid"));
		var type = nodes[i].getAttribute("__conktype");
		var href = get_href (node);
		if (node) {
		    if (type == "link") {
			if (metaPressed(evt)) {
			    node.focus();
			} else if (evt.ctrlKey) {
			    getBrowser().newBrowser(href);
			} else {
			    var evt = doc.createEvent('MouseEvents');
			    var x = 0;
			    var y = 0;
			    if (gNumberedLinksPrefix == 1) {
				if (node.localName.toLowerCase() == "area") {
				    var coords = node.getAttribute("coords").split(",");
				    x = Number(coords[0]);
				    y = Number(coords[1]);
				}
				evt.initMouseEvent('click', true, true, doc.defaultView, 1, x, y, 0, 0, null, null, null, null, 0, null);
				node.dispatchEvent(evt);
			    } else {
				open_url_in(gNumberedLinksPrefix, node.href);
			    }
			}
		    } else if (type == "image") {
			copy_img_location(node);
		    } else if (type == "button") {
			if (metaPressed(evt)) {
			    node.focus();
			} else {
			    var evt = doc.createEvent('MouseEvents');
			    evt.initMouseEvent('click', true, true, doc.defaultView, 1, 0, 0, 0, 0, null, null, null, null, 0, null);
			    node.dispatchEvent(evt);
			}
		    } else {
			node.focus();
		    }
		}
		evt.preventDefault();
		evt.preventBubble();
		return true;
	    }
	}
    } catch(e) {alert(e);}
    return false;
}

function onNumberedLinkKeyPress(evt)
{
    try {
    if (evt.keyCode == KeyEvent.DOM_VK_RETURN) {
	var findfield = document.getElementById("input-field");
	var link = findfield.value;
	var frames = window._content.frames;
	closeNumberedLinkBar();
	// See if the number is a link.
	if (!matchLink (evt, window._content.document, link)) {
	    for (var i=0;i<frames.length;i++) {
		if (matchLink (evt, frames[i].document, link))
		    break;
	    }
	}
    }
    else if (evt.keyCode == KeyEvent.DOM_VK_ESCAPE
	     || (evt.ctrlKey && evt.charCode == 103)) {
	closeNumberedLinkBar();
	evt.preventDefault();
	evt.preventBubble();
    } else if (evt.keyCode == KeyEvent.DOM_VK_TAB) {
	// Ignore tabs
	evt.preventDefault();
	evt.preventBubble();
    }
    } catch(e) {alert(e);}
}

function onNumberedLinkBlur() {

}

var NL_FLOATER = 1;
var NL_BEFORE = 2;
var NL_INSIDE = 3;
var NL_IMGFLOATER = 4;

// Customizable aspects of the numbered links
var nl_color = "black";
var nl_image_backgroundColor = "pink";
var nl_link_backgroundColor = "lightgray";
var nl_fontWeight = "normal";
var nl_fontFamily = "sans-serif";
var nl_fontSize = "small";
var nl_borderWidth = "1px";
var nl_borderColor = "gray";
var nl_floater_opacity = "0.8";

function createNL (doc, node, id, type, where, post, img)
{
    try{
	var span = doc.createElementNS("http://www.w3.org/1999/xhtml","span");

	// Abort if we can't get an absolute positoin for it.
// 	alert ("(" + id + ")" + "createNL: " + node + " " + pt.x + " " + pt.y);
	var nodeid;
	if (node.hasAttribute("id"))
	    nodeid = node.getAttribute("id");
	else {
	    nodeid = "__CONK_" + id;
	    node.setAttribute("id", nodeid);
	}
	span.appendChild (doc.createTextNode(id));
	span.setAttribute("__conkid", id);
	span.setAttribute("__nodeid", nodeid);
	span.setAttribute("__conktype", type);
// 	var pt = abs_point (node);
// 	span.style.left =  pt.x + "px";
// 	span.style.top = pt.y + "px";
// 	span.style.position = "absolute";
	span.style.padding = "0 0 0 0";
	span.style.color = nl_color;
	span.style.backgroundColor = 
	    type == "image" ? nl_image_backgroundColor : nl_link_backgroundColor;
	span.style.fontWeight = nl_fontWeight;
	span.style.fontFamily = nl_fontFamily;
	span.style.fontSize = nl_fontSize;
	span.style.textAlign = "center";
	span.style.borderWidth = nl_borderWidth;
	span.style.borderColor = nl_borderColor;
	span.style.borderStyle = "solid";
	span.style.MozBorderRadius = "0.5em";
// 	span.style.visibility = "hidden";
	if ((type == "image" && !getBrowser().numberedImages) || (type != "image" && !getBrowser().numberedLinks))
	    span.style.display = "none";

	if (where == NL_FLOATER || where == NL_IMGFLOATER) {


// 	    post.push(function ()
// 	                {
// 			    var pt = abs_point(where == NL_IMGFLOATER ? img : node);
// 			    span.style.left =  pt.x + "px";
// 			    span.style.top = pt.y + "px";
// 			});
	    var pt = abs_point(where == NL_IMGFLOATER ? img : node);
			    span.style.left =  pt.x + "px";
			    span.style.top = pt.y + "px";
// 	    span.style.left = "0px";
// 	    span.style.top = "0px";
	    span.style.position = "absolute";
	    span.style.MozOpacity = nl_floater_opacity;
	    span.style.zIndex = "999"; // always on top
	    doc.body.appendChild (span);
	} else if (where == NL_BEFORE) {
	    node.parentNode.insertBefore (span, node);
	} else {
	    node.insertBefore (span, node.firstChild);
	}

    } catch (e) {alert("createNL: " + e);}
    //     alert (node.offsetTop + " " + node.offsetLeft);
}

function createNum(node, n, floaters, doc)
{
    try{
	//var doc = node.ownerDocument;

    if (node.hasAttributes()) {
	if (node.tagName == "A") {
	    // links with images in them get a floating number
	    var img = node.getElementsByTagName("IMG");
// 	    var txt = node.getElementsByTagName("TEXT");
	    if (img.length > 0)
		createNL (doc, node, n, "link", NL_IMGFLOATER, floaters, img[0]);
	    else
		createNL (doc, node, n, "link", NL_INSIDE, floaters);
	} else if (node.tagName == "AREA") {
	    createNL (doc, node, n, "link", NL_FLOATER, floaters);
	} else if (node.tagName == "IMG") {
	    createNL (doc, node, n, "image", NL_FLOATER, floaters);
	} else if (node.tagName == "EMBED") {
	    createNL (doc, node, n, "image", NL_FLOATER, floaters);
	} else if (node.tagName == "INPUT"
		   && (node.type == "submit" 
		       || node.type == "button"
		       || node.type == "checkbox"
		       || node.type == "radio")) {
	    createNL (doc, node, n, "button", (node.type != "radio" && node.type != "checkbox")?NL_FLOATER:NL_BEFORE, floaters);
	} else {
	    createNL (doc, node, n, "widget", NL_BEFORE, floaters);
	}
    }
    } catch(e) {window.alert("createNum: " + e);}
}

function inlink (node)
{
    try {
    while (node) {
	if (node.tagName == "A")
	    return true;
	node = node.parentNode;
    }
    }catch(e) {}
    return false;
}

// For a single document, grab all the nodes
// function doLinkNodes(doc, linknum)
// {
//     try {
// //     var a_nodes = doc.links;
//     var st = new Date();
//     var post = [];
//     var a_nodes = doc.getElementsByTagName('a');
//     var ar_nodes = doc.getElementsByTagName('area');
//     var img_nodes = doc.getElementsByTagName('img');
//     var embed_nodes = doc.getElementsByTagName('embed');
//     var i_nodes = doc.getElementsByTagName('input');
//     var s_nodes = doc.getElementsByTagName('select');
//     var t_nodes = doc.getElementsByTagName('textarea');

//     for (var i=0; i<t_nodes.length; i++) {
// 	createNum(t_nodes[i], linknum, post, doc);
// 	linknum++;
//     }
//     for (var i=0; i<s_nodes.length; i++) {
// 	createNum(s_nodes[i], linknum, post, doc);
// 	linknum++;
//     }
//     for (var i=0; i<i_nodes.length; i++) {
// 	if (i_nodes[i].type == "hidden") continue;
// 	createNum(i_nodes[i], linknum, post, doc);
// 	linknum++;
//     }
//     for (var i=0; i<a_nodes.length; i++) {
// 	if (!a_nodes[i].hasAttribute('href')) continue;
// 	createNum(a_nodes[i], linknum, post, doc);
// 	linknum++;
//     }
//     for (var i=0; i<ar_nodes.length; i++) {
// 	if (!ar_nodes[i].hasAttribute('href')) continue;
// 	createNum(ar_nodes[i], linknum, post, doc);
// 	linknum++;
//     }
//     for (var i=0; i<img_nodes.length; i++) {
// 	if (!img_nodes[i].hasAttribute('src')) continue;
// 	createNum(img_nodes[i], linknum, post, doc);
// 	linknum++;
//     }
//     for (var i=0; i<embed_nodes.length; i++) {
// 	if (!embed_nodes[i].hasAttribute('src')) continue;
// 	createNum(embed_nodes[i], linknum, post, doc);
// 	linknum++;
//     }

//     // floaters have to be calculated afterwards because of
//     // the reflowing of non-floaters
//     for (var i=0; i<post.length; i++) {
// 	post[i]();
//     }

//     end = new Date();
// //     alert("elapse: " + (end.getTime() - st.getTime()));
//     } catch (e) {alert(e);}

//     return linknum;
// }

function already_linkified (doc)
{
    var nodes = doc.getElementsByTagName("SPAN");
    // When a node is deleted, it is deleted from nodes too. So we can't simply iterate through them
    for (var i=0; i<nodes.length;) {
	if (nodes[i].hasAttribute("__nodeid")) return true;
    }

    return false;
}

function removeExisting(doc)
{
    var nodes = doc.getElementsByTagName("SPAN");
    // When a node is deleted, it is deleted from nodes too. So we can't simply iterate through them
    for (var i=0; i<nodes.length;) {
	if (nodes[i].hasAttribute("__nodeid")) {
	    nodes[i].parentNode.removeChild (nodes[i]);
	} else {
	    i++;
	}
    }
}

function removeExistingNLs(cont)
{
    var frames = cont.frames;
    removeExisting(cont.document);
    for (var i=0; i<frames.length; i++) {
	removeExisting(frames[i].document);
    }
}

function getLinkNodes (doc)
{
    var types = ['input', 'a','select','img','embed','textarea','area'];
    var nodes = [];
    for (i=0; i<types.length; i++) {
	var tmp = doc.getElementsByTagName(types[i]);
	for (j=0; j<tmp.length; j++)
	    nodes.unshift (tmp[j]);
    }
    return nodes;
}

// For a single document, grab all the nodes
function doLinkNodes(doc, nodes, linknum)
{
    try {
	var post = [];

	// 20 at a time
	for (var i=0; i<20; i++) {
	    if (nodes.length <= 0) break;

	    var node = nodes.pop();

	    if ((node.tagName == "INPUT" && node.type == "hidden")
		|| ((node.tagName == "AREA" || node.tagName == "A") && !node.hasAttribute('href'))
		|| ((node.tagName == "IMG" || node.tagName == "EMBED") && !node.hasAttribute('src')))
		continue;
	    createNum(node, linknum, post, doc);
	    linknum++;
	}

	return [linknum, post, nodes];

	//     // floaters have to be calculated afterwards because of
	//     // the reflowing of non-floaters
	//     for (var i=0; i<post.length; i++) {
	// 	post[i]();
	//     }

    } catch (e) {alert(e);}

    //     return linknum;
}

function continueNumberedLinks (doc, linknum, nodes, docs)
{
    try {
	var ret = doLinkNodes(doc, nodes, linknum);
	if (ret[2].length > 0) {
	    setTimeout (continueNumberedLinks, 0, doc, ret[0], ret[2], docs);
	} else {
	    // floaters have to be calculated afterwards because of
	    // the reflowing of non-floaters
	    update_nl_pos (doc);
	    if (docs.length > 0) {
		var newdoc = docs.pop();
		setTimeout (continueNumberedLinks, 0, newdoc, ret[0], getLinkNodes (newdoc), docs);
	    } else {
		//message(ret[0] + " links numbered.");
	    }
	}

    } catch (e) {alert(e);}
}

function createNumberedLinks(cont)
{
    try {
    var frames = cont.frames;
    var docs = [];

    // Remove any existing spans. This is in response to double
    // numberedlinks that I can't seem to get rid of.
    removeExistingNLs(cont);

    for (var i=0; i<frames.length; i++) {
	docs.unshift (frames[i].document);
    }
    
    continueNumberedLinks (cont.document, 1, getLinkNodes (cont.document), docs);

    } catch (e) { alert(e);}
}

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

function setNumberedLinksVisibility(link_state, img_state)
{
    try {
    var frames = window._content.frames;
    setVisibility(window._content.document, link_state, img_state);
    for (var i=0; i<frames.length; i++) {
	setVisibility(frames[i].document, link_state, img_state);
    }
    } catch (e) {alert("setNumberedLinksVisibility: " + e);}
}

function toggleNumberedLinks()
{
    var buf_state = getBrowser().numberedLinks;
    getBrowser().numberedLinks = !buf_state;    
    setNumberedLinksVisibility (!buf_state, getBrowser().numberedImages);
}

function toggleNumberedImages()
{
    var buf_state = getBrowser().numberedImages;
    getBrowser().numberedImages = !buf_state;    
    setNumberedLinksVisibility (getBrowser().numberedLinks, !buf_state);
}

const nl_document_observer = {
    observe: function(subject, topic, url)
    {
	// FIXME: we should use subject aka _content. This could bust if
	// the buffer that needs nl != current buffer.
	var link_state = getBrowser().numberedLinks;
	var img_state = getBrowser().numberedImages;
        createNumberedLinks(subject);
	// Only show numbered links if the feature is enabled
	setNumberedLinksVisibility (link_state, img_state);
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
    } catch(e) {    log ("update_span_pos " + e); }
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
    } catch(e) {     log ("update_nl_pos " + e); }
}

function nl_resize ()
{
    var frames = window._content.frames;
    update_nl_pos (window._content.document);
    for (var i=0; i<frames.length; i++) {
	update_nl_pos (frames[i].document);
    }   
}
