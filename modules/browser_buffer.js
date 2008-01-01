require_later("browser_input.js");

define_buffer_local_hook("browser_buffer_finished_loading_hook");
define_buffer_local_hook("browser_buffer_progress_change_hook");
define_buffer_local_hook("browser_buffer_location_change_hook");
define_buffer_local_hook("browser_buffer_status_change_hook");
define_buffer_local_hook("browser_buffer_focus_change_hook");
define_buffer_local_hook("browser_buffer_overlink_change_hook");

define_current_buffer_hook("current_browser_buffer_finished_loading_hook", "browser_buffer_finished_loading_hook");
define_current_buffer_hook("current_browser_buffer_progress_change_hook", "browser_buffer_progress_change_hook");
define_current_buffer_hook("current_browser_buffer_location_change_hook", "browser_buffer_location_change_hook");
define_current_buffer_hook("current_browser_buffer_status_change_hook", "browser_buffer_status_change_hook");
define_current_buffer_hook("current_browser_buffer_focus_change_hook", "browser_buffer_focus_change_hook");
define_current_buffer_hook("current_browser_buffer_overlink_change_hook", "browser_buffer_overlink_change_hook");

/* If browser is null, create a new browser */
define_keywords("$context", "$element");
function browser_buffer(window)
{
    keywords(arguments);
    var browser = arguments.$element;
    var context_buffer = arguments.$context;
    conkeror.buffer.call(this, context_buffer);

    this.window = window;

    if (browser == null)
    {
        browser = create_XUL(window, "browser");
        browser.setAttribute("type", "content");
        browser.setAttribute("flex", "1");
        this.window.buffers.container.appendChild(browser);
    }
    this.element = browser;
    this.element.conkeror_buffer_object = this;
    this.element.addProgressListener(this);
    var buffer = this;
    this.element.addEventListener("DOMTitleChanged", function (event) {
            buffer_title_change_hook.run(buffer);
        }, true /* capture */, false /* ignore untrusted events */);
    this.element.addEventListener("scroll", function (event) {
            buffer_scroll_hook.run(buffer);
        }, true /* capture */, false /* ignore untrusted events */);

    this.element.addEventListener("focus", function (event) {
            browser_buffer_focus_change_hook.run(buffer, event);
        }, true /* capture */, false /* ignore untrusted events */);

    this.element.addEventListener("mouseover", function (event) {
            if (event.target instanceof Ci.nsIDOMHTMLAnchorElement) {
                browser_buffer_overlink_change_hook.run(buffer, event.target.href);
                buffer.current_overlink = event.target;
            }
        }, true, false);

    this.element.addEventListener("mouseout", function (event) {
            if (buffer.current_overlink == event.target) {
                buffer.current_overlink = null;
                browser_buffer_overlink_change_hook.run(buffer, "");
            }
        }, true, false);

    this.element.addEventListener("mousedown", function (event) {
            buffer.last_user_input_received = Date.now();
        }, true, false);

    this.element.addEventListener("keypress", function (event) {
            buffer.last_user_input_received = Date.now();
        }, true, false);

    buffer.last_user_input_received = null;

    /* FIXME: Add a handler for blocked popups, and also PopupWindow event */
    /*
    this.element.addEventListener("DOMPopupBlocked", function (event) {
            dumpln("PopupWindow: " + event);
        }, true, false);
    */

    browser_buffer_normal_input_mode(this);
}
define_keywords("$referrer", "$post_data", "$load_flags");
browser_buffer.prototype = {
    constructor : browser_buffer.constructor,

    get content_window() {
        return this.element.contentWindow;
    },

    get content_document() {
        return this.element.contentDocument;
    },

    get title() {
        return this.element.contentTitle;
    },

    get scrollX () { return this.content_window.scrollX; },
    get scrollY () { return this.content_window.scrollY; },
    get scrollMaxX () { return this.content_window.scrollMaxX; },
    get scrollMaxY () { return this.content_window.scrollMaxY; },


    /* Used to display the correct URI when the buffer opens initially
     * even before loading has progressed far enough for currentURI to
     * contain the correct URI. */
    _display_URI : null,

    get current_URI () {
        return this.element.currentURI;
    },

    get display_URI_string () {
        if (this._display_URI)
            return this._display_URI;
        return this.current_URI.spec;
    },

    get name () {
        return this.display_URI_string;
    },

    get web_navigation () {
        return this.element.webNavigation;
    },

    get doc_shell () {
        return this.element.docShell;
    },

    get markup_document_viewer () {
        return this.element.markupDocumentViewer;
    },

    load : function (load_spec) {
        apply_load_spec(this, load_spec);
    },

    on_switch_to : function () {
        this.element.setAttribute("type", "content-primary");
    },

    on_switch_away : function () {
        this.element.setAttribute("type", "content");
    },

    _requests_started: 0,
    _requests_finished: 0,

    /* nsIWebProgressListener */
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
            browser_buffer_finished_loading_hook.run(this);
        }
    },

    /* This method is called to indicate progress changes for the currently
       loading page. */
    onProgressChange: function(webProgress, request, curSelf, maxSelf,
                               curTotal, maxTotal) {
        browser_buffer_progress_change_hook.run(this, request, curSelf, maxSelf, curTotal, maxTotal);
    },

    /* This method is called to indicate a change to the current location.
       The url can be gotten as location.spec. */
    onLocationChange : function(webProgress, request, location) {
        /* Use the real location URI now */
        this._display_URI = null;
        browser_buffer_location_change_hook.run(this, request, location);
    },

    // This method is called to indicate a status changes for the currently
    // loading page.  The message is already formatted for display.
    // Status messages could be displayed in the minibuffer output area.
    onStatusChange: function(webProgress, request, status, msg) {
        browser_buffer_status_change_hook.run(this, request, status, msg);
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

    child_element : function (element)
    {
        return (element && this.child_window(element.ownerDocument.defaultView));
    },

    child_window : function (win)
    {
        return (win && win.top == this.content_window);
    },

    focused_window : function ()
    {
        var win = this.window.document.commandDispatcher.focusedWindow;
        if (this.child_window(win))
            return win;
        return this.content_window;
    },

    focused_element : function ()
    {
        var element = this.window.document.commandDispatcher.focusedElement;
        if (this.child_element(element))
            return element;
        return null;
    },

    do_command : function (command)
    {
        function attempt_command(element, command)
        {
            var controller;
            if (element.controllers
                && (controller = element.controllers.getControllerForCommand(command)) != null
                && controller.isCommandEnabled(command))
            {
                controller.doCommand(command);
                return true;
            }
            return false;
        }

        var element = this.focused_element();
        if (element && attempt_command(element, command))
            return;
        var win = this.focused_window();
        do  {
            if (attempt_command(win, command))
                return;
            if (!win.parent || win == win.parent)
                break;
            win = win.parent;
        } while (true);
    },

    /* Inherit from buffer */

    __proto__ : buffer.prototype
};


