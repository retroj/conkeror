// -*- mode: java -*-

//// numbered links

function selectNumberedLink_1() { selectNumberedLink(1); }
function selectNumberedLink_2() { selectNumberedLink(2); }
function selectNumberedLink_3() { selectNumberedLink(3); }
function selectNumberedLink_4() { selectNumberedLink(4); }
function selectNumberedLink_5() { selectNumberedLink(5); }
function selectNumberedLink_6() { selectNumberedLink(6); }
function selectNumberedLink_7() { selectNumberedLink(7); }
function selectNumberedLink_8() { selectNumberedLink(8); }
function selectNumberedLink_9() { selectNumberedLink(9); }

function selectNumberedLink(num)
{
    readInput("Goto Numbered Link:", null, "onNumberedLinkKeyPress(event);");
    var field = document.getElementById('input-field');
    field.value = num;
}

function closeNumberedLinkBar()
{
    closeInput(false);
}

function onNumberedLinkKeyPress(evt)
{
    var doc = window.content.document;
    if (!doc) return;

    if (evt.keyCode == KeyEvent.DOM_VK_RETURN) {
	var findfield = document.getElementById("input-field");
	var link = findfield.value;
	var nodes = getPageLinkNodes();
	for (var i=0; i<nodes.length; i++) {
	    if (link == i+1) {
		if (nodes[i].tagName == "A")
		    if (evt.altKey) {
			nodes[i].focus();
		    } else {
			getWebNavigation().loadURI(nodes[i].href, 
						   nsIWebNavigation.LOAD_FLAGS_NONE, 
						   null, null, null);
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
	closeNumberedLinkBar();
    }
    else if (evt.keyCode == KeyEvent.DOM_VK_TAB 
	     || evt.keyCode == KeyEvent.DOM_VK_ESCAPE
	     || (evt.ctrlKey && evt.charCode == 103)) {
	closeNumberedLinkBar();
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
    var doc = _content.content.document;
    setNumberedLinksState (!doc.__numberedlinks_linkState);
}
