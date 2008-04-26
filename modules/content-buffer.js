/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2008 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("load-spec.js");

require_later("content-buffer-input.js");

define_buffer_local_hook("content_buffer_finished_loading_hook");
define_buffer_local_hook("content_buffer_started_loading_hook");
define_buffer_local_hook("content_buffer_progress_change_hook");
define_buffer_local_hook("content_buffer_location_change_hook");
define_buffer_local_hook("content_buffer_status_change_hook");
define_buffer_local_hook("content_buffer_focus_change_hook");
define_buffer_local_hook("content_buffer_overlink_change_hook");
define_buffer_local_hook("content_buffer_dom_link_added_hook");

define_current_buffer_hook("current_content_buffer_finished_loading_hook", "content_buffer_finished_loading_hook");
define_current_buffer_hook("current_content_buffer_progress_change_hook", "content_buffer_progress_change_hook");
define_current_buffer_hook("current_content_buffer_location_change_hook", "content_buffer_location_change_hook");
define_current_buffer_hook("current_content_buffer_status_change_hook", "content_buffer_status_change_hook");
define_current_buffer_hook("current_content_buffer_focus_change_hook", "content_buffer_focus_change_hook");
define_current_buffer_hook("current_content_buffer_overlink_change_hook", "content_buffer_overlink_change_hook");

