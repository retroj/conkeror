require("hints.js");

/**
 * This is a simple wrapper function that sets focus to elem, and
 * bypasses the automatic focus prevention system, which might
 * otherwise prevent this from happening.
 */
function browser_set_element_focus(buffer, elem, prevent_scroll) {
    buffer.last_user_input_received = Date.now();
    if (prevent_scroll)
        set_focus_no_scroll(buffer.frame, elem);
    else
        elem.focus();
}

function browser_element_focus(buffer, elem)
{
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
    case OPEN_NEW_WINDOW:
        make_frame(load_spec, $cwd = buffer.cwd);
        return;

    case FOLLOW_CURRENT_FRAME:
        if (current_frame == null) {
            if (elem.ownerDocument)
                current_frame = elem.ownerDocument.defaultView;
            else
                current_frame = buffer.content_window;
        }
        if (current_frame != buffer.content_window) {
            target_obj = get_web_navigation_for_window(current_frame);
            apply_load_spec(target_obj, load_spec);
            break;
        }
    case FOLLOW_DEFAULT:
    case FOLLOW_TOP_FRAME:
    case OPEN_CURRENT_BUFFER:
        buffer.load(load_spec);
        break;
    case OPEN_NEW_BUFFER:
        target_obj = new browser_buffer(buffer.frame, $context = buffer);
        target_obj.load(load_spec);
        buffer.frame.buffers.current = target_obj;
        break;
    case OPEN_NEW_BUFFER_BACKGROUND:
        target_obj = new browser_buffer(buffer.frame, $context = buffer);
        target_obj.load(load_spec);
        break;
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
    def: "links"
};

I.hints_object_class = interactive_method(
    $sync = function (ctx, action_name) {
        var cls =
            ctx.hints_object_class ||
            hints_default_object_classes[action_name] ||
            hints_default_object_classes["def"];
        return cls;
    }
    );

I.hints_xpath_expression = interactive_method(
    $sync = function (ctx, action_name) {
        var cls =
            ctx.hints_object_class ||
            hints_default_object_classes[action_name] ||
            hints_default_object_classes["def"];
        var db = hints_xpath_expressions[cls];
        return db[action_name] || db["def"];
    }
    );

function hints_object_class_selector(name) {
    return function (ctx, active_keymap, overlay_keymap) {
        ctx.hints_object_class = name;
    }
}

function hinted_element_with_prompt(action, action_name, default_class, target_var)
{
    var prompt;
    if (target_var != null) {
        prompt = I.bind(
            function (cls,target) {
                var base = action_name + TARGET_PROMPTS[target];
                if (cls != default_class)
                    base += " (" + cls + ")";
                return base + ":";
            },
            $$9 = I.hints_object_class(action),
            target_var);
    } else {
        prompt = I.bind(
            function (cls) {
                var base = (cls == default_class) ?
                    action_name :
                    action_name + " (" + cls + ")";
                return base + ":";
            },
            $$9 = I.hints_object_class(action));
    }
    return I.hinted_element($prompt = prompt,
                            $object_class = $$9,
                            $hint_xpath_expression = I.hints_xpath_expression(action));
}

interactive("browser-element-follow", browser_element_follow,
            I.current_buffer,
            $$ = I.browse_target("follow"),
            hinted_element_with_prompt("follow", "Follow", "links", $$));

interactive("browser-element-follow-top", browser_element_follow,
            I.current_buffer,
            $$ = I.browse_target("follow-top"),
            hinted_element_with_prompt("follow_top", "Follow", "frames", $$));

interactive("browser-element-focus", browser_element_focus,
            I.current_buffer,
            hinted_element_with_prompt("focus", "Focus", null, null));

interactive("browser-element-save", browser_element_save,
            $$ = hinted_element_with_prompt("save", "Save", "links", null),
            $$1 = I.bind(element_get_url, $$),
            I.F($prompt = "Save as:",
                $initial_value = I.bind(function (u) { return generate_save_path(u).path; }, $$1),
                $history = "save"));

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
    buffer.frame.minibuffer.message ("Copied: " + text);
}


interactive("browser-element-copy", browser_element_copy,
            I.current_buffer,
            hinted_element_with_prompt("copy", "Copy", "links", null));