add_hook("current_browser_buffer_finished_loading_hook",
         function (buffer) {
                 buffer.window.minibuffer.show("Done");
         });

add_hook("current_browser_buffer_status_change_hook",
         function (buffer, request, status, msg) {
             buffer.window.minibuffer.show(msg);
         });



//RETROJ: this may be improperly named.  it can read either an url or a
//        webjump from the minibuffer, but it will always return an url.
I.url_or_webjump = interactive_method(
    $async = function (ctx, cont) {
        keywords(arguments, $prompt = "URL:", $history = "url", $initial_value = "");
        var completions = arguments.$completions;
        if (completions === undefined)
        {
            completions = [];
            for (var x in gWebJumpLocations)
                completions.push([x,x]);
        }
        ctx.window.minibuffer.read_with_completion(
            $prompt = arguments.$prompt,
            $history = arguments.$history,
            $completions = completions,
            $initial_value = arguments.$initial_value,
            $select,
            $allow_non_matches,
            $callback = function (match,s) {
                if (s == "") // well-formedness check. (could be better!)
                    throw ("invalid url or webjump (\""+s+"\")");
                cont(get_url_or_webjump (s));
            });
    });


I.current_buffer_window = interactive_method(
    $sync = function (ctx) {
        var buffer = ctx.window.buffers.current;
        if (!(buffer instanceof browser_buffer))
            throw new Error("Current buffer is of invalid type");
        return buffer.content_window;
    });

// This name should perhaps change
I.current_buffer_document = interactive_method(
    $sync = function (ctx) {
        var buffer = ctx.window.buffers.current;
        if (!(buffer instanceof browser_buffer))
            throw new Error("Current buffer is of invalid type");
        return buffer.content_document;
    });

// This name should perhaps change
I.active_document = I.current_buffer_document;

I.current_frame = interactive_method(
    $sync = function (ctx) {
        var buffer = ctx.window.buffers.current;
        if (!(buffer instanceof browser_buffer))
            throw new Error("Current buffer is of invalid type");
        return buffer.focused_window();
    });

