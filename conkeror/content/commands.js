// -*- mode: java -*-

// Functions that are called by commands in conkeror.xul and that
// aren't part of a module go here.

function goBack()
{
    getWebNavigation().goBack();
}

function goForward()
{
    getWebNavigation().goForward();
}

function stopLoading()
{
    getWebNavigation().stop(nsIWebNavigation.STOP_NETWORK);
}

function reload ()
{
    return getBrowser().webNavigation.reload(nsIWebNavigation.LOAD_FLAGS_NONE);
}

// frame navigation

function listFrames()
{
    try {
    var frames = window._content.frames;

    if (frames.length == 0)
	return;

    var w = document.commandDispatcher.focusedWindow;
    var next = 0;

    // Find the next frame to focus
    for (var i=0; i<frames.length; i++) {
	if (w == frames[i]) {
	    next = i+1;
	    break;
	}
    }
    // Focus the next one, 0 if we're at the last one
    if (next >= frames.length)
	next = 0;
    frames[next].focus();
    var oldbg = frames[next].document.bgColor;
    frames[next].document.bgColor = "red";
    setTimeout(function(doc, bgcolor) { doc.bgColor = bgcolor }, 100, frames[next].document, oldbg);

    } catch(e) {alert(e);}
}

//     alert(frames.length);

//     alert(window.document.getElementsByTagName('iframe'));
//     alert(frames[0].top.parent.document);
//     var foo = frames[0].parent.document.createElement("toolbox");
//     frames[0].parent.childNodes;

//     frames[0].focus();

//     var popup = frames[0].document.createElement("popup");
//     var txt = frames[0].document.createElement("label");
//     txt.value = "blah";
//     popup.appendChild(txt);
//     popup.id = "framepopup";
// //     popup.showPopup(frames[0], 0, 0);

//     var w = document.commandDispatcher.focusedWindow;
//     var elem = document.commandDispatcher.focusedElement;
// //     alert(elem);
// //     alert(w);
// //     frames[0].document.write("hey you");
// //     alert(window.content);
// //     alert(frames[0]);
// //     alert(frames[0].window.firstChild);
// //     for (var i=0; i<frames[0].attributes.length; i++) {
// // 	alert(frames[0].attributes[i]);
// //     }
// //     frames[1].window.focus();

function scrollHorizComplete(n)
{
    var w = document.commandDispatcher.focusedWindow;
    w.scrollTo(n>0?w.scrollMaxX:0, w.scrollY);
}

function view_source()
{
    try {
    var loadFlags = Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE;
    var viewSrcUrl = "view-source:" + getWebNavigation().currentURI.spec;;
    getWebNavigation().loadURI(viewSrcUrl, loadFlags, null, null, null);
    } catch(e) {alert(e);}
}

function newWindow()
{
    window.open("chrome://conkeror/content");
}
