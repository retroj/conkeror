// -*- mode: java -*-

//// numbered links

// This decides whether the link is opened in the current buffer, a
// new one, or a new frame.
var gNumberedLinksPrefix = null;

function selectNumberedLink_1(args) { selectNumberedLink(1, args); }
function selectNumberedLink_2(args) { selectNumberedLink(2, args); }
function selectNumberedLink_3(args) { selectNumberedLink(3, args); }
function selectNumberedLink_4(args) { selectNumberedLink(4, args); }
function selectNumberedLink_5(args) { selectNumberedLink(5, args); }
function selectNumberedLink_6(args) { selectNumberedLink(6, args); }
function selectNumberedLink_7(args) { selectNumberedLink(7, args); }
function selectNumberedLink_8(args) { selectNumberedLink(8, args); }
function selectNumberedLink_9(args) { selectNumberedLink(9, args); }

function goto_numberedlink(args) { selectNumberedLink("", args); }

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
}

function onNumberedLinkKeyPress(evt)
{
    var doc = window.content.document;
    if (!doc) return;

    if (evt.keyCode == KeyEvent.DOM_VK_RETURN) {
	var findfield = document.getElementById("input-field");
	var link = findfield.value;
	var nodes = getPageLinkNodes();
	closeNumberedLinkBar();
	for (var i=0; i<nodes.length; i++) {
	    if (link == i+1) {
		if (nodes[i].tagName == "A")
		    if (evt.altKey) {
			nodes[i].focus();
		    } else if (evt.ctrlKey) {
			getBrowser().newBrowser(nodes[i].href);
		    } else {
			open_url_in(gNumberedLinksPrefix, nodes[i].href);
		    } else {
			if (nodes[i].tagName == "INPUT" 
			    && (nodes[i].type == "submit" || nodes[i].type == "button")) {
			    if (evt.altKey) {
				nodes[i].focus();
			    } else
				nodes[i].click();
		    } else 
			nodes[i].focus();
		    }
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

function toggleNum(node, n, TurnOn)
{
    try{
    var doc = window.content.document;
    var numText = doc.createTextNode('[' + n + ']');

    if (node.tagName == "A") {
	if (TurnOn) {
	    node.insertBefore(numText, node.firstChild);
	} else {
	    node.removeChild(node.firstChild);
	}
    } else {
	if (TurnOn) {
	    node.parentNode.insertBefore(numText, node);
	} else {
	    node.parentNode.removeChild(node.previousSibling);
	}
    }
    } catch(e) {window.alert(e);}
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

// For a single document, grab all the nodes
function getLinkNodes(doc)
{
    var a_nodes = doc.getElementsByTagName('a');
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

    return links;
}

function setNumberedLinksState(linksOn)
{
    try {
    var doc = _content.content.document;
    if (!doc) return;

    // Keep track of the numbered state
    if (linksOn == doc.__numberedlinks_linkState)
	return;
    doc.__numberedlinks_linkState = linksOn;

    // accumulate our nodes
    var nodes = getPageLinkNodes();

    // Finally, give them numbers
    for (var i=0; i<nodes.length; i++) {
	toggleNum(nodes[i],i+1, linksOn);
    }

    } catch (e) {alert("setNumberedLinksState: " + e);}
}

function toggleNumberedLinks() 
{
    var buf_state = getBrowser().numberedLinks;
    getBrowser().numberedLinks = !buf_state;    
    message("Toggling numbered links...");
    setNumberedLinksState (!buf_state);
    message("Toggling numbered links...Done.");
}

const nl_document_observer = {
    observe: function(subject, topic, url)
    {
	// FIXME: we should use subject aka _content. This could bust if
	// the buffer that needs nl != current buffer.
	var buf_state = getBrowser().numberedLinks;
	// Only show numbered links if the feature is enabled
	if (buf_state)
        setNumberedLinksState(true);
    }
};
