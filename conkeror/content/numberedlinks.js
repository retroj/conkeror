// -*- mode: java -*-

//// numbered links

// This decides whether the link is opened in the current buffer, a
// new one, or a new frame.
var gNumberedLinksPrefix = null;
// Set this to true and after a numberedlink is selected, they will be turned off
var gTurnOffLinksAfter = false;
// Set this to true to display only images
var gOnlyImages = false;

function selectNumberedLink_1(args) { selectNumberedLink(1, args); }
function selectNumberedLink_2(args) { selectNumberedLink(2, args); }
function selectNumberedLink_3(args) { selectNumberedLink(3, args); }
function selectNumberedLink_4(args) { selectNumberedLink(4, args); }
function selectNumberedLink_5(args) { selectNumberedLink(5, args); }
function selectNumberedLink_6(args) { selectNumberedLink(6, args); }
function selectNumberedLink_7(args) { selectNumberedLink(7, args); }
function selectNumberedLink_8(args) { selectNumberedLink(8, args); }
function selectNumberedLink_9(args) { selectNumberedLink(9, args); }

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

function onNumberedLinkKeyPress(evt)
{
    var doc = window.content.document;
    if (!doc) return;

    if (evt.keyCode == KeyEvent.DOM_VK_RETURN) {
	var findfield = document.getElementById("input-field");
	var link = findfield.value;
	var nodes = doc.getElementsByTagName('SPAN');
	closeNumberedLinkBar();
	for (var i=0; i<nodes.length; i++) {
// 	    if (nodes[i].style.visibility == "hidden") continue;
	    if (link == nodes[i].getAttribute("__conkid")) {
		var node = doc.getElementById(nodes[i].getAttribute("__nodeid"));
		var type = nodes[i].getAttribute("__conktype");
		if (node) {
		    if (type == "link") {
			if (evt.altKey) {
			    node.focus();
			} else if (evt.ctrlKey) {
			    getBrowser().newBrowser(node.href);
			} else {
			    open_url_in(gNumberedLinksPrefix, node.href);
			}
		    } else if (type == "image") {
			copy_img_location(node);
		    } else if (type == "button") {
			if (evt.altKey) {
			    node.focus();
			} else
			    node.click();
		    } else {
			node.focus();
		    }
		}
		evt.preventDefault();
		evt.preventBubble();
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
}

function onNumberedLinkBlur() {

}

function hintify (doc, node, id, type)
{
    try{
	var span = doc.createElement("span");
	var pt = abs_point (node);
	// Abort if we can't get an absolute positoin for it.
// 	alert ("(" + id + ")" + "hintify: " + node + " " + pt.x + " " + pt.y);

	if (pt == null)
	    return;
	var nodeid;
	if (node.hasAttributes()
	    && node.hasAttribute("id"))
	    nodeid = node.getAttribute("id");
	else {
	    nodeid = "__CONK_" + id;
	    node.setAttribute("id", nodeid);
	}
	span.appendChild (doc.createTextNode(id));
	span.setAttribute("__conkid", id);
	span.setAttribute("__nodeid", nodeid);
	span.setAttribute("__conktype", type);
	span.setAttribute ("style", "");
	span.style.left =  pt.x + "px";
	span.style.top = pt.y + "px";
	span.style.position = "absolute";
	if (type == "image")
	    span.style.backgroundColor = "pink";
	else
	    span.style.backgroundColor = "lightgray";
	span.style.color = "black";
	span.style.fontWeight = "bold";
	span.style.fontFamily = "sans-serif";
	span.style.fontSize = "small";
	span.style.textAlign = "center";
	span.style.borderWidth = "1px";
	span.style.borderColor = "gray";
	span.style.borderStyle = "solid";
// 	span.style.paddingLeft = "1px";
// 	span.style.paddingRight = "1px";
	span.style.MozBorderRadius = "0.5em";
	span.style.MozOpacity = "0.8";
	span.style.zIndex = "999"; // always on top
	span.style.visibility = "hidden";

	doc.body.appendChild (span);
    } catch (e) {alert("hintify: " + e);}
    //     alert (node.offsetTop + " " + node.offsetLeft);
}

function createNum(node, n)
{
    try{
    var doc = node.ownerDocument;

    if (node.hasAttributes()) {
	if (node.tagName == "A"
	    || node.tagName == "AREA") {
	    hintify (doc, node, n, "link");
	} else if (node.tagName == "IMG") {
	    hintify (doc, node, n, "image");
	} else if (node.tagName == "INPUT" 
		   && (node.type == "submit" 
		       || node.type == "button"
		       || node.tpe == "radio")) {
	    hintify (doc, node, n, "button");
	} else {
	    hintify (doc, node, n, "widget");
	}
    }
    } catch(e) {window.alert("createNum: " + e);}
}

// Handle frames if they're present
function getPageLinkNodes()
{
    var frames = window._content.frames;

    // The main content may have link nodes as well as it's frames.
    var nodes = getLinkNodes(_content.content.document);
    var tmp;
    for (var i=0; i<frames.length; i++) {
	tmp = getLinkNodes(frames[i].document);
	// is javascript this crappy?
	for (var j=0; j<tmp.length; j++)
	    nodes.push(tmp[j]);
    }
    return nodes;
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
function getLinkNodes(doc)
{
//     var a_nodes = doc.links;
    var a_nodes = doc.getElementsByTagName('a');
    var ar_nodes = doc.getElementsByTagName('area');
    var img_nodes = doc.getElementsByTagName('img');
    var i_nodes = doc.getElementsByTagName('input');
    var s_nodes = doc.getElementsByTagName('select');
    var t_nodes = doc.getElementsByTagName('textarea');

    var links = [];


    for (var i=0; i<t_nodes.length; i++) {
	links.push(t_nodes[i]);
    }
    for (var i=0; i<s_nodes.length; i++) {
	links.push(s_nodes[i]);
    }
    for (var i=0; i<i_nodes.length; i++) {
	if (i_nodes[i].type == "hidden") continue;
	links.push(i_nodes[i]);
    }
    for (var i=0; i<a_nodes.length; i++) {
	if (!a_nodes[i].hasAttribute('href')) continue;
	links.push(a_nodes[i]);
    }
    for (var i=0; i<ar_nodes.length; i++) {
	if (!ar_nodes[i].hasAttribute('href')) continue;
	links.push(ar_nodes[i]);
    }
    for (var i=0; i<img_nodes.length; i++) {
	if (!img_nodes[i].hasAttribute('src')) continue;
	links.push(img_nodes[i]);
    }

    return links;
}

function createNumberedLinks()
{
    try {
    var doc = _content.content.document;
    if (!doc) return;

    // We need it to be true or false.
//     if (doc.__numberedlinks_linkState == null)
// 	doc.__numberedlinks_linkState = true;
//     // Keep track of the numbered state
//     if (linksOn == doc.__numberedlinks_linkState)
// 	return;
//     doc.__numberedlinks_linkState = linksOn;

    // accumulate our nodes
    var nodes = getPageLinkNodes();

    // Finally, give them numbers
    for (var i=0; i<nodes.length; i++) {
	createNum(nodes[i],i+1);
    }

    } catch (e) {alert("setNumberedLinksState: " + e);}
}

function setNumberedLinksVisibility(doc, link_state, img_state)
{
    try {
    var nodes = doc.getElementsByTagName('SPAN');
    for (var i=0; i<nodes.length; i++) {
	if (nodes[i].hasAttribute("__conkid")) {
	    if (nodes[i].getAttribute("__conktype") == "image")
		nodes[i].style.visibility = img_state ? "visible":"hidden";
	    else
		nodes[i].style.visibility = link_state ? "visible":"hidden";
	}
// 	alert(nodes[i].hidden);
    }
    } catch (e) {alert("setNumberedLinksVisibility: " + e);}
}

function toggleNumberedLinks()
{
    var buf_state = getBrowser().numberedLinks;
    getBrowser().numberedLinks = !buf_state;    
//     message("Toggling numbered links...");
//     setNumberedLinksState (!buf_state);
//     message("Toggling numbered links...Done.");
    setNumberedLinksVisibility (window.content.document, !buf_state, getBrowser().numberedImages);
}

function toggleNumberedImages()
{
    var buf_state = getBrowser().numberedImages;
    getBrowser().numberedImages = !buf_state;    
//     message("Toggling numbered links...");
//     setNumberedLinksState (!buf_state);
//     message("Toggling numbered links...Done.");
    setNumberedLinksVisibility (window.content.document, getBrowser().numberedLinks, !buf_state);
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
	setNumberedLinksVisibility (window.content.document, link_state, img_state)
    }
};
