// -*- java -*-
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

const nsCI               = Components.interfaces;
const nsIWebNavigation = Components.interfaces.nsIWebNavigation;

var console         = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
function log(msg) { console.logStringMessage(msg); }

function Startup()
{
    try {
//   gBrowser = document.getElementById("content");
  var uriToLoad = "chrome://conkeror/content/help.html";
//   var uriToLoad = "file:///home/sabetts/src/conkeror/testframes.html";

//   var b = document.getElementById("blahblu");
//   b.setCurrentBrowser(0);

  init_commands();
  initKmaps();
  init_universal_arg();
  initBookmarkService();

  try {
    // Create the browser instance component.
    appCore = Components.classes["@mozilla.org/appshell/component/browser/instance;1"]
			.createInstance(Components.interfaces.nsIBrowserInstance);
    if (!appCore)
      throw "couldn't create a browser instance";
  } catch (e) {
    alert("Error launching browser window:" + e);
    window.close(); // Give up.
    return;
  }


  // Setup our status handler
  window.XULBrowserWindow = new nsBrowserStatusHandler();
  window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
	.getInterface(Components.interfaces.nsIWebNavigation)
	.QueryInterface(Components.interfaces.nsIDocShellTreeItem).treeOwner
	.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
	.getInterface(Components.interfaces.nsIXULWindow)
	.XULBrowserWindow = window.XULBrowserWindow;
  window.QueryInterface(Components.interfaces.nsIDOMChromeWindow).browserDOMWindow =
      new nsBrowserAccess();

//   window.browserContentListener =
//       new nsBrowserContentListener(window, getBrowser());

//   var appshell = Components.classes["@mozilla.org/appshell/appShellService;1"]
//                         .createInstance(Components.interfaces.nsIAppShellService);
//   appshell.registerTopLevelWindow(window);

  // set default character set if provided
  if ("arguments" in window && window.arguments.length > 1 && window.arguments[1]) {
    if (window.arguments[1].indexOf("charset=") != -1) {
      var arrayArgComponents = window.arguments[1].split("=");
      if (arrayArgComponents) {
	//we should "inherit" the charset menu setting in a new window
	getMarkupDocumentViewer().defaultCharacterSet = arrayArgComponents[1];
      }
    }
  }

  appCore.setWebShellWindow(window);

  getBrowser().setProgressListener(window.XULBrowserWindow, Components.interfaces.nsIWebProgress.NOTIFY_ALL);


  if ("arguments" in window && window.arguments.length >= 1 && window.arguments[0])
    uriToLoad = window.arguments[0];

  if ("arguments" in window && window.arguments.length >= 3)
      getWebNavigation().loadURI(uriToLoad, nsIWebNavigation.LOAD_FLAGS_NONE, window.arguments[2], null, null);
  else
      getWebNavigation().loadURI(uriToLoad, nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null);

  // give the browser window a default width/height
  if (!document.documentElement.hasAttribute("width")) {
      document.documentElement.setAttribute("width", 640);
      document.documentElement.setAttribute("height", 480);
  }

//   // Give it a chance to set itself up before loading the URL
//   setTimeout(getWebNavigation().loadURI, 0,
//     uriToLoad, nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null);
  setTimeout(delayedStartup,0);
    } catch (e) { log ("haag" + e); }
}

const frame_focus_observer = {
    observe: function(subject, topic, url)
    {
    }
};

function delayedStartup()
{
    window.addEventListener("keypress", readKeyPress, false);

    element = _content;

    // Set up our end document hook for numbered links
    var observerService = Components.classes["@mozilla.org/observer-service;1"]
	.getService(Components.interfaces.nsIObserverService);
    observerService.addObserver(nl_document_observer, "page-end-load", false);
    observerService.addObserver(frame_focus_observer, "page-end-load", false);

    // because of the absolute position of the numbers, we need to
    // adjust when the window is resized.
    try {
	window.document.addEventListener("resize", nl_resize, true);
    } catch(e) {alert(e);}


    //   try {
    //       getBrowser().addEventListener("PluginNotFound", missingPlugin, false);
    //   } catch (e) { alert(e); }

    // Turn off typeahead. We'll use our own that's way better.
    gPrefService = Components.classes["@mozilla.org/preferences-service;1"]
	.getService(Components.interfaces.nsIPrefBranch);
    gPrefService.setBoolPref("accessibility.typeaheadfind", false);

    try {
	// Load the RC file.
	if (!gPrefService.prefHasUserValue("conkeror.rcfile")) {
	    gPrefService.setCharPref("conkeror.rcfile", "");
	} else {
	    var rcfile = gPrefService.getCharPref("conkeror.rcfile");
	    if (rcfile.length)
		load_rc_file(rcfile);
	}
    } catch (e) {window.alert(e);}

    // Web jumps have to be initialized after the rcfile is loaded for
    // the delicious webjumps
    init_webjumps();

    // This is a redo of the fix for jag bug 91884
    var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
	.getService(Components.interfaces.nsIWindowWatcher);
    if (window == ww.activeWindow) {
	element.focus();
    } else {
	// set the element in command dispatcher so focus will restore properly
	// when the window does become active
	if (element instanceof Components.interfaces.nsIDOMWindow) {
	    document.commandDispatcher.focusedWindow = element;
	    document.commandDispatcher.focusedElement = null;
	} else if (element instanceof Components.interfaces.nsIDOMElement) {
	    document.commandDispatcher.focusedWindow = element.ownerDocument.defaultView;
	    document.commandDispatcher.focusedElement = element;
	}
    }

    // Add a timer to update the modeline once a minute
    setInterval (updateModeline, 60000);
}

