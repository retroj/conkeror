/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2009 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

require("buffer.js");
require("load-spec.js");

define_variable("homepage", "chrome://conkeror-help/content/help.html",
                "The url loaded by default for new content buffers.");

define_buffer_local_hook("content_buffer_finished_loading_hook");
define_buffer_local_hook("content_buffer_started_loading_hook");
define_buffer_local_hook("content_buffer_progress_change_hook");
define_buffer_local_hook("content_buffer_location_change_hook");
define_buffer_local_hook("content_buffer_status_change_hook");
define_buffer_local_hook("content_buffer_focus_change_hook");
define_buffer_local_hook("content_buffer_overlink_change_hook");
define_buffer_local_hook("content_buffer_dom_link_added_hook");
define_buffer_local_hook("content_buffer_popup_blocked_hook");

define_current_buffer_hook("current_content_buffer_finished_loading_hook", "content_buffer_finished_loading_hook");
define_current_buffer_hook("current_content_buffer_progress_change_hook", "content_buffer_progress_change_hook");
define_current_buffer_hook("current_content_buffer_location_change_hook", "content_buffer_location_change_hook");
define_current_buffer_hook("current_content_buffer_status_change_hook", "content_buffer_status_change_hook");
define_current_buffer_hook("current_content_buffer_focus_change_hook", "content_buffer_focus_change_hook");
define_current_buffer_hook("current_content_buffer_overlink_change_hook", "content_buffer_overlink_change_hook");


define_input_mode("text", "content_buffer_text_keymap", $display_name = "input:TEXT");
define_input_mode("textarea", "content_buffer_textarea_keymap", $display_name = "input:TEXTAREA");
define_input_mode("richedit", "content_buffer_richedit_keymap", $display_name = "input:RICHEDIT");
define_input_mode("select", "content_buffer_select_keymap", $display_name = "input:SELECT");
define_input_mode("checkbox", "content_buffer_checkbox_keymap", $display_name = "input:CHECKBOX/RADIOBUTTON");
define_input_mode("button", "content_buffer_button_keymap", $display_name = "input:BUTTON");

function content_buffer_modality (buffer) {
    var elem = buffer.focused_element;
    buffer.keymaps.push(content_buffer_normal_keymap);
    if (elem) {
        let p = elem.parentNode;
        while (p && !(p instanceof Ci.nsIDOMHTMLFormElement))
            p = p.parentNode;
        if (p)
            buffer.keymaps.push(content_buffer_form_keymap);
    }
    if (elem instanceof Ci.nsIDOMHTMLInputElement) {
        switch ((elem.getAttribute("type") || "").toLowerCase()) {
        case "checkbox":
            checkbox_input_mode(buffer, true);
            break;
        case "radio":
            checkbox_input_mode(buffer, true);
            break;
        case "submit":
            button_input_mode(buffer, true);
            break;
        case "reset":
            button_input_mode(buffer, true);
            break;
        default:
            text_input_mode(buffer, true);
            break;
        }
        return;
    }
    if (elem instanceof Ci.nsIDOMHTMLTextAreaElement) {
        textarea_input_mode(buffer, true);
        return;
    }
    if (elem instanceof Ci.nsIDOMHTMLSelectElement) {
        select_input_mode(buffer, true);
        return;
    }
    if (elem instanceof Ci.nsIDOMHTMLAnchorElement) {
        buffer.keymaps.push(content_buffer_anchor_keymap);
        return;
    }
    if (elem instanceof Ci.nsIDOMHTMLButtonElement) {
        button_input_mode(buffer, true);
        return;
    }
    var frame = buffer.focused_frame;
    if (frame && frame.document.designMode &&
        frame.document.designMode == "on")
    {
        richedit_input_mode(buffer, true);
        return;
    }
    while (elem) {
        switch (elem.contentEditable) {
        case "true":
            richedit_input_mode(buffer, true);
            return;
        case "false":
            return;
        default: // "inherit"
            elem = elem.parentNode;
        }
    }
}


