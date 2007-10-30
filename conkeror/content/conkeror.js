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

var conkeror = Components.classes["@conkeror.mozdev.org/application;1"]
    .getService ()
    .wrappedJSObject;


// nsIWebProgressListener implementation to monitor activity in the browser.
var conkeror_progress_listener = {
    _requestsStarted: 0,
    _requestsFinished: 0,

    // We need to advertize that we support weak references.  This is done simply
    // by saying that we QI to nsISupportsWeakReference.  XPConnect will take
    // care of actually implementing that interface on our behalf.
    QueryInterface: function(iid) {
        if (iid.equals(Components.interfaces.nsIWebProgressListener) ||
            iid.equals(Components.interfaces.nsISupportsWeakReference) ||
            iid.equals(Components.interfaces.nsISupports))
            return this;

        throw Components.results.NS_ERROR_NO_INTERFACE;
    },

    // This method is called to indicate state changes.
    onStateChange: function(webProgress, request, stateFlags, status) {
        const WPL = Components.interfaces.nsIWebProgressListener;

        if (stateFlags & WPL.STATE_IS_REQUEST) {
            if (stateFlags & WPL.STATE_START) {
                this._requestsStarted++;
            } else if (stateFlags & WPL.STATE_STOP) {
                this._requestsFinished++;
            }
        }

        if (stateFlags & WPL.STATE_IS_NETWORK) {
            if (stateFlags & WPL.STATE_STOP) {
                this.onStatusChange(webProgress, request, 0, "Done");
                this._requestsStarted = this._requestsFinished = 0;
            }
        }
    },

    // This method is called to indicate progress changes for the currently
    // loading page.
    onProgressChange: function(webProgress, request, curSelf, maxSelf,
                               curTotal, maxTotal) {
    // FIXME: This should probably be called with the relevant buffer as a parameter
      conkeror.run_hooks (conkeror.progress_changed_hook, window, [webProgress, request, curSelf,
                          maxSelf, curTotal, maxTotal]);
    },

    // This method is called to indicate a change to the current location.
    // The url can be gotten as location.spec.
    onLocationChange : function(webProgress, request, location) {
    // FIXME: This should probably be called with the relevant buffer as a parameter
      conkeror.run_hooks (conkeror.location_changed_hook, window, [webProgress, request, location]);
    },

    // This method is called to indicate a status changes for the currently
    // loading page.  The message is already formatted for display.
    // Status messages could be displayed in the minibuffer output area.
    onStatusChange: function(webProgress, request, status, message) {
    // FIXME: This should probably be called with the relevant buffer as a parameter
      conkeror.run_hooks (conkeror.status_changed_hook, window, [webProgress, request, status, message]);
    },

    // This method is called when the security state of the browser changes.
    onSecurityChange: function(webProgress, request, state) {
        const WPL = Components.interfaces.nsIWebProgressListener;

        if (state & WPL.STATE_IS_INSECURE) {
            // update visual indicator
        } else {
            var level = "unknown";
            if (state & WPL.STATE_IS_SECURE) {
                if (state & WPL.STATE_SECURE_HIGH)
                    level = "high";
                else if (state & WPL.STATE_SECURE_MED)
                    level = "medium";
                else if (state & WPL.STATE_SECURE_LOW)
                    level = "low";
            } else if (state & WPL_STATE_IS_BROKEN) {
                level = "mixed";
            }
            // provide a visual indicator of the security state here.
        }
    }
};


// The interface nsIXULBrowserWindow handles updating chrome
// components for link-rollovers.
var conkeror_xul_browser_window = {
    QueryInterface: function (iid) {
        if (iid.equals (Components.interfaces.nsIXULBrowserWindow) ||
            iid.equals (Components.interfaces.nsISupports))
            return this;
        throw Components.results.NS_ERROR_NO_INTERFACE;
    },

    setJSDefaultStatus: function (status) { },

    setJSStatus: function (status) { },

    setOverLink: function (link) {
        // check the current value so we don't trigger an attribute change
        // and cause needless (slow!) UI updates
        var status_field = document.getElementById ("minibuffer-output");
        if (status_field.value != link) {
            status_field.value = link;
        }
    }
};


