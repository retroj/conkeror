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
function browser_buffer(frame, browser)
{
    this.is_browser_buffer = true;
    this.frame = frame;
    if (browser == null)
    {
        browser = create_XUL(frame, "browser");
        browser.setAttribute("type", "content");
        browser.setAttribute("flex", "1");
        this.frame.buffers.container.appendChild(browser);
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
            browser_buffer_focus_change_hook.run(buffer);
        }, true /* capture */, false /* ignore untrusted events */);

    this.element.addEventListener("mouseover", function (event) {
            if (event.target instanceof frame.HTMLAnchorElement) {
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
    browser_buffer_normal_input_mode(this);
}

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

    load_URI : function (URI_s) {
        this._display_URI = URI_s;
        this.web_navigation.loadURI(URI_s, Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE,
                                    null /* referrer */,
                                    null /* post data */,
                                    null /* headers */);
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
        var win = this.frame.document.commandDispatcher.focusedWindow;
        if (this.child_window(win))
            return win;
        return this.content_window;
    },

    focused_element : function ()
    {
        var element = this.frame.document.commandDispatcher.focusedElement;
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
                 buffer.frame.minibuffer.show("Done");
         });

add_hook("current_browser_buffer_status_change_hook",
         function (buffer, request, status, msg) {
             buffer.frame.minibuffer.show(msg);
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
        ctx.frame.minibuffer.read_with_completion(
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
        var buffer = ctx.frame.buffers.current;
        if (!(buffer instanceof browser_buffer))
            throw new Error("Current buffer is of invalid type");
        return buffer.content_window;
    });

// This name should perhaps change
I.current_buffer_document = interactive_method(
    $sync = function (ctx) {
        var buffer = ctx.frame.buffers.current;
        if (!(buffer instanceof browser_buffer))
            throw new Error("Current buffer is of invalid type");
        return buffer.content_document;
    });

// This name should perhaps change
I.active_document = I.current_buffer_document;

I.current_frameset_frame = interactive_method(
    $sync = function (ctx) {
        var buffer = ctx.frame.buffers.current;
        if (!(buffer instanceof browser_buffer))
            throw new Error("Current buffer is of invalid type");
        return buffer.focused_window();
    });

I.current_frameset_frame_url = interactive_method(
    $sync = function (ctx) {
        var buffer = ctx.frame.buffers.current;
        if (!(buffer instanceof browser_buffer))
            throw new Error("Current buffer is of invalid type");
        return buffer.focused_window().location.href;
    });

// This name should probably change
I.current_url = interactive_method(
    $sync = function (ctx) {
        var buffer = ctx.frame.buffers.current;
        if (!(buffer instanceof browser_buffer))
            throw new Error("Current buffer is of invalid type");
        return buffer.current_URI.spec;
    });


I.focused_link_url = interactive_method(
    $sync = function (ctx) {
        var buffer = ctx.frame.buffers.current;
        if (!(buffer instanceof browser_buffer))
            throw new Error("Current buffer is of invalid type");
        // -- Focused link element
        ///JJF: check for errors or wrong element type.
        return get_link_location (buffer.focused_element());
    });

I.content_charset = interactive_method(
    $sync = function (ctx) {
        var buffer = ctx.frame.buffers.current;
        if (!(buffer instanceof browser_buffer))
            throw new Error("Current buffer is of invalid type");
        // -- Charset of content area of focusedWindow
        var focusedWindow = buffer.focused_window();
        if (focusedWindow)
            return focusedWindow.document.characterSet;
        else
            return null;
    });

function overlink_update_status(buffer, text) {
    if (text.length > 0)
        buffer.frame.minibuffer.show("Link: " + text);
    else
        buffer.frame.minibuffer.show("");
}

define_global_mode("overlink_mode",
                   function () {
                       add_hook("current_browser_buffer_overlink_change_hook", overlink_update_status);
                   },
                   function () {
                       remove_hook("current_browser_buffer_overlink_change_hook", overlink_update_status);
                   });

overlink_mode(true);

function define_browser_buffer_input_mode(base_name, keymap_name) {
    var name = "browser_buffer_" + base_name + "_input_mode";
    buffer[name + "_enabled"] = false;
    define_buffer_local_hook(name + "_enable_hook");
    define_buffer_local_hook(name + "_disable_hook");
    conkeror[name] = function (buffer) {
        if (buffer[name + "_enabled"])
            return;
        if (buffer.current_input_mode) {
            conkeror[buffer.current_input_mode + "_disable_hook"].run(buffer);
            buffer[buffer.current_input_mode + "_enabled"] = false;
        }
        buffer.current_input_mode = name;
        buffer[name + "_enabled"] = true;
        buffer.keymap = conkeror[keymap_name];
        conkeror[name + "_enable_hook"].run(buffer);
    }
    var hyphen_name = name.replace("_","-","g");
    interactive(hyphen_name, conkeror[name], I.current_buffer(browser_buffer));
}

define_browser_buffer_input_mode("normal", "browser_buffer_normal_keymap");

// For SELECT elements
define_browser_buffer_input_mode("select", "browser_buffer_select_keymap");

// For text INPUT and TEXTAREA elements
define_browser_buffer_input_mode("text", "browser_buffer_text_keymap");
define_browser_buffer_input_mode("textarea", "browser_buffer_textarea_keymap");

define_browser_buffer_input_mode("quote_next", "browser_buffer_quote_next_keymap");
define_browser_buffer_input_mode("quote", "browser_buffer_quote_keymap");

add_hook("browser_buffer_focus_change_hook", function (buffer) {
        if (buffer.browser_buffer_text_input_mode_enabled ||
            buffer.browser_buffer_textarea_input_mode_enabled ||
            buffer.browser_buffer_select_input_mode_enabled ||
            buffer.browser_buffer_normal_input_mode_enabled) {
            var elem = buffer.focused_element();
            if (elem) {
                switch (elem.localName.toLowerCase()) {
                    // FIXME: probably add a special radiobox/checkbox keymap as well
                case "input":
                    var type = elem.getAttribute("type");
                    if (type != null) type = type.toLowerCase();
                    if (type != "radio" &&
                        type != "radio" &&
                        type != "checkbox" &&
                        type != "submit" &&
                        type != "reset")
                        browser_buffer_text_input_mode(buffer);
                    return;
                case "textarea":
                    browser_buffer_textarea_input_mode(buffer);
                    return;
                case "select":
                    browser_buffer_select_input_mode(buffer);
                    return;
                }
            }
            browser_buffer_normal_input_mode(buffer);
        }
    });
