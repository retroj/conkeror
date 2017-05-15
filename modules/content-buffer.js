/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2009,2011-2012 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("buffer.js");
require("load-spec.js");
require("history.js");

define_variable("homepage", "chrome://conkeror-help/content/help.html",
                "The url loaded by default for new content buffers.");

define_buffer_local_hook("content_buffer_finished_loading_hook");
define_buffer_local_hook("content_buffer_started_loading_hook");
define_buffer_local_hook("content_buffer_progress_change_hook");
define_buffer_local_hook("content_buffer_location_change_hook");
define_buffer_local_hook("content_buffer_status_change_hook");
define_buffer_local_hook("content_buffer_focus_change_hook");
define_buffer_local_hook("content_buffer_dom_link_added_hook");
define_buffer_local_hook("content_buffer_popup_blocked_hook");

define_current_buffer_hook("current_content_buffer_finished_loading_hook", "content_buffer_finished_loading_hook");
define_current_buffer_hook("current_content_buffer_progress_change_hook", "content_buffer_progress_change_hook");
define_current_buffer_hook("current_content_buffer_location_change_hook", "content_buffer_location_change_hook");
define_current_buffer_hook("current_content_buffer_status_change_hook", "content_buffer_status_change_hook");
define_current_buffer_hook("current_content_buffer_focus_change_hook", "content_buffer_focus_change_hook");

function maybe_decode_uri (uri) {
    return get_pref("network.standard-url.escape-utf8") ? uri : decodeURIComponent(uri);
}

