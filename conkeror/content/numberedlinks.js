// -*- mode: java -*-

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
    closeInput(false, true);
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

function matchLink (evt, doc, link)
{
    try {
	var nodes = doc.getElementsByTagName('SPAN');
	for (var i=0; i<nodes.length; i++) {
	    // 	    if (nodes[i].style.visibility == "hidden") continue;
	    if (link == nodes[i].getAttribute("__conkid")) {
		var node = doc.getElementById(nodes[i].getAttribute("__nodeid"));
		var type = nodes[i].getAttribute("__conktype");
		if (node) {
		    if (type == "link") {
			if (metaPressed(evt)) {
			    node.focus();
			} else if (evt.ctrlKey) {
			    getBrowser().newBrowser(node.href);
			} else {
			    open_url_in(gNumberedLinksPrefix, node.href);
			}
		    } else if (type == "image") {
			copy_img_location(node);
		    } else if (type == "button") {
			if (metaPressed(evt)) {
			    node.focus();
			} else
			    node.click();
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

function createNL (doc, node, id, type, where, post, img)
{
    try{
	var span = doc.createElement("span");

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
	span.style.color = "black";
	span.style.backgroundColor = type == "image" ? "pink" : "lightgray";
	span.style.fontWeight = "normal";
	span.style.fontFamily = "sans-serif";
	span.style.fontSize = "small";
	span.style.textAlign = "center";
	span.style.borderWidth = "1px";
	span.style.borderColor = "gray";
	span.style.borderStyle = "solid";
	span.style.MozBorderRadius = "0.5em";
// 	span.style.visibility = "hidden";
	if (where == NL_FLOATER || where == NL_IMGFLOATER) {
	    post.push(function ()
	                {
			    var pt = abs_point(where == NL_IMGFLOATER ? img : node);
			    span.style.left =  pt.x + "px";
			    span.style.top = pt.y + "px";
			});
	    span.style.left = "0px";
	    span.style.top = "0px";
	    span.style.position = "absolute";
	    span.style.MozOpacity = "0.8";
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

function createNum(node, n, floaters)
{
    try{
    var doc = node.ownerDocument;

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
	} else if (node.tagName == "INPUT"
		   && (node.type == "submit" 
		       || node.type == "button"
		       || node.type == "radio")) {
	    createNL (doc, node, n, "button", node.type != "radio"?NL_FLOATER:NL_BEFORE, floaters);
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
function doLinkNodes(doc, linknum)
{
    try {
//     var a_nodes = doc.links;
    var st = new Date();
    var post = [];
    var a_nodes = doc.getElementsByTagName('a');
    var ar_nodes = doc.getElementsByTagName('area');
    var img_nodes = doc.getElementsByTagName('img');
    var i_nodes = doc.getElementsByTagName('input');
    var s_nodes = doc.getElementsByTagName('select');
    var t_nodes = doc.getElementsByTagName('textarea');

    for (var i=0; i<t_nodes.length; i++) {
	createNum(t_nodes[i], linknum, post);
	linknum++;
    }
    for (var i=0; i<s_nodes.length; i++) {
	createNum(s_nodes[i], linknum, post);
	linknum++;
    }
    for (var i=0; i<i_nodes.length; i++) {
	if (i_nodes[i].type == "hidden") continue;
	createNum(i_nodes[i], linknum, post);
	linknum++;
    }
    for (var i=0; i<a_nodes.length; i++) {
	if (!a_nodes[i].hasAttribute('href')) continue;
	createNum(a_nodes[i], linknum, post);
	linknum++;
    }
    for (var i=0; i<ar_nodes.length; i++) {
	if (!ar_nodes[i].hasAttribute('href')) continue;
	createNum(ar_nodes[i], linknum, post);
	linknum++;
    }
    for (var i=0; i<img_nodes.length; i++) {
	if (!img_nodes[i].hasAttribute('src')) continue;
	createNum(img_nodes[i], linknum, post);
	linknum++;
    }

    // floaters have to be calculated afterwards because of
    // the reflowing of non-floaters
    for (var i=0; i<post.length; i++) {
	post[i]();
    }

    end = new Date();
//     alert("elapse: " + (end.getTime() - st.getTime()));
    } catch (e) {alert(e);}

    return linknum;
}

function removeExisting(doc)
{
    var nodes = doc.getElementsByTagName("SPAN");
    for (var i=0; i<nodes.length; i++) {
	if (!nodes[i].hasAttribute("__nodeid")) continue;
	nodes[i].parent.removeChild(nodes[i]);
    }
}

function removeExistingNLs()
{
    var frames = window._content.frames;
    removeExisting(window._content.document);
    for (var i=0; i<frames.length; i++) {
	removeExisting(frames[i].document);
    }
}

function createNumberedLinks()
{
    // Remove any existing spans. This is in response to double
    // numberedlinks that I can't seem to get rid of.
    removeExistingNLs();
    // Now add ours
    var linknum = 1;
    // The main content may have link nodes as well as it's frames.
    var frames = window._content.frames;
    linknum = doLinkNodes(window._content.document, linknum);
    for (var i=0; i<frames.length; i++) {
	linknum = doLinkNodes(frames[i].document, linknum);
    }
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
    if (img_state)
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
        createNumberedLinks();
	// Only show numbered links if the feature is enabled
	setNumberedLinksVisibility (link_state, img_state);
    }
};

function update_nl_pos (doc)
{
    var nodes = doc.getElementsByTagName("SPAN");
    for (var i=0; i<nodes.length; i++) {
	if (!nodes[i].hasAttribute("__nodeid")) continue;
	var node = doc.getElementById(nodes[i].getAttribute("__nodeid"));
	if (nodes[i].style.position == "absolute"
	    && nodes[i].style.display != "none") {
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
	    nodes[i].style.left =  pt.x + "px";
	    nodes[i].style.top = pt.y + "px";
	}
    }
}

function nl_resize ()
{
    var frames = window._content.frames;
    update_nl_pos (window._content.document);
    for (var i=0; i<frames.length; i++) {
	update_nl_pos (frames[i].document);
    }   
}
