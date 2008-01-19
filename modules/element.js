require("hints.js");
require("save.js");

/**
 * This is a simple wrapper function that sets focus to elem, and
 * bypasses the automatic focus prevention system, which might
 * otherwise prevent this from happening.
 */
function browser_set_element_focus(buffer, elem, prevent_scroll) {
    buffer.last_user_input_received = Date.now();
    if (prevent_scroll)
        set_focus_no_scroll(buffer.window, elem);
    else
        elem.focus();
}

function browser_element_focus(buffer, elem)
{
    if (elem instanceof Ci.nsIDOMXULTextBoxElement)  {
        // Focus the input field instead
        elem = elem.wrappedJSObject.inputField;
    }

    browser_set_element_focus(buffer, elem);
    if (elem instanceof Ci.nsIDOMWindow) {
        return;
    }
    // If it is not a window, it must be an HTML element
    var x = 0;
    var y = 0;
    if (elem instanceof Ci.nsIDOMHTMLFrameElement || elem instanceof Ci.nsIDOMHTMLIFrameElement) {
        elem.contentWindow.focus();
        return;
    }
    if (elem instanceof Ci.nsIDOMHTMLAreaElement) {
        var coords = elem.getAttribute("coords").split(",");
        x = Number(coords[0]);
        y = Number(coords[1]);
    }

    var doc = elem.ownerDocument;
    var evt = doc.createEvent("MouseEvents");
    var doc = elem.ownerDocument;

    evt.initMouseEvent("mouseover", true, true, doc.defaultView, 1, x, y, 0, 0, 0, 0, 0, 0, 0, null);
    elem.dispatchEvent(evt);
}

function browser_element_follow(buffer, target, elem)
{
    browser_set_element_focus(buffer, elem, true /* no scroll */);

    var load_spec = null;
    var current_frame = null;
    var no_click = false;
    if (elem instanceof Ci.nsIDOMWindow) {
        current_frame = elem;
        no_click = true;
    } else if (elem instanceof Ci.nsIDOMHTMLFrameElement ||
               elem instanceof Ci.nsIDOMHTMLIFrameElement ||
               elem instanceof Ci.nsIDOMHTMLLinkElement) {
        no_click = true;
    } else if (elem instanceof Ci.nsIDOMHTMLImageElement) {
        if (!elem.hasAttribute("onmousedown") && !elem.hasAttribute("onclick"))
            no_click = true;
    }

    if (target == FOLLOW_DEFAULT && !no_click) {
        var x = 1, y = 1;
        if (elem instanceof Ci.nsIDOMHTMLAreaElement) {
            var coords = elem.getAttribute("coords").split(",");
            if (coords.length >= 2) {
                x = Number(coords[0]) + 1;
                y = Number(coords[1]) + 1;
            }
        }
        browser_follow_link_with_click(buffer, elem, x, y);
        return;
    }

    var load_spec = element_get_load_spec(elem);
    if (load_spec == null) {
        throw interactive_error("Element has no associated URL");
        return;
    }

    if (load_spec.url.match(/^\s*javascript:/)) {
        // This URL won't work
        throw interactive_error("Can't load javascript URL");
    }

    var target_obj = null;
    switch (target) {
    case FOLLOW_CURRENT_FRAME:
        if (current_frame == null) {
            if (elem.ownerDocument)
                current_frame = elem.ownerDocument.defaultView;
            else
                current_frame = buffer.top_frame;
        }
        if (current_frame != buffer.top_frame) {
            target_obj = get_web_navigation_for_window(current_frame);
            apply_load_spec(target_obj, load_spec);
            break;
        }
    case FOLLOW_DEFAULT:
    case FOLLOW_TOP_FRAME:
    case OPEN_CURRENT_BUFFER:
        buffer.load(load_spec);
        break;
    case OPEN_NEW_WINDOW:
    case OPEN_NEW_BUFFER:
    case OPEN_NEW_BUFFER_BACKGROUND:
        create_buffer(buffer.window,
                      buffer_creator(content_buffer,
                                     $load = load_spec,
                                     $configuration = buffer.configuration),
                      target);
    }
}

