// -*- java -*-

const nsIWebNavigation = Components.interfaces.nsIWebNavigation;

//     <key id="linkloc"    key="u" modifiers="" oncommand="copyLinkLocation();"/>
//     <key id="yank"    key=" " modifiers="alt" command="cmd_yankToClipboard"/>

//     <key id="focusUrlBar"    key="a" modifiers="accel" command="cmd_scrollLeftComplete"/>
//     <key id="focusFindBar"    key="e" modifiers="accel" command="cmd_scrollRightComplete"/>

//     <key id="focusUrlBar"    key="l" modifiers="accel" command="cmd_open_url"/>
//     <key id="focusUrlBar"    key="g" command="cmd_open_url"/>

//     <key id="viewsrc" key="i" oncommand="view_source();"/>
//     <key id="neww" key="n" modifiers="shift" command="cmd_newWindow"/>

//     <key id="focusFindBar"    key="s" modifiers="accel" command="cmd_focusFindBar"/>
//     <key id="focusFindBar"    key="r" modifiers="accel" command="cmd_focusFindBarBW"/>
//     <key id="browserback"    key="b" modifiers="shift" command="cmd_back"/>
//     <key id="browserforward" key="f" modifiers="shift" command="cmd_forward"/>
//     <key id="reload" key="R" modifiers="" command="cmd_reload"/> 
//     <key id="nextframse"   key="f" command="cmd_nextFrame"/>
//     <key id="stop"   key="g" modifiers="control" command="cmd_stop"/>
//     <key id="key_togglelinks" key="l" oncommand="toggleNumberedLinks();" modifiers="alt"/>
//     <key id="key_gotolink1"   key="1" oncommand="selectNumberedLink(1);" modifiers=""/>
//     <key id="key_gotolink2"   key="2" oncommand="selectNumberedLink(2);" modifiers=""/>
//     <key id="key_gotolink3"   key="3" oncommand="selectNumberedLink(3);" modifiers=""/>
//     <key id="key_gotolink4"   key="4" oncommand="selectNumberedLink(4);" modifiers=""/>
//     <key id="key_gotolink5"   key="5" oncommand="selectNumberedLink(5);" modifiers=""/>
//     <key id="key_gotolink6"   key="6" oncommand="selectNumberedLink(6);" modifiers=""/>
//     <key id="key_gotolink7"   key="7" oncommand="selectNumberedLink(7);" modifiers=""/>
//     <key id="key_gotolink8"   key="8" oncommand="selectNumberedLink(8);" modifiers=""/>
//     <key id="key_gotolink9"   key="9" oncommand="selectNumberedLink(9);" modifiers=""/>

//     <key id="blah"   key="P" oncommand="getBrowser().prevBrowser();" modifiers="alt"/>
//     <key id="blah"   key="N" oncommand="getBrowser().nextBrowser();" modifiers="alt"/>

//     <key id="blah"   key="c" oncommand="copyCurrentUrl();" modifiers=""/>

//     <key id="ctrlx"   key="x" oncommand="topLevelReadKey('C-x',ctrlx_kmap);" modifiers="control"/>
//     <key id="ctrlc"   key="c" oncommand="topLevelReadKey('C-c',ctrlc_kmap);" modifiers="control"/>

// some predefined key maps
var ctrlc_kmap = [];
var ctrlx_kmap = [];
var bookmark_kmap = [];
var five_kmap = [];
var top_kmap = [];
function initKmaps()
{
    define_key(ctrlx_kmap, make_key(98, null, 0), null, "switch-to-browser"); // C-x b
    define_key(ctrlx_kmap, make_key(107, null, 0), null, "kill-browser"); // C-x k
    define_key(ctrlx_kmap, make_key(102, null, MOD_CTRL), null, "find-url"); // C-x C-f    
    define_key(ctrlx_kmap, make_key(99, null, MOD_CTRL), null, "quit"); // C-x C-c    

    // C-x 5 ??
    define_key(five_kmap, make_key(102, null, MOD_CTRL), null, "new-frame"); // C-x 5 C-f
    define_key(five_kmap, make_key(48, null, 0), null, "delete-frame");// C-x 5 0

    // C-x r ??
    define_key(bookmark_kmap, make_key(109, null,0), null, "bookmark-current-url"); // C-x r m
    define_key(bookmark_kmap, make_key(98, null, 0), null, "goto-bookmark"); // C-x r b
    define_key(bookmark_kmap, make_key(108, null,0), null, "bookmark-bmenu-list"); // C-x r l

    define_key(ctrlx_kmap, make_key(53, null, 0), five_kmap, null); // C-x 5 kmap
    define_key(ctrlx_kmap, make_key(114, null, 0), bookmark_kmap, null); // C-x r kmap

    define_key(top_kmap, make_key(120, null,MOD_CTRL), ctrlx_kmap, null);// C-x
    define_key(top_kmap, make_key(99, null,MOD_CTRL), ctrlc_kmap, null); // C-c

    define_key(top_kmap, make_key(117, null, 0), null, "copy-link-location");
    define_key(top_kmap, make_key(32, null, MOD_ALT), null, "yank");
    define_key(top_kmap, make_key(108, null, MOD_CTRL), null, "find-url");
    define_key(top_kmap, make_key(108, null, MOD_ALT), null, "numberedlinks-toggle");
    define_key(top_kmap, make_key(103, null,0), null, "find-url"); // g
    define_key(top_kmap, make_key(105, null, 0), null, "view-source");
    define_key(top_kmap, make_key(115, null, MOD_CTRL), null, "isearch-forward");
    define_key(top_kmap, make_key(114, null, MOD_CTRL), null, "isearch-backward");
    define_key(top_kmap, make_key(98, null, MOD_SHIFT), null, "go-back");
    define_key(top_kmap, make_key(102, null, MOD_SHIFT), null, "go-forward");
    define_key(top_kmap, make_key(114, null, MOD_SHIFT), null, "revert-browser");
    define_key(top_kmap, make_key(102, null, 0), null, "next-frame");
    define_key(top_kmap, make_key(103, null, MOD_CTRL), null, "stop-loading");
    define_key(top_kmap, make_key(49, null, 0), null, "numberedlinks-1");
    define_key(top_kmap, make_key(50, null, 0), null, "numberedlinks-2");
    define_key(top_kmap, make_key(51, null, 0), null, "numberedlinks-3");
    define_key(top_kmap, make_key(52, null, 0), null, "numberedlinks-4");
    define_key(top_kmap, make_key(53, null, 0), null, "numberedlinks-5");
    define_key(top_kmap, make_key(54, null, 0), null, "numberedlinks-6");
    define_key(top_kmap, make_key(55, null, 0), null, "numberedlinks-7");
    define_key(top_kmap, make_key(56, null, 0), null, "numberedlinks-8");
    define_key(top_kmap, make_key(57, null, 0), null, "numberedlinks-9");
    define_key(top_kmap, make_key(112, null, MOD_SHIFT), null, "browser-previous");
    define_key(top_kmap, make_key(110, null, MOD_SHIFT), null, "browser-next");
    define_key(top_kmap, make_key(99, null, 0), null, "copy-current-url");
    define_key(top_kmap, make_key(120, null, MOD_ALT), null, "execute-extended-command");

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
              switch (aStatus) {
	      case kErrorBindingAborted:
                  msg = "Quit";
                  break;
	      case kErrorNetTimeout:
                  msg = "Timed Out.";
                  break;
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
      toggleNumberedLinks();
  }

}

/// plugins
function missingPlugin(evt)
{
    window.alert("tough luck. yer missing a plugin");
    evt.preventDefault();
}