/* If browser is null, create a new browser */
define_keywords("$load");
function content_buffer(window, element)
{
    keywords(arguments);
    this.constructor_begin();

    conkeror.buffer.call(this, window, element, forward_keywords(arguments));

    this.browser.addProgressListener(this);
    var buffer = this;
    this.browser.addEventListener("DOMTitleChanged", function (event) {
            buffer_title_change_hook.run(buffer);
        }, true /* capture */, false /* ignore untrusted events */);

    this.browser.addEventListener("scroll", function (event) {
            buffer_scroll_hook.run(buffer);
        }, true /* capture */, false /* ignore untrusted events */);

    this.browser.addEventListener("focus", function (event) {
            content_buffer_focus_change_hook.run(buffer, event);
        }, true /* capture */, false /* ignore untrusted events */);

    this.browser.addEventListener("mouseover", function (event) {
            if (event.target instanceof Ci.nsIDOMHTMLAnchorElement) {
                content_buffer_overlink_change_hook.run(buffer, event.target.href);
                buffer.current_overlink = event.target;
            }
        }, true, false);

    this.browser.addEventListener("mouseout", function (event) {
            if (buffer.current_overlink == event.target) {
                buffer.current_overlink = null;
                content_buffer_overlink_change_hook.run(buffer, "");
            }
        }, true, false);

    this.browser.addEventListener("mousedown", function (event) {
            buffer.last_user_input_received = Date.now();
        }, true, false);

    this.browser.addEventListener("keypress", function (event) {
            buffer.last_user_input_received = Date.now();
        }, true, false);

    this.browser.addEventListener("DOMLinkAdded", function (event) {
            content_buffer_dom_link_added_hook.run(buffer, event);
        }, true, false);

    buffer.last_user_input_received = null;

    /* FIXME: Add a handler for blocked popups, and also PopupWindow event */
    /*
    this.browser.addEventListener("DOMPopupBlocked", function (event) {
            dumpln("PopupWindow: " + event);
        }, true, false);
    */

    normal_input_mode(this);

    this.ignore_initial_blank = true;

    var lspec = arguments.$load;
    if (lspec) {
        if (lspec.url == "about:blank")
            this.ignore_initial_blank = false;
        else {
            /* Ensure that an existing load of about:blank is stopped */
            this.web_navigation.stop(Ci.nsIWebNavigation.STOP_ALL);

            this.load(lspec);
        }
    }

    this.constructor_end();
}
content_buffer.prototype = {
    constructor : content_buffer,

    get scrollX () { return this.top_frame.scrollX; },
    get scrollY () { return this.top_frame.scrollY; },
    get scrollMaxX () { return this.top_frame.scrollMaxX; },
    get scrollMaxY () { return this.top_frame.scrollMaxY; },


    /* Used to display the correct URI when the buffer opens initially
     * even before loading has progressed far enough for currentURI to
     * contain the correct URI. */
    _display_URI : null,

    get display_URI_string () {
        if (this._display_URI)
            return this._display_URI;
        if (this.current_URI)
            return this.current_URI.spec;
        return "";
    },

    get title() { return this.browser.contentTitle; },
    get description () { return this.display_URI_string; },

    load : function (load_spec) {
        apply_load_spec(this, load_spec);
    },

    _request_count: 0,

    loading : false,

    /* nsIWebProgressListener */
    QueryInterface: generate_QI(Ci.nsIWebProgressListener, Ci.nsISupportsWeakReference),

    // This method is called to indicate state changes.
    onStateChange: function(aWebProgress, aRequest, aStateFlags, aStatus) {
/*
        const WPL = Components.interfaces.nsIWebProgressListener;

        var flagstr = "";
        if (aStateFlags & WPL.STATE_START)
            flagstr += ",start";
        if (aStateFlags & WPL.STATE_STOP)
            flagstr += ",stop";
        if (aStateFlags & WPL.STATE_IS_REQUEST)
            flagstr += ",request";
        if (aStateFlags & WPL.STATE_IS_DOCUMENT)
            flagstr += ",document";
        if (aStateFlags & WPL.STATE_IS_NETWORK)
            flagstr += ",network";
        if (aStateFlags & WPL.STATE_IS_WINDOW)
            flagstr += ",window";
        dumpln("onStateChange: " + flagstr + ", status: " + aStatus);
*/
        if (!aRequest)
            return;


        if (aStateFlags & Ci.nsIWebProgressListener.STATE_START) {
            this._request_count++;
        }
        else if (aStateFlags & Ci.nsIWebProgressListener.STATE_STOP) {
            const NS_ERROR_UNKNOWN_HOST = 2152398878;
            if (--this._request_count > 0 && aStatus == NS_ERROR_UNKNOWN_HOST) {
                // to prevent bug 235825: wait for the request handled
                // by the automatic keyword resolver
                return;
            }
            // since we (try to) only handle STATE_STOP of the last request,
            // the count of open requests should now be 0
            this._request_count = 0;
        }

        if (aStateFlags & Ci.nsIWebProgressListener.STATE_START &&
            aStateFlags & Ci.nsIWebProgressListener.STATE_IS_NETWORK) {
            // It's okay to clear what the user typed when we start
            // loading a document. If the user types, this counter gets
            // set to zero, if the document load ends without an
            // onLocationChange, this counter gets decremented
            // (so we keep it while switching tabs after failed loads)
            //dumpln("*** started loading");
            this.loading = true;
            content_buffer_started_loading_hook.run(this);
            this.last_user_input_received = null;
        }
        else if (aStateFlags & Ci.nsIWebProgressListener.STATE_STOP &&
                 aStateFlags & Ci.nsIWebProgressListener.STATE_IS_NETWORK) {
            if (this.loading == true)  {
                //dumpln("*** finished loading");
                content_buffer_finished_loading_hook.run(this);
                this.loading = false;
            }
        }

        if (aStateFlags & (Ci.nsIWebProgressListener.STATE_STOP |
                           Ci.nsIWebProgressListener.STATE_START)) {
            if (!this.loading)
                this.set_default_message("Done");
        }
    },

    /* This method is called to indicate progress changes for the currently
       loading page. */
    onProgressChange: function(webProgress, request, curSelf, maxSelf,
                               curTotal, maxTotal) {
        content_buffer_progress_change_hook.run(this, request, curSelf, maxSelf, curTotal, maxTotal);
    },

    /* This method is called to indicate a change to the current location.
       The url can be gotten as location.spec. */
    onLocationChange : function(webProgress, request, location) {
        /* Attempt to ignore onLocationChange calls due to the initial
         * loading of about:blank by all xul:browser elements. */
        if (location.spec == "about:blank" && this.ignore_initial_blank)
            return;

        this.ignore_initial_blank = false;

        //dumpln("spec: " + location.spec  +" ;;; " + this.display_URI_string);
        /* Use the real location URI now */
        this._display_URI = null;
        content_buffer_location_change_hook.run(this, request, location);
        this.last_user_input_received = null;
        buffer_description_change_hook.run(this);
    },

    // This method is called to indicate a status changes for the currently
    // loading page.  The message is already formatted for display.
    // Status messages could be displayed in the minibuffer output area.
    onStatusChange: function(webProgress, request, status, msg) {
        this.set_default_message(msg);
        content_buffer_status_change_hook.run(this, request, status, msg);
    },

    // This method is called when the security state of the browser changes.
    onSecurityChange: function(webProgress, request, state) {
        /* FIXME: currently this isn't used */

        /*
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
        */
    },

    /* Inherit from buffer */

    __proto__ : buffer.prototype
};