/**
 * Follow a link-like element by generating fake mouse events.
 */
function browser_follow_link_with_click(buffer, elem, x, y) {
    var doc = elem.ownerDocument;
    var view = doc.defaultView;

    var evt = doc.createEvent("MouseEvents");
    evt.initMouseEvent("mousedown", true, true, view, 1, x, y, 0, 0, /*ctrl*/ 0, /*event.altKey*/0,
                       /*event.shiftKey*/ 0, /*event.metaKey*/ 0, 0, null);
    elem.dispatchEvent(evt);

    evt.initMouseEvent("click", true, true, view, 1, x, y, 0, 0, /*ctrl*/ 0, /*event.altKey*/0,
                       /*event.shiftKey*/ 0, /*event.metaKey*/ 0, 0, null);
    elem.dispatchEvent(evt);
}

function element_get_url(elem) {
    var url = null;

    if (elem instanceof Ci.nsIDOMWindow)
        url = elem.location.href;

    else if (elem instanceof Ci.nsIDOMHTMLFrameElement ||
        elem instanceof Ci.nsIDOMHTMLIFrameElement)
        url = elem.contentWindow.location.href;

    else if (elem instanceof Ci.nsIDOMHTMLImageElement)
        url = elem.src;

    else if (elem instanceof Ci.nsIDOMHTMLAnchorElement ||
             elem instanceof Ci.nsIDOMHTMLAreaElement ||
             elem instanceof Ci.nsIDOMHTMLLinkElement) {
        if (elem.hasAttribute("href"))
            url = elem.href;
        else
            return null; // nothing can be done
    } else {
        var node = elem;
        while (node && !(node instanceof Ci.nsIDOMHTMLAnchorElement))
            node = node.parentNode;
        if (node && !node.hasAttribute("href"))
            node = null;
        if (!node) {
            // Try simple XLink
            node = elem;
            while (node) {
                if (node.nodeType == Ci.nsIDOMNode.ELEMENT_NODE) {
                    url = linkNode.getAttributeNS(XLINK_NS, "href");
                    break;
                }
                node = node.parentNode;
            }
            if (url)
                url = makeURLAbsolute(node.baseURI, url);
        } else
            url = node.href;
    }
    if (url && url.length == 0)
        url = null;
    return url;
}

function element_get_load_spec(elem) {
    var load_spec = null;


    if (elem instanceof Ci.nsIDOMWindow)
        load_spec = document_load_spec(elem.document);

    else if (elem instanceof Ci.nsIDOMHTMLFrameElement ||
             elem instanceof Ci.nsIDOMHTMLIFrameElement)
        load_spec = document_load_spec(elem.contentDocument);

    else {
        var url = null;

        if (elem instanceof Ci.nsIDOMHTMLAnchorElement ||
            elem instanceof Ci.nsIDOMHTMLAreaElement ||
            elem instanceof Ci.nsIDOMHTMLLinkElement) {
            if (!elem.hasAttribute("href"))
                return null; // nothing can be done, as no nesting within these elements is allowed
            url = elem.href;
        }
        else if (elem instanceof Ci.nsIDOMHTMLImageElement) {
            url = elem.src;
        }
        else {
            var node = elem;
            while (node && !(node instanceof Ci.nsIDOMHTMLAnchorElement))
                node = node.parentNode;
            if (node && !node.hasAttribute("href"))
                node = null;
            else
                url = node.href;
            if (!node) {
                // Try simple XLink
                node = elem;
                while (node) {
                    if (node.nodeType == Ci.nsIDOMNode.ELEMENT_NODE) {
                        url = linkNode.getAttributeNS(XLINK_NS, "href");
                        break;
                    }
                    node = node.parentNode;
                }
                if (url)
                    url = makeURLAbsolute(node.baseURI, url);
            }
        }
        if (url && url.length > 0) {
            var referrer = null;
            try {
                referrer = makeURL(elem.ownerDocument.location.href);
            } catch (e) {}
            load_spec = {url: url, referrer: referrer};
        }
    }
    return load_spec;
}

