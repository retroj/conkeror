require_later("content-buffer-input.js");

define_buffer_local_hook("content_buffer_finished_loading_hook");
define_buffer_local_hook("content_buffer_progress_change_hook");
define_buffer_local_hook("content_buffer_location_change_hook");
define_buffer_local_hook("content_buffer_status_change_hook");
define_buffer_local_hook("content_buffer_focus_change_hook");
define_buffer_local_hook("content_buffer_overlink_change_hook");

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

    buffer.last_user_input_received = null;

    /* FIXME: Add a handler for blocked popups, and also PopupWindow event */
    /*
    this.browser.addEventListener("DOMPopupBlocked", function (event) {
            dumpln("PopupWindow: " + event);
        }, true, false);
    */

    content_buffer_normal_input_mode(this);

    var load_spec = arguments.$load;
    if (load_spec)
        this.load(load_spec);
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
        return this.current_URI.spec;
    },

    get title() { return this.browser.contentTitle; },
    get description () { return this.display_URI_string; },

    load : function (load_spec) {
        apply_load_spec(this, load_spec);
    },

    _requests_started: 0,
    _requests_finished: 0,

    /* nsIWebProgressListener */
    QueryInterface: generate_QI(Ci.nsIWebProgressListener, Ci.nsISupportsWeakReference),

    // This method is called to indicate state changes.
    onStateChange: function(webProgress, request, stateFlags, status) {
        const WPL = Components.interfaces.nsIWebProgressListener;
        /*
        var flagstr = "";
        if (stateFlags & WPL.STATE_START)
            flagstr += ",start";
        if (stateFlags & WPL.STATE_STOP)
            flagstr += ",stop";
        if (stateFlags & WPL.STATE_IS_REQUEST)
            flagstr += ",request";
        if (stateFlags & WPL.STATE_IS_DOCUMENT)
            flagstr += ",document";
        if (stateFlags & WPL.STATE_IS_NETWORK)
            flagstr += ",network";
        if (stateFlags & WPL.STATE_IS_WINDOW)
            flagstr += ",window";
        dumpln("onStateChange: " + flagstr + ", status: " + status);
        */
        if (stateFlags & WPL.STATE_IS_REQUEST) {
            if (stateFlags & WPL.STATE_START) {
                if (this._requests_started == 0)  {
                    // Reset the time at which the last user input was received for the page
                    this.last_user_input_received = 0;
                }
                this._requests_started++;
            } else if (stateFlags & WPL.STATE_STOP) {
                this._requests_finished++;
            }
        }
        if ((stateFlags & WPL.STATE_STOP) && (this._requests_finished == this._requests_started)) {
            this._requests_finished = this._requests_started = 0;
            content_buffer_finished_loading_hook.run(this);
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
        /* Use the real location URI now */
        this._display_URI = null;
        content_buffer_location_change_hook.run(this, request, location);
    },

    // This method is called to indicate a status changes for the currently
    // loading page.  The message is already formatted for display.
    // Status messages could be displayed in the minibuffer output area.
    onStatusChange: function(webProgress, request, status, msg) {
        content_buffer_status_change_hook.run(this, request, status, msg);
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
    },

    /* Inherit from buffer */

    __proto__ : buffer.prototype
};


add_hook("current_content_buffer_finished_loading_hook",
         function (buffer) {
                 buffer.window.minibuffer.show("Done");
         });

add_hook("current_content_buffer_status_change_hook",
         function (buffer, request, status, msg) {
             buffer.window.minibuffer.show(msg);
         });



//RETROJ: this may be improperly named.  it can read either an url or a
//        webjump from the minibuffer, but it will always return an url.
I.url_or_webjump = interactive_method(
    $async = function (ctx, cont) {
        keywords(arguments, $prompt = "URL:", $history = "url", $initial_value = "");
        var completer = get_navigation_completer (completion_types);
        ctx.window.minibuffer.read(
            $prompt = arguments.$prompt,
            $history = arguments.$history,
            $completer = completer,
            $initial_value = arguments.$initial_value,
            $select,
            $match_required = false,
            $callback = function (s) {
                if (s == "") // well-formedness check. (could be better!)
                    throw ("invalid url or webjump (\""+s+"\")");
                cont(get_url_or_webjump (s));
            });
    });

I.current_frame_url = interactive_method(
    $sync = function (ctx) {
        var buffer = ctx.buffer;
        if (!(buffer instanceof content_buffer))
            throw new Error("Current buffer is of invalid type");
        return buffer.focused_frame.location.href;
    });

// This name should probably change
I.current_url = interactive_method(
    $sync = function (ctx) {
        var buffer = ctx.buffer;
        if (!(buffer instanceof content_buffer))
            throw new Error("Current buffer is of invalid type");
        return buffer.current_URI.spec;
    });