function nsBrowserStatusHandler()
{
  this.init();
}

function top_content (content)
{
    // an interesting feature is that the top level content's parent is itself
    var c = content;

    while (c != c.parent) c = c.parent;
    return c;
}

nsBrowserStatusHandler.prototype =
{
  // Stored Status, Link and Loading values
  status : "",
  lastURI: null,

  statusTimeoutInEffect : false,

  QueryInterface : function(aIID)
  {
    if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
	aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
	aIID.equals(Components.interfaces.nsIXULBrowserWindow) ||
	aIID.equals(Components.interfaces.nsISupports))
      return this;
    throw Components.results.NS_NOINTERFACE;
  },

  init : function()
  {
    this.statusTextField = document.getElementById("minibuffer-output");
    //    this.urlBar          = document.getElementById("urlbar");
  },

  destroy : function()
  {
      this.statusTextField = null;
  },

  setJSStatus : function(status)
  {
//       window.alert("setJSStatus");
    this.updateStatusField(status);
  },

  setJSDefaultStatus : function(status)
  {
//       window.alert("setJSDefaultStatus");
    this.updateStatusField(status);
  },

  setDefaultStatus : function(status)
  {
    this.updateStatusField(status);
  },

  setOverLink : function(link, b)
  {
    this.updateStatusField(link);
  },

  updateStatusField : function(text)
  {
    // check the current value so we don't trigger an attribute change
    // and cause needless (slow!) UI updates

    try{
     if (this.statusText != text) {
      this.statusTextField.value = text;
      this.statusText = text;
     }
    } catch (e) {window.alert(e);}
  },

  onLinkIconAvailable : function(aBrowser, aHref)
  {
      // Weee, do we care about this?
  },

  onProgressChange : function (aWebProgress, aRequest,
			       aCurSelfProgress, aMaxSelfProgress,
			       aCurTotalProgress, aMaxTotalProgress)
  {
//       window.alert("onprogressChange");
      // We don't care about this right now


  },

  onStateChange : function(aWebProgress, aRequest, aStateFlags, aStatus)
  {
      try {
      const nsIWebProgressListener = Components.interfaces.nsIWebProgressListener;
      const nsIChannel = Components.interfaces.nsIChannel;

//       log (aRequest.QueryInterface(nsIChannel).originalURI.spec + ": " 
// 	   + (aStateFlags & nsIWebProgressListener.STATE_IS_WINDOW?"+":"-") + "window "
// 	   + (aStateFlags & nsIWebProgressListener.STATE_IS_DOCUMENT?"+":"-") + "document "
// 	   + (aStateFlags & nsIWebProgressListener.STATE_IS_NETWORK?"+":"-") + "network "
// 	   + " " + (aWebProgress.DOMWindow == content)
// 	   + " " + (aWebProgress.DOMWindow.parent == content));

      if (aStateFlags & nsIWebProgressListener.STATE_START) {
	if (aStateFlags & nsIWebProgressListener.STATE_IS_NETWORK &&
	    aRequest && aWebProgress.DOMWindow == content)
	    {
		// starting document load
		this.startDocumentLoad(aRequest, aWebProgress);
	    }

      } else if (aStateFlags & nsIWebProgressListener.STATE_STOP) {
	  if (aStateFlags & nsIWebProgressListener.STATE_IS_NETWORK) {
	      if (aRequest) {
// 		  if (aWebProgress.DOMWindow == content) {
		  this.endDocumentLoad(aRequest, aStatus, aWebProgress);
		      updateModeline(getWebNavigation().currentURI);
// 		  }
	      }
	  }

	  var msg = "";
	  if (aRequest) {
	      const kErrorBindingAborted = 0x804B0002;
	      const kErrorNetTimeout = 0x804B000E;
	      const kErrorNotFound = 2152398878;
	      switch (aStatus) {
	      case kErrorBindingAborted:
		  msg = "Quit";
		  break;
	      case kErrorNetTimeout:
		  msg = "Timed Out.";
		  break;
	      case kErrorNotFound:
		  msg = "Not Found.";
	      }
	  }
	  if (msg == "") {
	      msg = "Done.";
	  }
	  this.updateStatusField(msg);
      }
      } catch(e) {window.alert(e);}
  },

  onLocationChange : function(aWebProgress, aRequest, aLocation)
  {
      updateModeline(aLocation);
  },

  onStatusChange : function(aWebProgress, aRequest, aStatus, aMessage)
  {
//     window.alert("status change: " + aMessage);
    this.updateStatusField(aMessage);
  },

  onSecurityChange : function(aWebProgress, aRequest, aState)
  {
//       window.alert("onSecurityChange");
  },

  startDocumentLoad : function(aRequest, aWebProgress)
  {
      const nsIChannel = Components.interfaces.nsIChannel;
      var urlStr = aRequest.QueryInterface(nsIChannel).originalURI.spec;
      var observerService = Components.classes["@mozilla.org/observer-service;1"]
			    .getService(Components.interfaces.nsIObserverService);
      observerService.notifyObservers(top_content (aWebProgress.DOMWindow), "page-start-load", urlStr);
  },

  endDocumentLoad : function(aRequest, aStatus, aWebProgress)
  {
      const nsIChannel = Components.interfaces.nsIChannel;
      var urlStr = aRequest.QueryInterface(nsIChannel).originalURI.spec;
      var observerService = Components.classes["@mozilla.org/observer-service;1"]
			    .getService(Components.interfaces.nsIObserverService);
      observerService.notifyObservers(top_content (aWebProgress.DOMWindow), "page-end-load", urlStr);
  }

}