define_keywords("$load");
function content_buffer (window) {
    keywords(arguments);
    this.constructor_begin();
    try {
        conkeror.buffer.call(this, window, forward_keywords(arguments));

        this.browser.addProgressListener(this);
        var buffer = this;
        this.browser.addEventListener("DOMTitleChanged", function (event) {
            buffer_title_change_hook.run(buffer);
        }, true /* capture */);

        this.browser.addEventListener("scroll", function (event) {
            buffer_scroll_hook.run(buffer);
        }, true /* capture */);

        this.browser.addEventListener("focus", function (event) {
            content_buffer_focus_change_hook.run(buffer, event);
        }, true /* capture */);

        this.browser.addEventListener("mouseover", function (event) {
            var node = event.target;
            while (node && !(node instanceof Ci.nsIDOMHTMLAnchorElement))
                node = node.parentNode;
            if (node) {
                content_buffer_overlink_change_hook.run(buffer, node.href);
                buffer.current_overlink = event.target;
            }
        }, true /* capture */);

        this.browser.addEventListener("mouseout", function (event) {
            if (buffer.current_overlink == event.target) {
                buffer.current_overlink = null;
                content_buffer_overlink_change_hook.run(buffer, "");
            }
        }, true /* capture */);

        // initialize buffer.current_overlink in case mouseout happens
        // before mouseover.
        buffer.current_overlink = null;

        this.browser.addEventListener("DOMLinkAdded", function (event) {
            content_buffer_dom_link_added_hook.run(buffer, event);
        }, true /* capture */);

        this.browser.addEventListener("DOMPopupBlocked", function (event) {
	    dumpln("Blocked popup: " + event.popupWindowURI.spec);
            content_buffer_popup_blocked_hook.run(buffer, event);
        }, true /* capture */);

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

        this.modalities.push(content_buffer_modality);

    } finally {
        this.constructor_end();
    }
}
content_buffer.prototype = {
    constructor: content_buffer,

    destroy: function () {
        this.browser.removeProgressListener(this);
        buffer.prototype.destroy.call(this);
    },

    get scrollX () { return this.top_frame.scrollX; },
    get scrollY () { return this.top_frame.scrollY; },
    get scrollMaxX () { return this.top_frame.scrollMaxX; },
    get scrollMaxY () { return this.top_frame.scrollMaxY; },

    /* Used to display the correct URI when the buffer opens initially
     * even before loading has progressed far enough for currentURI to
     * contain the correct URI. */
    _display_uri: null,

    get display_uri_string () {
        if (this._display_uri)
            return this._display_uri;
        if (this.current_uri)
            return this.current_uri.spec;
        return "";
    },

    get title () { return this.browser.contentTitle; },
    get description () { return this.display_uri_string; },

    load: function (load_spec) {
        apply_load_spec(this, load_spec);
    },

    _request_count: 0,

    loading: false,

    /* nsIWebProgressListener */
    QueryInterface: generate_QI(Ci.nsIWebProgressListener, Ci.nsISupportsWeakReference),

    // This method is called to indicate state changes.
    onStateChange: function (aWebProgress, aRequest, aStateFlags, aStatus) {
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
        } else if (aStateFlags & Ci.nsIWebProgressListener.STATE_STOP) {
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
        } else if (aStateFlags & Ci.nsIWebProgressListener.STATE_STOP &&
                   aStateFlags & Ci.nsIWebProgressListener.STATE_IS_NETWORK) {
            if (this.loading == true) {
                //dumpln("*** finished loading");
                this.loading = false;
                content_buffer_finished_loading_hook.run(this);
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
    onProgressChange: function (webProgress, request, curSelf, maxSelf,
                                curTotal, maxTotal) {
        content_buffer_progress_change_hook.run(this, request, curSelf, maxSelf, curTotal, maxTotal);
    },

    /* This method is called to indicate a change to the current location.
       The url can be gotten as location.spec. */
    onLocationChange: function (webProgress, request, location) {
        /* Attempt to ignore onLocationChange calls due to the initial
         * loading of about:blank by all xul:browser elements. */
        if (location.spec == "about:blank" && this.ignore_initial_blank)
            return;

        this.ignore_initial_blank = false;

        //dumpln("spec: " + location.spec  +" ;;; " + this.display_uri_string);
        /* Use the real location URI now */
        this._display_uri = null;
        this.set_input_mode();
        content_buffer_location_change_hook.run(this, request, location);
        buffer_description_change_hook.run(this);
    },

    // This method is called to indicate a status changes for the currently
    // loading page.  The message is already formatted for display.
    // Status messages could be displayed in the minibuffer output area.
    onStatusChange: function (webProgress, request, status, msg) {
        this.set_default_message(msg);
        content_buffer_status_change_hook.run(this, request, status, msg);
    },

    // This method is called when the security state of the browser changes.
    onSecurityChange: function (webProgress, request, state) {
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
    __proto__: buffer.prototype
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


define_variable("read_url_handler_list", [],
    "A list of handler functions which transform a typed url into a valid " +
    "url or webjump.  If the typed input is not valid then each function " +
    "on this list is tried in turn.  The handler function is called with " +
    "a single string argument and it should return either a string or " +
    "null.  The result of the first function on the list that returns a " +
    "string is used in place of the input.");

/**
 * read_url_make_default_webjump_handler returns a function that
 * transforms any input into the given webjump.  It should be the last
 * handler on read_url_handler_list (because any input is
 * accepted).
 */
function read_url_make_default_webjump_handler (default_webjump) {
    return function (input) {
	return default_webjump + " " + input;
    };
}

/**
 * read_url_make_blank_url_handler returns a function that replaces a
 * blank (empty) input with the given url (or webjump).  The url may
 * perform some function, eg. "javascript:location.reload()".
 */
function read_url_make_blank_url_handler (url) {
    return function (input) {
	if (input.length == 0)
	    return url;
	return null;
    };
}

minibuffer.prototype.try_read_url_handlers = function (input) {
    var result;
    for (var i = 0; i < read_url_handler_list.length; ++i) {
        if ((result = read_url_handler_list[i](input)))
            return result;
    }
    return input;
}

define_variable("url_completion_use_webjumps", true,
    "Specifies whether URL completion should complete webjumps.");

define_variable("url_completion_use_bookmarks", true,
    "Specifies whether URL completion should complete bookmarks.");

define_variable("url_completion_use_history", false,
    "Specifies whether URL completion should complete using browser "+
    "history.");

define_variable("minibuffer_read_url_select_initial", true,
    "Specifies whether a URL  presented in the minibuffer for editing "+
    "should be selected.  This affects find-alternate-url.");


minibuffer_auto_complete_preferences["url"] = true;
minibuffer.prototype.read_url = function () {
    keywords(arguments, $prompt = "URL:", $history = "url", $initial_value = "",
             $use_webjumps = url_completion_use_webjumps,
             $use_history = url_completion_use_history,
             $use_bookmarks = url_completion_use_bookmarks);
    var completer = url_completer($use_webjumps = arguments.$use_webjumps,
        $use_bookmarks = arguments.$use_bookmarks,
        $use_history = arguments.$use_history);
    var result = yield this.read(
        $prompt = arguments.$prompt,
        $history = arguments.$history,
        $completer = completer,
        $initial_value = arguments.$initial_value,
        $auto_complete = "url",
        $select = minibuffer_read_url_select_initial,
        $match_required = false);
    if (!possibly_valid_url(result) && !get_webjump(result))
        result = this.try_read_url_handlers(result);
    if (result == "") // well-formedness check. (could be better!)
        throw ("invalid url or webjump (\""+ result +"\")");
    yield co_return(load_spec(result));
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
function overlink_update_status (buffer, text) {
    if (text.length > 0)
        buffer.window.minibuffer.show("Link: " + text);
    else
        buffer.window.minibuffer.show("");
}

define_global_mode("overlink_mode", function () {
    add_hook("current_content_buffer_overlink_change_hook", overlink_update_status);
}, function () {
    remove_hook("current_content_buffer_overlink_change_hook", overlink_update_status);
});

overlink_mode(true);


function go_back (b, prefix) {
    if (prefix < 0)
        go_forward(b, -prefix);

    check_buffer(b, content_buffer);

    if (b.web_navigation.canGoBack) {
        var hist = b.web_navigation.sessionHistory;
        var idx = hist.index - prefix;
        if (idx < 0)
            idx = 0;
        b.web_navigation.gotoIndex(idx);
    } else
        throw interactive_error("Can't go back");
}

interactive("back",
    "Go back in the session history for the current buffer.",
    function (I) {go_back(I.buffer, I.p);});


function go_forward (b, prefix) {
    if (prefix < 0)
        go_back(b, -prefix);

    check_buffer(b, content_buffer);

    if (b.web_navigation.canGoForward) {
        var hist = b.web_navigation.sessionHistory;
        var idx = hist.index + prefix;
        if (idx >= hist.count) idx = hist.count-1;
        b.web_navigation.gotoIndex(idx);
    } else
        throw interactive_error("Can't go forward");
}

interactive("forward",
            "Go forward in the session history for the current buffer.",
            function (I) {go_forward(I.buffer, I.p);});


function stop_loading (b) {
    check_buffer(b, content_buffer);
    b.web_navigation.stop(Ci.nsIWebNavigation.STOP_NETWORK);
}

interactive("stop-loading",
            "Stop loading the current document.",
            function (I) {stop_loading(I.buffer);});


function reload (b, bypass_cache, element, forced_charset) {
    check_buffer(b, content_buffer);
    if (element) {
        if (element instanceof Ci.nsIDOMHTMLImageElement) {
            try {
                var cache = Cc['@mozilla.org/image/cache;1']
                    .getService(Ci.imgICache);
                cache.removeEntry(make_uri(element.src));
            } catch (e) {}
        }
        element.parentNode.replaceChild(element.cloneNode(true), element);
    } else if (b.current_uri.spec != b.display_uri_string) {
        apply_load_spec(b, load_spec({ uri: b.display_uri_string,
                                       forced_charset: forced_charset }));
    } else {
        var flags = bypass_cache == null ?
            Ci.nsIWebNavigation.LOAD_FLAGS_NONE :
            Ci.nsIWebNavigation.LOAD_FLAGS_BYPASS_CACHE;

        if (! forced_charset && forced_charset_list)
            forced_charset = predicate_alist_match(forced_charset_list,
                                                   b.current_uri.spec);

        if (forced_charset) {
            try {
                var atomservice = Cc['@mozilla.org/atom-service;1']
                    .getService(Ci.nsIAtomService);
                b.web_navigation.documentCharsetInfo.forcedCharset =
                    atomservice.getAtom(forced_charset);
            } catch (e) {}
        }
        b.web_navigation.reload(flags);
    }
}

interactive("reload",
    "Reload the current document.\n" +
    "If a prefix argument is specified, the cache is bypassed.  If a "+
    "DOM node is supplied via browser object, that node will be "+
    "reloaded.",
    function (I) {
        check_buffer(I.buffer, content_buffer);
        var element = yield read_browser_object(I);
        reload(I.buffer, I.P, element, I.forced_charset);
    });

/**
 * browserDOMWindow: intercept window opening
 */
function initialize_browser_dom_window (window) {
    window.QueryInterface(Ci.nsIDOMChromeWindow).browserDOMWindow =
        new browser_dom_window(window);
}

define_variable("browser_default_open_target", OPEN_NEW_BUFFER,
    "Specifies how new window requests by content pages (e.g. by "+
    "window.open from JavaScript or by using the target attribute of "+
    "anchor and form elements) will be handled.  This will generally "+
    "be `OPEN_NEW_BUFFER', `OPEN_NEW_BUFFER_BACKGROUND', or "+
    "`OPEN_NEW_WINDOW'.");


function browser_dom_window (window) {
    this.window = window;
    this.next_target = null;
}
browser_dom_window.prototype = {
    constructor: browser_dom_window,
    QueryInterface: generate_QI(Ci.nsIBrowserDOMWindow),

    openURI: function (aURI, aOpener, aWhere, aContext) {
        // Reference: http://www.xulplanet.com/references/xpcomref/ifaces/nsIBrowserDOMWindow.html
        var target = this.next_target;
        if (target == null || target == FOLLOW_DEFAULT)
            target = browser_default_open_target;
        this.next_target = null;

        /* Determine the opener buffer */
        var opener = get_buffer_from_frame(this.window, aOpener);

        switch (browser_default_open_target) {
        case OPEN_CURRENT_BUFFER:
            return aOpener.top;
        case FOLLOW_CURRENT_FRAME:
            return aOpener;
        case OPEN_NEW_BUFFER:
            var buffer = new content_buffer(this.window, $opener = opener);
            this.window.buffers.current = buffer;
            return buffer.top_frame;
        case OPEN_NEW_BUFFER_BACKGROUND:
            var buffer = new content_buffer(this.window, $opener = opener);
            return buffer.top_frame;
        case OPEN_NEW_WINDOW:
        default: /* shouldn't be needed */

            /* We don't call make_window here, because that will result
             * in the URL being loaded as the top-level document,
             * instead of within a browser buffer.  Instead, we can
             * rely on Mozilla using browser.chromeURL. */
            window_set_extra_arguments(
                {initial_buffer_creator: buffer_creator(content_buffer, $opener = opener)}
            );
            return null;
        }
    }
};

add_hook("window_initialize_early_hook", initialize_browser_dom_window);

define_keywords("$display_name", "$enable", "$disable", "$doc");
function define_page_mode (name) {
    keywords(arguments);
    var display_name = arguments.$display_name;
    var enable = arguments.$enable;
    var disable = arguments.$disable;
    var doc = arguments.$doc;
    define_buffer_mode(name,
                       $display_name = display_name,
                       $class = "page_mode",
                       $enable = function (buffer) {
                           buffer.page = {
                               local: { __proto__: buffer.local }
                           };
                           if (enable)
                               enable(buffer);
                           buffer.set_input_mode();
                       },
                       $disable = function (buffer) {
                           if (disable)
                               disable(buffer);
                           buffer.page = null;
                           buffer.default_browser_object_classes = {};
                           buffer.set_input_mode();
                       },
                       $doc = doc);
}
ignore_function_for_get_caller_source_code_reference("define_page_mode");


define_variable("auto_mode_list", [],
    "A list of mappings from URI regular expressions to page modes.");

function page_mode_auto_update (buffer) {
    var uri = buffer.current_uri.spec;
    var mode = predicate_alist_match(auto_mode_list, uri);
    if (mode)
        mode(buffer, true);
    else if (buffer.page_mode)
        conkeror[buffer.page_mode](buffer, false);
}

add_hook("content_buffer_location_change_hook", page_mode_auto_update);

provide("content-buffer");