/*
add_hook("current_content_buffer_finished_loading_hook",
         function (buffer) {
                 buffer.window.minibuffer.show("Done");
         });

add_hook("current_content_buffer_status_change_hook",
         function (buffer, request, status, msg) {
             buffer.set_default_message(msg);
         });
*/

define_variable("url_completion_use_webjumps", true, "Specifies whether URL completion should complete webjumps.");
define_variable("url_completion_use_bookmarks", true, "Specifies whether URL completion should complete bookmarks.");
define_variable("url_completion_use_history", false,
                     "Specifies whether URL completion should complete using browser history.");

minibuffer_auto_complete_preferences["url"] = true;
minibuffer.prototype.read_url = function () {
    keywords(arguments, $prompt = "URL:", $history = "url", $initial_value = "",
             $use_webjumps = url_completion_use_webjumps,
             $use_history = url_completion_use_history,
             $use_bookmarks = url_completion_use_bookmarks);
    var completer = url_completer ($use_webjumps = arguments.$use_webjumps,
        $use_bookmarks = arguments.$use_bookmarks,
        $use_history = arguments.$use_history);
    var result = yield this.read(
        $prompt = arguments.$prompt,
        $history = arguments.$history,
        $completer = completer,
        $initial_value = arguments.$initial_value,
        $auto_complete = "url",
        $select,
        $match_required = false);
    if (result == "") // well-formedness check. (could be better!)
        throw ("invalid url or webjump (\""+ result +"\")");
    yield co_return(get_url_or_webjump(result));
};
/*
I.content_charset = interactive_method(
    $sync = function (ctx) {
        var buffer = ctx.buffer;
        if (!(buffer instanceof content_buffer))
            throw new Error("Current buffer is of invalid type");
        // -- Charset of content area of focusedWindow
        var focusedWindow = buffer.focused_frame;
        if (focusedWindow)
            return focusedWindow.document.characterSet;
        else
            return null;
    });
*/
/*
I.content_selection = interactive_method(
    $sync = function (ctx) {
        // -- Selection of content area of focusedWindow
        var focusedWindow = this.buffers.current.focused_frame;
        return focusedWindow.getSelection ();
    });
*/
function overlink_update_status(buffer, text) {
    if (text.length > 0)
        buffer.window.minibuffer.show("Link: " + text);
    else
        buffer.window.minibuffer.show("");
}

define_global_mode("overlink_mode",
                   function () {
                       add_hook("current_content_buffer_overlink_change_hook", overlink_update_status);
                   },
                   function () {
                       remove_hook("current_content_buffer_overlink_change_hook", overlink_update_status);
                   });

overlink_mode(true);