I.focused_link_url = interactive_method(
    $sync = function (ctx) {
        var buffer = ctx.buffer;
        if (!(buffer instanceof content_buffer))
            throw new Error("Current buffer is of invalid type");
        // -- Focused link element
        ///JJF: check for errors or wrong element type.
        return get_link_location (buffer.focused_element);
    });

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


I.content_selection = interactive_method(
    $sync = function (ctx) {
        // -- Selection of content area of focusedWindow
        var focusedWindow = this.buffers.current.focused_frame;
        return focusedWindow.getSelection ();
    });

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


function document_load_spec(doc) {
    var sh_entry = get_SHEntry_for_document(doc);
    var result = {url: doc.location.href};
    result.document = doc;
    if (sh_entry != null) {
        result.cache_key = sh_entry;
        result.referrer = sh_entry.referrerURI;
        result.post_data = sh_entry.postData;
    }
    return result;
}

/* Target can be either a content_buffer or an nsIWebNavigation */
function apply_load_spec(target, load_spec) {
    var url, flags, referrer, post_data;
    if (typeof(load_spec) == "string") {
        url = load_spec;
        flags = null;
        referrer = null;
        post_data = null;
    } else {
        url = load_spec.url;
        flags = load_spec.flags;
        referrer = load_spec.referrer;
        post_data = load_spec.post_data;
    }
    if (flags == null)
        flags = Ci.nsIWebNavigation.LOAD_FLAGS_NONE;
    if (target instanceof content_buffer) {
        target._display_URI = url;
        target = target.web_navigation;
    }
    target.loadURI(url, flags, referrer, post_data, null /* headers */);
}

function open_in_browser(buffer, target, load_spec)
{
    switch (target) {
    case OPEN_CURRENT_BUFFER:
    case FOLLOW_DEFAULT:
    case FOLLOW_CURRENT_FRAME:
    case FOLLOW_TOP_FRAME:
        if (buffer instanceof content_buffer)  {
            apply_load_spec(buffer, load_spec);
            break;
        }
        target = OPEN_NEW_BUFFER;
        // If the current buffer is not a content_buffer, use a new buffer.
    default:
        create_buffer(buffer.window,
                      buffer_creator(content_buffer,
                                     $load = load_spec,
                                     $configuration = buffer.configuration),
                      target);
        break;
    }
}

interactive("open-url",
            "Open a URL, reusing the current buffer by default",
            open_in_browser,
            I.current_buffer, $$ = I.browse_target("open"),
            I.url_or_webjump($prompt = I.bind(browse_target_prompt, $$)));

interactive("find-alternate-url",
            "Edit the current URL in the minibuffer",
            open_in_browser,
            I.current_buffer, $$ = I.browse_target("open"),
            I.url_or_webjump($prompt = I.bind(browse_target_prompt, $$),
                             $initial_value = I.current_url));

interactive("find-url",
            "Open a URL in a new buffer",
            open_in_browser,
            I.current_buffer, $$ = I.browse_target("find-url"),
            I.url_or_webjump($prompt = I.bind(browse_target_prompt, $$)));
default_browse_targets["find-url"] = [OPEN_NEW_BUFFER, OPEN_NEW_WINDOW];


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
            go_up,
            I.current_buffer(content_buffer),
            I.browse_target("go-up"));
default_browse_targets["go-up"] = "open";


function go_back (b, prefix)
{
    if (prefix < 0)
        go_forward(b, -prefix);

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
interactive("go-back",
            "Go back in the session hisory for the current buffer.",
            go_back, I.current_buffer(content_buffer), I.p);


function go_forward (b, prefix)
{
    if (prefix < 0)
        go_back(b, -prefix);

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
            go_forward, I.current_buffer(content_buffer), I.p);

function stop_loading (b)
{
    b.web_navigation.stop(Ci.nsIWebNavigation.STOP_NETWORK);
}
interactive("stop-loading",
            "Stop loading the current document.",
            stop_loading, I.current_buffer(content_buffer));

function reload (b, bypass_cache)
{
    var flags = bypass_cache != null ?
        Ci.nsIWebNavigation.LOAD_FLAGS_NONE : Ci.nsIWebNavigation.LOAD_FLAGS_BYPASS_CACHE;
    b.web_navigation.reload(flags);
}
interactive("reload",
            "Reload the current document.\n" +
            "If a prefix argument is specified, the cache is bypassed.",
            reload, I.current_buffer(content_buffer), I.P);

/**
 * browserDOMWindow: intercept window opening
 */
function initialize_browser_dom_window(window) {
    window.QueryInterface(Ci.nsIDOMChromeWindow).browserDOMWindow =
        new browser_dom_window(window);
}

/* USER PREFERENCE */
/* This will generally be OPEN_NEW_BUFFER, OPEN_NEW_BUFFER_BACKGROUND, or OPEN_NEW_WINDOW */
var browser_default_open_target = OPEN_NEW_BUFFER;

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