var view_source_external_editor = null, view_source_function = null;
function browser_element_view_source(buffer, target, elem, charset)
{
    var win = null;
    var frame = buffer.frame;
    if (elem.localName) {
        switch (elem.localName.toLowerCase()) {
        case "frame": case "iframe":
            win = elem.contentWindow;
            break;
        case "math":
            view_mathml_source (frame, charset, elem);
            return;
        default:
        if (!matched)
            throw new Error("Invalid browser element");
        }
    } else
        win = elem;
    win.focus();
    if (view_source_external_editor || view_source_function)
    {
        download_for_external_program
            (null, win.document, null,
             function (file, is_temp_file) {
                 if (view_source_external_editor)
                 {
                     function cont() {
                         if (is_temp_file)
                             file.remove(false /* not recursive */);
                     }
                     spawn_process(view_source_external_editor, [file.path], cont, cont);
                 } else
                 {
                     view_source_function(file, is_temp_file);
                 }
             });
        return;
    }
    var url_s = win.location.href;
    if (url_s.substring (0,12) != "view-source:") {
        try {
            open_in_browser(buffer, target, "view-source:" + url_s);
        } catch(e) { dump_error(e); }
    } else {
        frame.minibuffer.message ("Already viewing source");
    }
}

interactive("browser-element-view-source", browser_element_view_source,
            I.current_buffer(browser_buffer),
            $$ = I.browse_target("follow"),
            hinted_element_with_prompt("view_source", "View source", "frames", $$),
            I.content_charset);

define_keywords("$command", "$argument", "$callback");
function shell_command_with_argument(cwd) {
    keywords(arguments);
    var cmdline = arguments.$command;
    var cont = arguments.$callback;
    var argument = arguments.$argument;
    if (!cmdline.match("{}")) {
        cmdline = cmdline + " \"" + shell_quote(argument) + "\"";
    } else {
        cmdline = cmdline.replace("{}", "\"" + shell_quote(argument) + "\"");
    }
    shell_command(cwd, cmdline, cont, cont /*, function (exit_code) {
            if (exit_code == 0)
                buffer.frame.minibuffer.message("Shell command exited normally.");
            else
                buffer.frame.minibuffer.message("Shell command exited with status " + exit_code + ".");
                }*/);
}

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

interactive("browser-element-shell-command-on-url",
            shell_command_with_argument,
            $$1 = I.cwd,
            $argument = I.bind(function (elem) {
                    var url = element_get_url(elem);
                    if (url == null)
                        throw interactive_error("Unable to obtain URL from element");
                    return url;
                }, $$ = hinted_element_with_prompt("shell-command-url",
                                                   "URL shell command target", "links")),
            $command = I.shell_command(
                $prompt = I.bind(function (cwd) {
                        return "Shell command for URL [" + cwd + "]:";
                    }, $$1),
                $initial_value = I.bind(element_get_default_shell_command, $$)));

function browser_element_shell_command(buffer, elem, command) {
    var doc = null;
    var url = null;
    if (elem instanceof Ci.nsIDOMWindow) {
        doc = elem.document;
    } else if (elem instanceof Ci.nsIDOMHTMLFrameElement || elem instanceof Ci.nsIDOMHTMLIFrameElement) {
        doc = elem.contentDocument;
    }
    if (doc == null) {
        var url = element_get_url(elem);
        if (url == null)
            throw interactive_error("Unable to obtain URL from element");
    }
    download_for_external_program
        (url, doc, null,
         function (file, is_temp_file) {
            shell_command_with_argument(
                buffer.cwd,
                $command = command,
                $argument = file.path,
                $callback = function () {
                    if (is_temp_file)
                        file.remove(false);
                });
        });
}

interactive("browser-element-shell-command",
            browser_element_shell_command,
            I.current_buffer(browser_buffer),
            $$ = hinted_element_with_prompt("shell-command-url",
                                            "Shell command target", "links"),
            I.shell_command(
                $prompt = I.bind(function (cwd) {
                        return "Shell command [" + cwd + "]:";
                    }, I.cwd),
                $initial_value = I.bind(element_get_default_shell_command, $$)));