function open_in_browser(buffer, target, lspec)
{
    switch (target) {
    case OPEN_CURRENT_BUFFER:
    case FOLLOW_DEFAULT:
    case FOLLOW_CURRENT_FRAME:
    case FOLLOW_TOP_FRAME:
        if (buffer instanceof content_buffer)  {
            apply_load_spec(buffer, lspec);
            break;
        }
        target = OPEN_NEW_BUFFER;
        // If the current buffer is not a content_buffer, use a new buffer.
    default:
        create_buffer(buffer.window,
                      buffer_creator(content_buffer,
                                     $load = lspec,
                                     $configuration = buffer.configuration),
                      target);
        break;
    }
}

interactive("find-alternate-url",
            "Edit the current URL in the minibuffer",
            function (I) {
                var target = I.browse_target("find-url");
                check_buffer(I.buffer, content_buffer);
                open_in_browser(I.buffer, target,
                                (yield I.minibuffer.read_url($prompt = browse_target_prompt(target),
                                                             $initial_value = I.buffer.display_URI_string)));
            });

interactive("find-url",
            "Open a URL in the current buffer",
            function (I) {
                var target = I.browse_target("find-url");
                open_in_browser(I.buffer, target,
                                (yield I.minibuffer.read_url($prompt = browse_target_prompt(target))));
            });
default_browse_targets["find-url"] = [OPEN_CURRENT_BUFFER, OPEN_NEW_BUFFER, OPEN_NEW_WINDOW];


interactive("find-url-new-buffer",
            "Open a URL in a new buffer",
            function (I) {
                var target = I.browse_target("find-url-new-buffer");
                open_in_browser(I.buffer, target,
                                (yield I.minibuffer.read_url($prompt = browse_target_prompt(target))));
            });
default_browse_targets["find-url-new-buffer"] = [OPEN_NEW_BUFFER, OPEN_NEW_WINDOW];

interactive("find-url-new-window",
            "Open a URL in a new window",
            function (I) {
                var target = I.browse_target("find-url-new-window");
                open_in_browser(I.buffer, target,
                                (yield I.minibuffer.read_url($prompt = browse_target_prompt(target))));
            });
default_browse_targets["find-url-new-window"] = [OPEN_NEW_WINDOW];

function go_up (b, target)
{
    var url = Cc["@mozilla.org/network/standard-url;1"]
        .createInstance (Ci.nsIURL);
    url.spec = b.current_URI.spec;
    var up;
    if (url.param != "" || url.query != "")
        up = url.filePath;
    else if (url.fileName != "")
        up = ".";
    else
        up = "..";
    open_in_browser(b, target, b.current_URI.resolve (up));
}
interactive("go-up",
            "Go to the parent directory of the current URL",
            function (I) { go_up(check_buffer(I.buffer, content_buffer),  I.browse_target("go-up")); });
default_browse_targets["go-up"] = "find-url";


function go_back (b, prefix)
{
    if (prefix < 0)
        go_forward(b, -prefix);

    check_buffer(b, content_buffer);

    if (b.web_navigation.canGoBack)
    {
        var hist = b.web_navigation.sessionHistory;
        var idx = hist.index - prefix;
        if (idx < 0)
            idx = 0;
        b.web_navigation.gotoIndex(idx);
    } else
        throw interactive_error("Can't go back");
}
interactive(
    "go-back",
    "Go back in the session hisory for the current buffer.",
    function (I) {go_back(I.buffer, I.p);});

function go_forward (b, prefix)
{
    if (prefix < 0)
        go_back(b, -prefix);

    check_buffer(b, content_buffer);

    if (b.web_navigation.canGoForward)
    {
        var hist = b.web_navigation.sessionHistory;
        var idx = hist.index + prefix;
        if (idx >= hist.count) idx = hist.count-1;
        b.web_navigation.gotoIndex(idx);
    } else
        throw interactive_error("Can't go forward");
}
interactive("go-forward",
            "Go back in the session hisory for the current buffer.",
            function (I) {go_forward(I.buffer, I.p);});

function stop_loading (b)
{
    check_buffer(b, content_buffer);
    b.web_navigation.stop(Ci.nsIWebNavigation.STOP_NETWORK);
}
interactive("stop-loading",
            "Stop loading the current document.",
            function (I) {stop_loading(I.buffer);});