var hints_default_object_classes = {
    follow: "links",
    follow_top: "frames",
    focus: "frames",
    save: "links",
    copy: "links",
    view_source: "frames",
    bookmark: "frames",
    def: "links"
};

interactive_context.prototype.hints_object_class = function (action_name) {
    var cls =
        this._hints_object_class ||
        hints_default_object_classes[action_name] ||
        hints_default_object_classes["def"];
    return cls;
};

interactive_context.prototype.hints_xpath_expression = function (action_name) {
        var cls =
            this._hints_object_class ||
            hints_default_object_classes[action_name] ||
            hints_default_object_classes["def"];
        var db = hints_xpath_expressions[cls];
        return db[action_name] || db["def"];
};

function hints_object_class_selector(name) {
    return function (ctx, active_keymap, overlay_keymap) {
        ctx._hints_object_class = name;
        ctx.overlay_keymap = overlay_keymap || active_keymap;
    }
}

interactive_context.prototype.read_hinted_element_with_prompt = function(action, action_name, default_class, target)
{
    var object_class = this.hints_object_class(action);

    var prompt = action_name;
    if (target != null)
        prompt += TARGET_PROMPTS[target];
    if (object_class != default_class)
        prompt += " (" + object_class + ")";
    prompt += ":";
    
    var result = yield this.minibuffer.read_hinted_element(
        $buffer = this.buffer,
        $prompt = prompt,
        $object_class = object_class,
        $hint_xpath_expression = this.hints_xpath_expression(action));

    yield co_return(result);
}

interactive("follow", function (I) {
    var target = I.browse_target("follow");
    var element = yield I.read_hinted_element_with_prompt("follow", "Follow", "links", target);
    browser_element_follow(I.buffer, target, element);
});

interactive("follow-top", function (I) {
    var target = I.browse_target("follow-top");
    var element = yield I.read_hinted_element_with_prompt("follow_top", "Follow", "links", target);
    browser_element_follow(I.buffer, target, element);
});

interactive("focus", function (I) {
    var element = yield I.read_hinted_element_with_prompt("focus", "Focus");
    browser_element_focus(I.buffer, element);
});

interactive("save", function (I) {
    var element = yield I.read_hinted_element_with_prompt("save", "Save", "links");
    var url = element_get_url(element); // FIXME: use load spec instead
    var file = yield I.minibuffer.read_file_check_overwrite(
        $prompt = "Save as:",
        $initial_value = generate_save_path(url).path,
        $history = "save");
    browser_element_save(element, url, file);
});

function browser_element_copy(buffer, elem)
{
    var text = element_get_url(elem);
    if (text == null) {
        switch (elem.localName) {
        case "INPUT":
        case "TEXTAREA":
            text = elem.value;
            break;
        case "SELECT":
            if (elem.selectedIndex >= 0)
                text = elem.item(elem.selectedIndex).text;
            break;
        }
    }
    if (text == null)
        text = elem.textContent;
    writeToClipboard (text);
    buffer.window.minibuffer.message ("Copied: " + text);
}


interactive("copy", function (I) {
    var element = yield I.read_hinted_element_with_prompt("copy", "Copy", "links");
    browser_element_copy(I.buffer, element);
});