function content_buffer_modality (buffer) {
    var elem = buffer.focused_element;
    function push_keymaps (tag) {
        buffer.content_modalities.map(
            function (m) {
                if (m[tag])
                    buffer.keymaps.push(m[tag]);
            });
        return null;
    }
    push_keymaps('normal');
    if (elem) {
        let p = elem.parentNode;
        while (p && !(p instanceof Ci.nsIDOMHTMLFormElement))
            p = p.parentNode;
        if (p)
            push_keymaps('form');
    }
    if (elem instanceof Ci.nsIDOMHTMLInputElement) {
        var type = (elem.getAttribute("type") || "").toLowerCase();
        if ({checkbox:1, radio:1, submit:1, reset:1}[type])
            return push_keymaps(type);
        else
            return push_keymaps('text');
    }
    if (elem instanceof Ci.nsIDOMHTMLTextAreaElement)
        return push_keymaps('textarea');
    if (elem instanceof Ci.nsIDOMHTMLSelectElement)
        return push_keymaps('select');
    if (elem instanceof Ci.nsIDOMHTMLAnchorElement)
        return push_keymaps('anchor');
    if (elem instanceof Ci.nsIDOMHTMLButtonElement)
        return push_keymaps('button');
    if (elem instanceof Ci.nsIDOMHTMLEmbedElement ||
        elem instanceof Ci.nsIDOMHTMLObjectElement)
    {
        return push_keymaps('embed');
    }
    var frame = buffer.focused_frame;
    if (frame && frame.document.designMode &&
        frame.document.designMode == "on")
    {
        return push_keymaps('richedit');
    }
    while (elem) {
        switch (elem.contentEditable) {
        case "true":
            return push_keymaps('richedit');
        case "false":
            return null;
        default: // "inherit"
            elem = elem.parentNode;
        }
    }
    return null;
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

        this.browser.addEventListener("DOMLinkAdded", function (event) {
            content_buffer_dom_link_added_hook.run(buffer, event);
        }, true /* capture */);

        this.browser.addEventListener("DOMPopupBlocked", function (event) {
            dumpln("Blocked popup: " + event.popupWindowURI.spec);
            content_buffer_popup_blocked_hook.run(buffer, event);
        }, true /* capture */);

        this.page_modes = [];

        this.ignore_initial_blank = true;

        var lspec = arguments.$load;
        if (lspec) {
            if (load_spec_uri_string(lspec) == "about:blank")
                this.ignore_initial_blank = false;
            else {
                /* Ensure that an existing load of about:blank is stopped */
                this.web_navigation.stop(Ci.nsIWebNavigation.STOP_ALL);

                this.load(lspec);
            }
        }

        this.modalities.push(content_buffer_modality);
        this.content_modalities = [{
            normal: content_buffer_normal_keymap,
            form: content_buffer_form_keymap,
            checkbox: content_buffer_checkbox_keymap,
            radio: content_buffer_checkbox_keymap,
            submit: content_buffer_button_keymap,
            reset: content_buffer_button_keymap,
            text: content_buffer_text_keymap,
            textarea: content_buffer_textarea_keymap,
            select: content_buffer_select_keymap,
            anchor: content_buffer_anchor_keymap,
            button: content_buffer_button_keymap,
            embed: content_buffer_embed_keymap,
            richedit: content_buffer_richedit_keymap
        }];
    } finally {
        this.constructor_end();
    }
}
content_buffer.prototype = {
    constructor: content_buffer,
    toString: function () "#<content_buffer>",

    destroy: function () {
        this.browser.removeProgressListener(this);
        buffer.prototype.destroy.call(this);
    },

    content_modalities: null,

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
    get description () { return maybe_decode_uri(this.display_uri_string); },

    load: function (load_spec) {
        apply_load_spec(this, load_spec);
    },

    _request_count: 0,

    loading: false,

    // nsIWebProgressListener interface
    //
    QueryInterface: generate_QI(Ci.nsIWebProgressListener, Ci.nsISupportsWeakReference),

    // This method is called to indicate state changes.
    onStateChange: function (aWebProgress, aRequest, aStateFlags, aStatus) {
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
            this.loading = true;
            content_buffer_started_loading_hook.run(this);
        } else if (aStateFlags & Ci.nsIWebProgressListener.STATE_STOP &&
                   aStateFlags & Ci.nsIWebProgressListener.STATE_IS_NETWORK) {
            if (this.loading == true) {
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

    // This method is called to indicate progress changes for the
    // currently loading page.
    onProgressChange: function (webProgress, request, curSelf, maxSelf,
                                curTotal, maxTotal)
    {
        content_buffer_progress_change_hook.run(this, request, curSelf, maxSelf, curTotal, maxTotal);
    },

    // This method is called to indicate a change to the current location.
    // The url can be gotten as location.spec.
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
        this.page = {
            local: { __proto__: this.local }
        };
        this.default_browser_object_classes = {};
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
        //FIXME: implement this.
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

function try_read_url_handlers (input) {
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

define_variable("url_completion_sort_order", "visitcount_descending",
    "Gives the default sort order for history and bookmark completion.\n"+
    "The value is given as a string, and the available options include: "+
    "'none', 'title_ascending', 'date_ascending', 'uri_ascending', "+
    "'visitcount_ascending', 'keyword_ascending', 'dateadded_ascending', "+
    "'lastmodified_ascending', 'tags_ascending', and 'annotation_ascending'. "+
    "For every 'ascending' option, there is a corresponding 'descending' "+
    "option.  Additionally, with XULRunner 6 and later, the options "+
    "'frecency_ascending' and 'frecency_descending' are available.  See also "+
    "<https://developer.mozilla.org/en/NsINavHistoryQueryOptions#Sorting_methods>.");

define_variable("minibuffer_read_url_select_initial", true,
    "Specifies whether a URL presented in the minibuffer for editing "+
    "should be selected.  This affects find-alternate-url.");


minibuffer_auto_complete_preferences["url"] = true;
minibuffer.prototype.read_url = function () {
    keywords(arguments, $prompt = "URL:", $history = "url", $initial_value = "",
             $select = minibuffer_read_url_select_initial,
             $use_webjumps = url_completion_use_webjumps,
             $use_history = url_completion_use_history,
             $use_bookmarks = url_completion_use_bookmarks,
             $sort_order = url_completion_sort_order);
    var completer = new url_completer(
        $use_webjumps = arguments.$use_webjumps,
        $use_bookmarks = arguments.$use_bookmarks,
        $use_history = arguments.$use_history,
        $sort_order = arguments.$sort_order);
    var result = yield this.read(
        $prompt = arguments.$prompt,
        $history = arguments.$history,
        $completer = completer,
        $initial_value = arguments.$initial_value,
        $auto_complete = "url",
        $select = arguments.$select,
        $require_match = false);
    if (!possibly_valid_url(result) && !get_webjump(result))
        result = try_read_url_handlers(result);
    if (result == "") // well-formedness check. (could be better!)
        throw ("invalid url or webjump (\""+ result +"\")");
    yield co_return(load_spec(result));
};


/*
 * Overlink Mode
 */
function overlink_update_status (buffer, node) {
    if (node && node.href.length > 0)
        buffer.window.minibuffer.show("Link: " + maybe_decode_uri(node.href));
    else
        buffer.window.minibuffer.clear();
}

function overlink_predicate (node) {
    while (node && !(node instanceof Ci.nsIDOMHTMLAnchorElement))
        node = node.parentNode;
    return node;
}

function overlink_initialize (buffer) {
    buffer.current_overlink = null;
    buffer.overlink_mouseover = function (event) {
        if (buffer != buffer.window.buffers.current ||
            event.target == buffer.browser)
        {
            return;
        }
        var node = overlink_predicate(event.target);
        if (node) {
            buffer.current_overlink = event.target;
            overlink_update_status(buffer, node);
        }
    };
    buffer.overlink_mouseout = function (event) {
        if (buffer != buffer.window.buffers.current)
            return;
        if (buffer.current_overlink == event.target) {
            buffer.current_overlink = null;
            overlink_update_status(buffer, null);
        }
    };
    buffer.browser.addEventListener("mouseover", buffer.overlink_mouseover, true);
    buffer.browser.addEventListener("mouseout", buffer.overlink_mouseout, true);
}

define_global_mode("overlink_mode",
    function enable () {
        add_hook("create_buffer_hook", overlink_initialize);
        for_each_buffer(overlink_initialize);
    },
    function disable () {
        remove_hook("create_buffer_hook", overlink_initialize);
        for_each_buffer(function (b) {
            b.browser.removeEventListener("mouseover", b.overlink_mouseover, true);
            b.browser.removeEventListener("mouseout", b.overlink_mouseout, true);
            delete b.current_overlink;
            delete b.overlink_mouseover;
            delete b.overlink_mouseout;
        });
    },
    $doc = "Overlink-mode is a programmable mode for showing information "+
           "about DOM nodes (such as link URLs) in the minibuffer when "+
           "hovering with the mouse.");

overlink_mode(true);


/*
 * Navigation Commands
 */
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
        reload(I.buffer, I.P, element, I.forced_charset || null);
    },
    $browser_object = null);

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


/*
 * Page Modes
 */

define_keywords("$test");
function page_mode (name, enable, disable) {
    keywords(arguments);
    buffer_mode.call(this, name, enable, disable,
                     forward_keywords(arguments));
    this.test = make_array(arguments.$test);
}
page_mode.prototype = {
    constructor: page_mode,
    __proto__: buffer_mode.prototype,
    test: null,
    enable: function (buffer) {
        buffer_mode.prototype.enable.call(this, buffer);
        buffer.page_modes.push(this.name);
        buffer.set_input_mode();
        return true;
    },
    disable: function (buffer) {
        buffer_mode.prototype.disable.call(this, buffer);
        var i = buffer.page_modes.indexOf(this.name);
        if (i > -1)
            buffer.page_modes.splice(i, 1);
        buffer.set_input_mode();
    }
};

function define_page_mode (name, test, enable, disable) {
    keywords(arguments, $constructor = page_mode);
    define_buffer_mode(name, enable, disable,
                       $test = test,
                       forward_keywords(arguments));
}
ignore_function_for_get_caller_source_code_reference("define_page_mode");


define_keywords("$modality");
function keymaps_page_mode (name, enable, disable) {
    keywords(arguments);
    page_mode.call(this, name, enable, disable,
                   forward_keywords(arguments));
    this.modality = arguments.$modality;
}
keymaps_page_mode.prototype = {
    constructor: keymaps_page_mode,
    __proto__: page_mode.prototype,
    modality: null,
    _enable: function (buffer) {
        buffer.content_modalities.push(this.modality);
    },
    _disable: function (buffer) {
        var i = buffer.content_modalities.indexOf(this.modality);
        if (i > -1)
            buffer.content_modalities.splice(i, 1);
    }
};
function define_keymaps_page_mode (name, test, modality) {
    keywords(arguments, $constructor = keymaps_page_mode);
    define_buffer_mode(name, null, null,
                       $test = test,
                       $modality = modality,
                       forward_keywords(arguments));
}
ignore_function_for_get_caller_source_code_reference("define_keymaps_page_mode");


var active_page_modes = [];

function page_mode_activate (page_mode) {
    var i = active_page_modes.indexOf(page_mode.name);
    if (i == -1)
        active_page_modes.push(page_mode.name);
}

function page_mode_deactivate (page_mode) {
    var i = active_page_modes.indexOf(page_mode.name);
    if (i > -1)
        active_page_modes.splice(i, 1);
}


function page_mode_update (buffer) {
    for (var i = buffer.page_modes.length - 1; i >= 0; --i) {
        var p = buffer.page_modes[i];
        conkeror[p].disable(buffer);
    }
    var uri = buffer.current_uri;
    for each (var name in active_page_modes) {
        var m = conkeror[name];
        m.test.some(
            function (test) {
                if (test instanceof RegExp) {
                    if (test.exec(uri.spec))
                        return m.enable(buffer);
                } else if (test(uri))
                    return m.enable(buffer);
                return false;
            });
    }
}

add_hook("content_buffer_location_change_hook", page_mode_update);

provide("content-buffer");
