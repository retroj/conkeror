// -*- java -*-

const nsIWebNavigation = Components.interfaces.nsIWebNavigation;

function Startup()
{
//   gBrowser = document.getElementById("content");
  var uriToLoad = "chrome://conkeror/content/help.html";
//   var uriToLoad = "file:///home/sabetts/src/conkeror/testframes.html";

//   var b = document.getElementById("blahblu");
//   b.setCurrentBrowser(0);

  init_commands();
  initKmaps();
  init_universal_arg();
  initBookmarkService();

  if ("arguments" in window && window.arguments.length >= 1 && window.arguments[0])
    uriToLoad = window.arguments[0];

  // Setup our status handler
  window.XULBrowserWindow = new nsBrowserStatusHandler();
  getBrowser().setProgressListener(window.XULBrowserWindow, 
				   Components.interfaces.nsIWebProgress.NOTIFY_ALL);

  // Set up our end document hook for numbered links
  var observerService = Components.classes["@mozilla.org/observer-service;1"]
      .getService(Components.interfaces.nsIObserverService);
  observerService.addObserver(nl_document_observer, "page-end-load", false);

  // Give it a chance to set itself up before loading the URL
  setTimeout(getWebNavigation().loadURI, 0, 
	     uriToLoad, nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null);

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

//   var appshell = Components.classes["@mozilla.org/appshell/appShellService;1"]
//                         .createInstance(Components.interfaces.nsIAppShellService);
//   appshell.registerTopLevelWindow(window);

  appCore.setWebShellWindow(window);

//   try {
//       getBrowser().addEventListener("PluginNotFound", missingPlugin, false);
//   } catch (e) { alert(e); }

  // Turn off typeahead. We'll use our own that's way better.
  gPrefService = Components.classes["@mozilla.org/preferences-service;1"]
                           .getService(Components.interfaces.nsIPrefBranch);
  gPrefService.setBoolPref("accessibility.typeaheadfind", false);

  // Load the RC file.
  try {
      if (!gPrefService.prefHasUserValue("conkeror.rcfile")) {
	  gPrefService.setCharPref("conkeror.rcfile", "");
      } else {
	  var rcfile = gPrefService.getCharPref("conkeror.rcfile");
	  if (rcfile.length)
	      load_rc_file(rcfile);
      }
  } catch (e) {window.alert(e);}

  // Give the browser focus.
  setTimeout(delayedStartup,0);
}

function delayedStartup()
{
    element = _content;

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
}

function nsBrowserStatusHandler()
{
  this.init();
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
      if (aStateFlags & nsIWebProgressListener.STATE_START) {
        if (aStateFlags & nsIWebProgressListener.STATE_IS_NETWORK &&
            aRequest && aWebProgress.DOMWindow == content)
	    {
		// starting document load
		this.startDocumentLoad(aRequest);
	    }

      } else if (aStateFlags & nsIWebProgressListener.STATE_STOP) {
	  if (aStateFlags & nsIWebProgressListener.STATE_IS_NETWORK) {
	      if (aRequest) {
		  if (aWebProgress.DOMWindow == content) {
		      this.endDocumentLoad(aRequest, aStatus);
		      updateModeline(getWebNavigation().currentURI);
		  }
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

  startDocumentLoad : function(aRequest)
  {
      const nsIChannel = Components.interfaces.nsIChannel;
      var urlStr = aRequest.QueryInterface(nsIChannel).originalURI.spec;
      var observerService = Components.classes["@mozilla.org/observer-service;1"]
                            .getService(Components.interfaces.nsIObserverService);
      observerService.notifyObservers(_content, "page-start-load", urlStr);
  },

  endDocumentLoad : function(aRequest, aStatus)
  {
      const nsIChannel = Components.interfaces.nsIChannel;
      var urlStr = aRequest.QueryInterface(nsIChannel).originalURI.spec;
      var observerService = Components.classes["@mozilla.org/observer-service;1"]
                            .getService(Components.interfaces.nsIObserverService);
      observerService.notifyObservers(_content, "page-end-load", urlStr);
  }

}

/// plugins
function missingPlugin(evt)
{
    window.alert("tough luck. yer missing a plugin");
    evt.preventDefault();
}