I.current_frame_url = interactive_method(
    $sync = function (ctx) {
        var buffer = ctx.window.buffers.current;
        if (!(buffer instanceof browser_buffer))
            throw new Error("Current buffer is of invalid type");
        return buffer.focused_window().location.href;
    });

// This name should probably change
I.current_url = interactive_method(
    $sync = function (ctx) {
        var buffer = ctx.window.buffers.current;
        if (!(buffer instanceof browser_buffer))
            throw new Error("Current buffer is of invalid type");
        return buffer.current_URI.spec;
    });

I.focused_element = interactive_method(
    $sync =  function (ctx) {
        var buffer = ctx.window.buffers.current;
        if (!(buffer instanceof browser_buffer))
            throw new Error("Current buffer is of invalid type");
        return buffer.focused_element();
    });


I.focused_link_url = interactive_method(
    $sync = function (ctx) {
        var buffer = ctx.window.buffers.current;
        if (!(buffer instanceof browser_buffer))
            throw new Error("Current buffer is of invalid type");
        // -- Focused link element
        ///JJF: check for errors or wrong element type.
        return get_link_location (buffer.focused_element());
    });

I.content_charset = interactive_method(
    $sync = function (ctx) {
        var buffer = ctx.window.buffers.current;
        if (!(buffer instanceof browser_buffer))
            throw new Error("Current buffer is of invalid type");
        // -- Charset of content area of focusedWindow
        var focusedWindow = buffer.focused_window();
        if (focusedWindow)
            return focusedWindow.document.characterSet;
        else
            return null;
    });


I.content_selection = interactive_method(
    $sync = function (ctx) {
        // -- Selection of content area of focusedWindow
        var focusedWindow = this.buffers.current.focused_window();
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
                       add_hook("current_browser_buffer_overlink_change_hook", overlink_update_status);
                   },
                   function () {
                       remove_hook("current_browser_buffer_overlink_change_hook", overlink_update_status);
                   });

overlink_mode(true);


/* open/follow targets */
const OPEN_CURRENT_BUFFER = 0; // only valid for open if the current
                               // buffer is a browser_buffer; for
                               // follow, equivalent to
                               // FOLLOW_TOP_FRAME.
const OPEN_NEW_BUFFER = 1;
const OPEN_NEW_BUFFER_BACKGROUND = 2;
const OPEN_NEW_WINDOW = 3;

const FOLLOW_DEFAULT = 4; // for open, implies OPEN_CURRENT_BUFFER
const FOLLOW_CURRENT_FRAME = 5; // for open, implies OPEN_CURRENT_BUFFER
const FOLLOW_TOP_FRAME = 6; // for open, implies OPEN_CURRENT_BUFFER

var TARGET_PROMPTS = [" in current buffer",
                      " in new buffer",
                      " in new buffer (background)",
                      " in new window",
                      "",
                      " in current frame",
                      " in top frame"];

var TARGET_NAMES = ["current buffer",
                    "new buffer",
                    "new buffer (background)",
                    "new window",
                    "default",
                    "current frame",
                    "top frame"];


function browse_target_prompt(target, prefix) {
    if (prefix == null)
        prefix = "Open URL";
    return prefix + TARGET_PROMPTS[target] + ":";
}

function document_load_spec(doc) {
    var sh_entry = get_SHEntry_for_document(doc);
    var result = {url: doc.location.href};
    if (sh_entry != null) {
        result.cache_key = sh_entry;
        result.referrer = sh_entry.referrerURI;
        result.post_data = sh_entry.postData;
    }
    return result;
}

/* Target can be either a browser_buffer or an nsIWebNavigation */
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
    if (target instanceof browser_buffer) {
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
        if (buffer instanceof browser_buffer)  {
            apply_load_spec(buffer, load_spec);
            break;
        }
        // If the current buffer is not a browser_buffer, use a new buffer.
    case OPEN_NEW_BUFFER:
        buffer = new browser_buffer(buffer.window, $context = buffer);
        apply_load_spec(buffer, load_spec);
        buffer.window.buffers.current = buffer;
        break;
    case OPEN_NEW_BUFFER_BACKGROUND:
        buffer = new browser_buffer(buffer.window, $context = buffer);
        apply_load_spec(buffer, load_spec);
        break;
    case OPEN_NEW_WINDOW:
        make_window($load = load_spec, $cwd = buffer.cwd);
        break;
    default:
        throw new Error("Invalid target: " + target);
    }
}