var view_source_use_external_editor = false, view_source_function = null;
function browser_element_view_source(buffer, target, elem)
{
    if (view_source_use_external_editor || view_source_function)
    {
        var load_spec = element_get_load_spec(elem);
        if (load_spec == null) {
            throw interactive_error("Element has no associated URL");
            return;
        }

        download_for_external_program
            (load_spec,
             function (file, is_temp_file) {
                if (view_source_use_external_editor)
                    open_file_with_external_editor(file, $temporary = is_temp_file);
                else
                    view_source_function(file, $temporary = is_temp_file);
             });
        return;
    }

    var win = null;
    var window = buffer.window;
    if (elem.localName) {
        switch (elem.localName.toLowerCase()) {
        case "frame": case "iframe":
            win = elem.contentWindow;
            break;
        case "math":
            view_mathml_source (window, charset, elem);
            return;
        default:
            throw new Error("Invalid browser element");
        }
    } else
        win = elem;
    win.focus();

    var url_s = win.location.href;
    if (url_s.substring (0,12) != "view-source:") {
        try {
            open_in_browser(buffer, target, "view-source:" + url_s);
        } catch(e) { dump_error(e); }
    } else {
        window.minibuffer.message ("Already viewing source");
    }
}

interactive("view-source", function (I) {
    var target = I.browse_target("follow");
    var element = yield I.read_hinted_element_with_prompt("view_source", "View source", "frames", target);
    browser_element_view_source(I.buffer, target, element);
});

function element_get_default_shell_command(elem) {
    var doc = null;
    if (elem instanceof Ci.nsIDOMWindow) {
        doc = elem.document;
    } else if (elem instanceof Ci.nsIDOMHTMLFrameElement || elem instanceof Ci.nsIDOMHTMLIFrameElement) {
        doc = elem.contentDocument;
    }
    var mime_type;
    if (doc != null) {
        mime_type = doc.contentType;
    } else {
        var url = element_get_url(elem);
        if (url == null)
            throw interactive_error("Unable to obtain URL from element");
        mime_type = mime_type_from_url(url);
        if (mime_type == null)
            mime_type = "application/octet-stream";
    }
    var handler = get_external_handler_for_mime_type(mime_type);
    return handler;
}
interactive("shell-command-on-url", function (I) {
    var cwd = I.cwd;
    var element = yield I.read_hinted_element_with_prompt("shell_command_url", "URL shell command target", "links");
    var url = element_get_url(elem);
    if (url == null)
        throw interactive_error("Unable to obtain URL from element");
    var cmd = yield I.minibuffer.read_shell_command(
        $cwd = cwd,
        $prompt = "Shell command for URL [" + cwd + "]:",
        $initial_value = element_get_default_shell_command(element));
    shell_command_with_argument(cwd, $argument = url, $command = cmd);
});

function browser_element_shell_command(buffer, elem, command) {
    var load_spec = element_get_load_spec(elem);
    if (load_spec == null) {
        throw interactive_error("Element has no associated URL");
        return;
    }
    download_for_external_program
        (load_spec,
         function (file, is_temp_file) {
            function cont() {
                if (is_temp_file)
                    file.remove(false);
            }
            shell_command_with_argument(
                buffer.cwd,
                $command = command,
                $argument = file.path,
                $callback = cont, $failure_callback = cont);
        });
}

interactive("shell-command-on-file", function (I) {
    var cwd = I.cwd;
    var element = yield I.read_hinted_element_with_prompt("shell_command", "Shell command target", "links");
    var cmd = yield I.minibuffer.read_shell_command(
        $cwd = cwd,
        $initial_value = element_get_default_shell_command(element));
    /* FIXME: specify cwd as well */
    browser_element_shell_command(I.buffer, element, cmd);
});

interactive("bookmark", function (I) {
    var element = yield I.read_hinted_element_with_prompt("bookmark", "Bookmark", "frames");
    var info = get_element_bookmark_info(element);
    var title = yield I.minibuffer.read($prompt = "Bookmark with title:", $initial_value = x[1]);
    var url = info[1];
    add_bookmark(url, title);
    I.minibuffer.message("Added bookmark: " + url + " - " + title);
});