function init_frame ()
{
    // Handle window.arguments
    //
    var urisToLoad = [];
    var tag = null;
    if ('arguments' in window)
    {
        for (var i = 0; i < window.arguments.length; i++) {
            var open_args = conkeror.decode_xpcom_structure (window.arguments[i]);
            if (0 in open_args && open_args[0] == 'conkeror')
            {
                for (var j = 1; j < open_args.length; j++) {
                    var op = open_args[j];
                    if (op[0] == 'tag') { tag = op[1]; }
                    else if (op[0] == 'find') { urisToLoad = op.slice (1); }
                }
            }
        }
    }
    window.tag = conkeror.generate_new_frame_tag (tag);

    // Hook up our web progress listener
    /* FIXME: This really should be added per-buffer, rather than in this strange way */
    getBrowser().setProgressListener (
        conkeror_progress_listener,
        Components.interfaces.nsIWebProgress.NOTIFY_ALL);

    // Hook up our XULBrowserWindow status handler
    window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
        .getInterface(Components.interfaces.nsIWebNavigation)
        .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
        .treeOwner
        .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
        .getInterface(Components.interfaces.nsIXULWindow)
        .XULBrowserWindow = conkeror_xul_browser_window;

    // TO-DO: is this necessary?  if we need default dimensions, why
    // not just set attributes on the WINDOW element in conkeror.xul?
    //
    // give the browser window a default width/height
    if (!document.documentElement.hasAttribute("width")) {
        document.documentElement.setAttribute("width", 640);
        document.documentElement.setAttribute("height", 480);
    }

    window.addEventListener ("keypress", readKeyPress, true);

    // DOMContentLoaded will fire for each document, including those
    // in frameset frames and iframes.  We pass `event.target' -- the
    // document object in question -- to our event handlers.
    //
    getBrowser().addEventListener (
        "DOMContentLoaded",
        function (event) {
            conkeror.run_hooks (conkeror.dom_content_loaded_hook, window, [event.target]);
        },
        true);


    /* FIXME: This should really be added as a handler to an
       individual xul:browser, rather than catching the event only
       once it propagates up. */
    getBrowser().addEventListener (
        "DOMTitleChanged",
        function (event) {
            conkeror.run_hooks (conkeror.dom_title_changed_hook, window, [event.target]);
        },
        true);    

    window.document.addEventListener ("resize",
                                      function () {
                                          conkeror.run_hooks (conkeror.frame_resize_hook, window);
                                      },
                                      true);

    if (0 in urisToLoad) {
        getWebNavigation().loadURI (urisToLoad[0], Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null);
    }
    /* BUG: right now, we really have no way to load urls in a specific
     * frame.  Just the active frame.

     for (var i = 1; i < urisToLoad.length; i++) {
     conkeror.open_url_in.call (this, 4, urisToLoad[i]);
     }
    */

    conkeror.run_hooks (conkeror.make_frame_after_hook, this);

    setTimeout(delayed_init_frame,0);
}


function delayed_init_frame ()
{
    init_minibuffer ();

    // Add a timer to update the modeline once a minute
    /* FIXME: User should be able to customize modeline format; once
       that is allowed, the specific modeline format should take care
       of adding timers it needs */
    setInterval (updateModeline, 60000);

    // This is a redo of the fix for jag bug 91884
    if (window == conkeror.window_watcher.activeWindow) {
      content.focus();
    } else {
	// set the element in command dispatcher so focus will restore properly
	// when the window does become active
	if (content instanceof Components.interfaces.nsIDOMWindow) {
	    document.commandDispatcher.focusedWindow = content;
	    document.commandDispatcher.focusedElement = null;
	} else if (content instanceof Components.interfaces.nsIDOMElement) {
	    document.commandDispatcher.focusedWindow = content.ownerDocument.defaultView;
	    document.commandDispatcher.focusedElement = content;
	}
    }
}