/// plugins
function missingPlugin(evt)
{
    window.alert("tough luck. yer missing a plugin");
    evt.preventDefault();
}

/// Browser access

function nsBrowserAccess()
{
}

nsBrowserAccess.prototype =
{
  QueryInterface : function(aIID)
  {
    if (aIID.equals(nsCI.nsIBrowserDOMWindow) ||
	aIID.equals(nsCI.nsISupports))
      return this;
    throw Components.results.NS_NOINTERFACE;
  },

  openURI : function(aURI, aOpener, aWhere, aContext)
  {
    var newWindow = null;
    var referrer = null;
//     if (aWhere == nsCI.nsIBrowserDOMWindow.OPEN_DEFAULTWINDOW) {
//       switch (aContext) {
//         case nsCI.nsIBrowserDOMWindow.OPEN_EXTERNAL :
//           aWhere = gPrefService.getIntPref("browser.link.open_external");
//           break;
//         default : // OPEN_NEW or an illegal value
//           aWhere = gPrefService.getIntPref("browser.link.open_newwindow");
//       }
//     }
//     var url = aURI ? aURI.spec : "about:blank";
//     switch(aWhere) {
//       case nsCI.nsIBrowserDOMWindow.OPEN_NEWWINDOW :
//         newWindow = openDialog(getBrowserURL(), "_blank", "all,dialog=no", url);
//         break;
//       case nsCI.nsIBrowserDOMWindow.OPEN_NEWTAB :
//         var newTab = gBrowser.addTab("about:blank");
//         if (!gPrefService.getBoolPref("browser.tabs.loadDivertedInBackground"))
//           gBrowser.selectedTab = newTab;
//         newWindow = gBrowser.getBrowserForTab(newTab).docShell
//                             .QueryInterface(nsCI.nsIInterfaceRequestor)
//                             .getInterface(nsCI.nsIDOMWindow);
//         try {
//           if (aOpener) {
//             referrer = Components.classes["@mozilla.org/network/standard-url;1"]
//                                  .createInstance(nsCI.nsIURI);
//             referrer.spec = Components.lookupMethod(aOpener,"location")
//                                       .call(aOpener);
//	    alert ("referrer: " + referrer);
//           }
//           newWindow.QueryInterface(nsCI.nsIInterfaceRequestor)
//                    .getInterface(nsCI.nsIWebNavigation)
//                    .loadURI(url, nsCI.nsIWebNavigation.LOAD_FLAGS_NONE,
//                             referrer, null, null);
//         } catch(e) {
//         }
//         break;
//       default : // OPEN_CURRENTWINDOW or an illegal value
	try {
	  if (aOpener) {
	    newWindow = Components.lookupMethod(aOpener,"top")
				  .call(aOpener);
	    referrer = Components.classes["@mozilla.org/network/standard-url;1"]
				 .createInstance(nsCI.nsIURI);
	    referrer.spec = Components.lookupMethod(aOpener,"location")
				      .call(aOpener);
	    newWindow.QueryInterface(nsCI.nsIInterfaceRequestor)
		     .getInterface(nsIWebNavigation)
		     .loadURI(url, nsIWebNavigation.LOAD_FLAGS_NONE, referrer,
			      null, null);
//           } else {
//             newWindow = gBrowser.selectedBrowser.docShell
//                                 .QueryInterface(nsCI.nsIInterfaceRequestor)
//                                 .getInterface(nsCI.nsIDOMWindow);
//             loadURI(url, null);
	  }
	} catch(e) {
	}
//     }
    return newWindow;
  }
}
