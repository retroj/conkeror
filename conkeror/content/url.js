// -*- mode: java -*-

function onUrlKeyPress(event)
{
    var field = document.getElementById("input-field");
//     var urlbar = document.getElementById("input-toolbox");

    if (event.keyCode == KeyEvent.DOM_VK_RETURN) {
	try{
	    var url = field.value;
	    closeUrlBar();
	    getWebNavigation().loadURI(url, nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null);
	} catch (e) {window.alert(e);}
	//    } else if (event.keyCode == KeyEvent.DOM_VK_TAB) {
	// paste current url
    } else if (event.keyCode == KeyEvent.DOM_VK_TAB 
	       || event.keyCode == KeyEvent.DOM_VK_RETURN
	       || event.keyCode == KeyEvent.DOM_VK_TAB 
	       || event.keyCode == KeyEvent.DOM_VK_ESCAPE
	       || (event.ctrlKey && (event.charCode == 103))) {
	closeUrlBar();
	event.preventDefault();
	event.preventBubble();
//     } else if (event.ctrlKey && event.charCode == 121) { // C-y
// 	field.value += gBrowser.currentURI.spec;
// 	event.preventDefault();
    }


}

function closeUrlBar()
{
    closeInput();
}

// function focusUrlBar()
// {
//     var url = document.getElementById("input-field");
//     var urlbar = document.getElementById("url-toolbox");
//     urlbar.hidden = false;
//     url.focus();
//     url.value = getWebNavigation().currentURI.spec;
// }
