// -*- java -*-

const nsIWebNavigation = Components.interfaces.nsIWebNavigation;

// some predefined key maps
var 	ctrlc_kmap    = [];
var 	ctrlx_kmap    = [];
var 	bookmark_kmap = [];
var 	four_kmap     = [];
var 	five_kmap     = [];
var 	top_kmap      = [];
var 	input_kmap    = [];
var 	textarea_kmap = [];
var 	select_kmap   = [];

function initKmaps()
{
    define_key(four_kmap, make_key("b", null, 0), null, "switch-to-browser-other-window");

    define_key(ctrlx_kmap, make_key("b", null, 0), null, "switch-to-browser"); 
    define_key(ctrlx_kmap, make_key("k", null, 0), null, "kill-browser"); 
    define_key(ctrlx_kmap, make_key("f", null, MOD_CTRL), null, "find-url"); 
    define_key(ctrlx_kmap, make_key("c", null, MOD_CTRL), null, "quit"); 
    define_key(ctrlx_kmap, make_key("1", null, 0), null, "delete-other-windows"); 
    define_key(ctrlx_kmap, make_key("0", null, 0), null, "delete-window"); 
    define_key(ctrlx_kmap, make_key("2", null, 0), null, "split-window"); 
    define_key(ctrlx_kmap, make_key("o", null, 0), null, "other-window"); 
    
    define_key(five_kmap, make_key("f", null, MOD_CTRL), null, "switch-to-browser-other-frame"); 
    define_key(five_kmap, make_key("0", null, 0), null, "delete-frame");

    
    define_key(bookmark_kmap, make_key("m", null,0), null, "bookmark-current-url"); 
    define_key(bookmark_kmap, make_key("b", null, 0), null, "goto-bookmark"); 
    define_key(bookmark_kmap, make_key("l", null,0), null, "bookmark-bmenu-list"); 

    define_key(ctrlx_kmap, make_key("4", null, 0), four_kmap, null); 
    define_key(ctrlx_kmap, make_key("5", null, 0), five_kmap, null); 
    define_key(ctrlx_kmap, make_key("r", null, 0), bookmark_kmap, null); 

    define_key(top_kmap, make_key("x", null,MOD_CTRL), ctrlx_kmap, null);
    define_key(top_kmap, make_key("c", null,MOD_CTRL), ctrlc_kmap, null); 

    define_key(top_kmap, make_key("u", null, 0), null, "copy-link-location");
    define_key(top_kmap, make_key(" ", null, MOD_ALT), null, "yank-to-clipboard");
    define_key(top_kmap, make_key("l", null, MOD_CTRL), null, "open-url");
    define_key(top_kmap, make_key("l", null, MOD_ALT), null, "numberedlinks-toggle");
    define_key(top_kmap, make_key("g", null,0), null, "open-url"); 
    define_key(top_kmap, make_key("i", null, 0), null, "view-source");
    define_key(top_kmap, make_key("s", null, MOD_CTRL), null, "isearch-forward");
    define_key(top_kmap, make_key("r", null, MOD_CTRL), null, "isearch-backward");
    define_key(top_kmap, make_key("B", null, MOD_SHIFT), null, "go-back");
    define_key(top_kmap, make_key("F", null, MOD_SHIFT), null, "go-forward");
    define_key(top_kmap, make_key("R", null, MOD_SHIFT), null, "revert-browser");
    define_key(top_kmap, make_key("f", null, 0), null, "next-frame");
    define_key(top_kmap, make_key("g", null, MOD_CTRL), null, "stop-loading");
    define_key(top_kmap, make_key("1", null, 0), null, "numberedlinks-1");
    define_key(top_kmap, make_key("2", null, 0), null, "numberedlinks-2");
    define_key(top_kmap, make_key("3", null, 0), null, "numberedlinks-3");
    define_key(top_kmap, make_key("4", null, 0), null, "numberedlinks-4");
    define_key(top_kmap, make_key("5", null, 0), null, "numberedlinks-5");
    define_key(top_kmap, make_key("6", null, 0), null, "numberedlinks-6");
    define_key(top_kmap, make_key("7", null, 0), null, "numberedlinks-7");
    define_key(top_kmap, make_key("8", null, 0), null, "numberedlinks-8");
    define_key(top_kmap, make_key("9", null, 0), null, "numberedlinks-9");
    define_key(top_kmap, make_key("p", null, MOD_ALT), null, "browser-previous");
    define_key(top_kmap, make_key("n", null, MOD_ALT), null, "browser-next");
    define_key(top_kmap, make_key("c", null, 0), null, "copy-current-url");
    define_key(top_kmap, make_key("x", null, MOD_ALT), null, "execute-extended-command");
    define_key(top_kmap, make_key("g", null, MOD_CTRL), null, "keyboard-quit");
    define_key(top_kmap, make_key("a", null, MOD_CTRL), null, "beginning-of-line");
    define_key(top_kmap, make_key("e", null, MOD_CTRL), null, "end-of-line");
    define_key(top_kmap, make_key(null, KeyEvent.DOM_VK_ESCAPE, 0), null, "focus-window");

    // Input area keys
    define_key(input_kmap, make_key("a", null, MOD_CTRL), null, "cmd_beginLine");
    define_key(input_kmap, make_key("e", null, MOD_CTRL), null, "cmd_endLine");
    define_key(input_kmap, make_key(null, KeyEvent.DOM_VK_BACK_SPACE, 0), 
	       null, "cmd_deleteCharBackward");
    define_key(input_kmap, make_key(null, KeyEvent.DOM_VK_BACK_SPACE, MOD_ALT), 
	       null, "cmd_deleteWordBackward");
    define_key(input_kmap, make_key("d", null, MOD_CTRL), null, "cmd_deleteCharForward");
    define_key(input_kmap, make_key("d", null, MOD_ALT), null, "cmd_deleteWordForward");
    define_key(input_kmap, make_key("b", null, MOD_CTRL), null, "cmd_charPrevious");
    define_key(input_kmap, make_key("b", null, MOD_ALT), null, "cmd_WordPrevious");
    define_key(input_kmap, make_key("f", null, MOD_CTRL), null, "cmd_charNext");
    define_key(input_kmap, make_key("f", null, MOD_ALT), null, "cmd_WordNext");
    define_key(input_kmap, make_key("y", null, MOD_CTRL), null, "cmd_paste");
    define_key(input_kmap, make_key("w", null, MOD_ALT), null, "cmd_copy");
    define_key(input_kmap, make_key("u", null, MOD_CTRL), null, "cmd_deleteToBeginningOfLine");
    define_key(input_kmap, make_key("k", null, MOD_CTRL), null, "cmd_deleteToEndOfLine");

    // 101 keys
    define_key(input_kmap, make_key(null, KeyEvent.DOM_VK_HOME,MOD_SHIFT), 
	       null, "cmd_selectBeginLine");
    define_key(input_kmap, make_key(null, KeyEvent.DOM_VK_END,MOD_SHIFT), null, "cmd_selectEndLine");
    define_key(input_kmap, make_key(null, KeyEvent.DOM_VK_BACK,MOD_CTRL), 
	       null, "cmd_deleteWordBackward");
    define_key(input_kmap, make_key(null, KeyEvent.DOM_VK_LEFT,MOD_CTRL|MOD_SHIFT), 
	       null, "cmd_selectWordPrevious");
    define_key(input_kmap, make_key(null, KeyEvent.DOM_VK_RIGHT,MOD_CTRL|MOD_SHIFT),
	       null, "cmd_selectWordNext");

    // Nasty keys
    define_key(input_kmap, make_key("r", null, MOD_CTRL), null, "cmd_redo");
    define_key(input_kmap, make_key("a", null, MOD_ALT), null, "cmd_selectAll");

    // textarea keys
    define_key(textarea_kmap, make_key("a", null, MOD_CTRL), null, "cmd_beginLine");
    define_key(textarea_kmap, make_key("e", null, MOD_CTRL), null, "cmd_endLine");
    define_key(textarea_kmap, make_key(null, KeyEvent.DOM_VK_BACK_SPACE, 0), 
	       null, "cmd_deleteCharBackward");
    define_key(textarea_kmap, make_key(null, KeyEvent.DOM_VK_BACK_SPACE, MOD_ALT), 
	       null, "cmd_deleteWordBackward");
    define_key(textarea_kmap, make_key("d", null, MOD_CTRL), null, "cmd_deleteCharForward");
    define_key(textarea_kmap, make_key("d", null, MOD_ALT), null, "cmd_deleteWordForward");
    define_key(textarea_kmap, make_key("b", null, MOD_CTRL), null, "cmd_charPrevious");
    define_key(textarea_kmap, make_key("b", null, MOD_ALT), null, "cmd_WordPrevious");
    define_key(textarea_kmap, make_key("f", null, MOD_CTRL), null, "cmd_charNext");
    define_key(textarea_kmap, make_key("f", null, MOD_ALT), null, "cmd_WordNext");
    define_key(textarea_kmap, make_key("y", null, MOD_CTRL), null, "cmd_paste");
    define_key(textarea_kmap, make_key("w", null, MOD_ALT), null, "cmd_copy");
    define_key(textarea_kmap, make_key("u", null, MOD_CTRL), null, "cmd_deleteToBeginningOfLine");
    define_key(textarea_kmap, make_key("k", null, MOD_CTRL), null, "cmd_deleteToEndOfLine");
    define_key (textarea_kmap, make_key("n",null,MOD_CTRL), null, "cmd_lineNext");
    define_key (textarea_kmap, make_key("p",null,MOD_CTRL), null, "cmd_linePrevious");
    define_key (textarea_kmap, make_key("<",null,MOD_ALT), null, "cmd_moveTop");
    define_key (textarea_kmap, make_key(">",null,MOD_ALT), null, "cmd_moveBottom");
    define_key (textarea_kmap, make_key("v",null,MOD_ALT), null, "cmd_movePageUp");
    define_key (textarea_kmap, make_key("v",null,MOD_CTRL), null, "cmd_movePageDown");


    // 101 keys
    define_key(textarea_kmap, make_key(null, KeyEvent.DOM_VK_HOME,MOD_SHIFT), 
	       null, "cmd_selectBeginLine");
    define_key(textarea_kmap, make_key(null, KeyEvent.DOM_VK_END,MOD_SHIFT), 
	       null, "cmd_selectEndLine");
    define_key(textarea_kmap, make_key(null, KeyEvent.DOM_VK_BACK,MOD_CTRL), 
	       null, "cmd_deleteWordBackward");
    define_key(textarea_kmap, make_key(null, KeyEvent.DOM_VK_LEFT,MOD_CTRL|MOD_SHIFT), 
	       null, "cmd_selectWordPrevious");
    define_key(textarea_kmap, make_key(null, KeyEvent.DOM_VK_RIGHT,MOD_CTRL|MOD_SHIFT),
	       null, "cmd_selectWordNext");
    define_key (textarea_kmap, make_key(null, KeyEvent.DOM_VK_PAGE_UP,MOD_SHIFT),
		null, "cmd_selectPageUp");
    define_key (textarea_kmap, make_key(null, KeyEvent.DOM_VK_PAGE_DOWN,MOD_SHIFT),
		null, "cmd_selectPageDown");

    // Nasty keys
    define_key(textarea_kmap, make_key("r", null, MOD_CTRL), null, "cmd_redo");
    define_key(textarea_kmap, make_key("a", null, MOD_ALT), null, "cmd_selectAll");


    gCurrentKmap = top_kmap;
}