var default_browse_targets = {};
default_browse_targets["open"] = [OPEN_CURRENT_BUFFER, OPEN_NEW_BUFFER, OPEN_NEW_WINDOW];
default_browse_targets["follow"] = [FOLLOW_DEFAULT, OPEN_NEW_BUFFER, OPEN_NEW_WINDOW];
default_browse_targets["follow-top"] = [FOLLOW_TOP_FRAME, FOLLOW_CURRENT_FRAME];
default_browse_targets["find-url"] = [OPEN_NEW_BUFFER, OPEN_NEW_WINDOW];
default_browse_targets["go-up"] = "open";
default_browse_targets["jsconsole"] = "find-url";

I.browse_target = interactive_method(
    $sync = function (ctx, action) {
        var prefix = ctx.prefix_argument;
        var targets = action;
        while (typeof(targets) == "string")
            targets = default_browse_targets[targets];
        if (prefix == null || typeof(prefix) != "object")
            return targets[0];
        var num = prefix[0];
        var index = 0;
        while (num >= 4 && index < targets.length) {
            num = num / 4;
            index++;
        }
        return targets[index];
    });

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


function go_up (b, target)
{
    var loc = b.display_URI_string;
    var up = loc.replace (/(.*\/)[^\/]+\/?$/, "$1");
    open_in_browser(b, target, up);
}
interactive("go-up",
            "Go to the parent directory of the current URL",
            go_up,
            I.current_buffer(browser_buffer),
            I.browse_target("go-up"));


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
            go_back, I.current_buffer(browser_buffer), I.p);


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
            go_forward, I.current_buffer(browser_buffer), I.p);

function stop_loading (b)
{
    b.web_navigation.stop(Ci.nsIWebNavigation.STOP_NETWORK);
}
interactive("stop-loading",
            "Stop loading the current document.",
            stop_loading, I.current_buffer(browser_buffer));

function reload (b, bypass_cache)
{
    var flags = bypass_cache != null ?
        Ci.nsIWebNavigation.LOAD_FLAGS_NONE : Ci.nsIWebNavigation.LOAD_FLAGS_BYPASS_CACHE;
    b.web_navigation.reload(flags);
}
interactive("reload",
            "Reload the current document.\n" +
            "If a prefix argument is specified, the cache is bypassed.",
            reload, I.current_buffer(browser_buffer), I.P);

function unfocus(buffer)
{
    var elem = buffer.focused_element();
    if (elem) {
        elem.blur();
        return;
    }
    var win = buffer.focused_window();
    if (win != buffer.content_window)
        return;
    buffer.content_window.focus();
}
interactive("unfocus", unfocus, I.current_buffer(browser_buffer));

/**
 * browserDOMWindow: intercept window opening
 */
function initialize_browser_dom_window(window) {
    window.QueryInterface(Components.interfaces.nsIDOMChromeWindow).browserDOMWindow =
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
    QueryInterface : function (aIID) {
        if (aIID.equals(Ci.nsIBrowserDOMWindow) ||
            aIID.equals(Ci.nsISupports))
            return this;
        throw Components.results.NS_NOINTERFACE;
    },
    openURI : function(aURI, aOpener, aWhere, aContext) {
        // Reference: http://www.xulplanet.com/references/xpcomref/ifaces/nsIBrowserDOMWindow.html
        var target = this.next_target;
        if (target == null || target == FOLLOW_DEFAULT)
            target = browser_default_open_target;
        this.next_target = null;

        /* Determine the opener buffer */
        var opener_buffer = get_buffer_from_frame(this.window, aOpener.top);

        switch (browser_default_open_target) {
        case OPEN_CURRENT_BUFFER:
        case FOLLOW_TOP_FRAME:
            return aOpener.top;
        case FOLLOW_CURRENT_FRAME:
            return aOpener;
        case OPEN_NEW_BUFFER:
            var buffer = new browser_buffer(this.window, $context = opener_buffer);
            this.window.buffers.current = buffer;
            return buffer.content_window;
        case OPEN_NEW_BUFFER_BACKGROUND:
            var buffer = new browser_buffer(this.window, $context = opener_buffer);
            return buffer.content_window;
        case OPEN_NEW_WINDOW:
        default: /* shouldn't be needed */

            /* We don't call make_window here, because that will result
             * in the URL being loaded as the top-level document,
             * instead of within a browser buffer.  Instead, we can
             * rely on Mozilla using browser.chromeURL. */
            var extra_args = {};
            if (opener_buffer != null)
                extra_args.cwd_arg = opener_buffer.cwd;
            window_set_extra_arguments(extra_args);
            return null;
        }
    }
};

add_hook("window_initialize_early_hook", initialize_browser_dom_window);