function reload (b, bypass_cache)
{
    check_buffer(b, content_buffer);
    var flags = bypass_cache != null ?
        Ci.nsIWebNavigation.LOAD_FLAGS_NONE : Ci.nsIWebNavigation.LOAD_FLAGS_BYPASS_CACHE;
    b.web_navigation.reload(flags);
}
interactive("reload",
            "Reload the current document.\n" +
            "If a prefix argument is specified, the cache is bypassed.",
            function (I) {reload(I.buffer, I.P);});

/**
 * browserDOMWindow: intercept window opening
 */
function initialize_browser_dom_window(window) {
    window.QueryInterface(Ci.nsIDOMChromeWindow).browserDOMWindow =
        new browser_dom_window(window);
}

define_variable("browser_default_open_target", OPEN_NEW_BUFFER, "Specifies how new window requests by content pages (e.g. by window.open from JavaScript or by using the target attribute of anchor and form elements) will be handled.  This will generally be `OPEN_NEW_BUFFER', `OPEN_NEW_BUFFER_BACKGROUND', or `OPEN_NEW_WINDOW'.");

function browser_dom_window(window) {
    this.window = window;
    this.next_target = null;
}
browser_dom_window.prototype = {
    QueryInterface: generate_QI(Ci.nsIBrowserDOMWindow),

    openURI : function(aURI, aOpener, aWhere, aContext) {

        // Reference: http://www.xulplanet.com/references/xpcomref/ifaces/nsIBrowserDOMWindow.html
        var target = this.next_target;
        if (target == null || target == FOLLOW_DEFAULT)
            target = browser_default_open_target;
        this.next_target = null;

        /* Determine the opener buffer */
        var opener_buffer = get_buffer_from_frame(this.window, aOpener.top);
        var config = opener_buffer ? opener_buffer.configuration : null;

        switch (browser_default_open_target) {
        case OPEN_CURRENT_BUFFER:
        case FOLLOW_TOP_FRAME:
            return aOpener.top;
        case FOLLOW_CURRENT_FRAME:
            return aOpener;
        case OPEN_NEW_BUFFER:
            var buffer = new content_buffer(this.window, null /* element */, $configuration = config);
            this.window.buffers.current = buffer;
            return buffer.top_frame;
        case OPEN_NEW_BUFFER_BACKGROUND:
            var buffer = new content_buffer(this.window, null /* element */, $configuration = config);
            return buffer.top_frame;
        case OPEN_NEW_WINDOW:
        default: /* shouldn't be needed */

            /* We don't call make_window here, because that will result
             * in the URL being loaded as the top-level document,
             * instead of within a browser buffer.  Instead, we can
             * rely on Mozilla using browser.chromeURL. */
            window_set_extra_arguments({initial_buffer_configuration: config});
            return null;
        }
    }
};

add_hook("window_initialize_early_hook", initialize_browser_dom_window);

define_keywords("$enable", "$disable", "$doc");
function define_page_mode(name, display_name) {
    keywords(arguments);
    var enable = arguments.$enable;
    var disable = arguments.$disable;
    var doc = arguments.$doc;
    define_buffer_mode(name, display_name,
                       $class = "page_mode",
                       $enable = enable,
                       $disable = function (buffer) {
                           if (disable)
                               disable(buffer);
                           buffer.local_variables = {};
                       },
                       $doc = doc);
}
ignore_function_for_get_caller_source_code_reference("define_page_mode");

define_variable("auto_mode_list", [], "A list of mappings from URI regular expressions to page modes.");
function page_mode_auto_update(buffer) {
    var uri = buffer.current_URI.spec;
    var mode = predicate_alist_match(auto_mode_list, uri);
    if (mode)
        mode(buffer, true);
    else if (buffer.page_mode)
        conkeror[buffer.page_mode](buffer, false);
}

add_hook("content_buffer_location_change_hook", page_mode_auto_update);