function Startup()
{
//   gBrowser = document.getElementById("content");
  var uriToLoad = "chrome://conkeror/content/help.html";
//   var uriToLoad = "file:///home/sabetts/src/conkeror/testframes.html";

//   var b = document.getElementById("blahblu");
//   b.setCurrentBrowser(0);

  initKmaps();
  initBookmarkService();

  if ("arguments" in window && window.arguments.length >= 1 && window.arguments[0])
    uriToLoad = window.arguments[0];

  // Setup our status handler
  window.XULBrowserWindow = new nsBrowserStatusHandler();
  getBrowser().setProgressListener(window.XULBrowserWindow, 
				   Components.interfaces.nsIWebProgress.NOTIFY_ALL);

  try {
      getWebNavigation().loadURI(uriToLoad, nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null);
  } catch(e) { window.alert(e) }


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



//   initServices();
//   initBMService();
//   gBrowser.addEventListener("load", function(evt) { setTimeout(loadEventHandlers, 0, evt); }, true);

//   try {
//       getBrowser().addEventListener("PluginNotFound", missingPlugin, false);
//   } catch (e) { alert(e); }

  // Turn off typeahead. We'll use our own that's way better.
  gPrefService = Components.classes["@mozilla.org/preferences-service;1"]
                           .getService(Components.interfaces.nsIPrefBranch);
  gPrefService.setBoolPref("accessibility.typeaheadfind", false);

//   gFind = Components.classes["@mozilla.org/typeaheadfind;1"].createInstance(Components.interfaces.nsITypeAheadFind);                                
//   gFind.init(gBrowser.docShell);
//   gFind.setAutoStart(window,false);

  // Give the browser focus.
  _content.focus();
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
  },

  endDocumentLoad : function(aRequest, aStatus)
  {
      // XXX: with frames this doesn't work
//       _content.content.document.__conkeror__NumbersOn = false;
      setNumberedLinksState(true);
  }

}

/// plugins
function missingPlugin(evt)
{
    window.alert("tough luck. yer missing a plugin");
    evt.preventDefault();
}

