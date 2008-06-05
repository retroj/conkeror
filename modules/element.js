/**
 * (C) Copyright 2007-2008 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Portions of this file are derived from Vimperator,
 * (C) Copyright 2006-2007 Martin Stubenschrott.
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("hints.js");
require("save.js");
require("mime-type-override.js");
require("minibuffer-read-mime-type.js");

var browser_object_classes = {};

/**
 * handler is a coroutine called as: handler(buffer, prompt)
 */
define_keywords("$doc", "$action", "$label", "$handler", "$xpath_expression");
function define_browser_object_class(name) {
    keywords(arguments, $xpath_expression = undefined);
    var handler = arguments.$handler;
    let xpath_expression = arguments.$xpath_expression;
    if (handler === undefined && xpath_expression != undefined) {
        handler = function (buf, prompt) {
            var result = yield buf.window.minibuffer.read_hinted_element(
                $buffer = buf,
                $prompt = prompt,
                $hint_xpath_expression = xpath_expression);
            yield co_return(result);
        };
    }
    var base_obj = browser_object_classes[name];
    if (base_obj == null)
        base_obj = browser_object_classes[name] = {};
    var obj;
    if (arguments.$action) {
        name = name + "/" + arguments.$action;
        obj = browser_object_classes[name];
        if (obj == null)
            obj = browser_object_classes[name] = {__proto__: base_obj};
    } else
        obj = base_obj;
    if (arguments.$label !== undefined)
        obj.label = arguments.$label;
    if (arguments.$doc !== undefined)
        obj.doc = arguments.$doc;
    if (handler !== undefined)
        obj.handler = handler;
}

define_browser_object_class("images",
                            $label = "image",
                            $xpath_expression = "//img | //xhtml:img");

define_browser_object_class("frames", $label = "frame", $handler = function (buf, prompt) {
    check_buffer(buf, content_buffer);
    var doc = buf.document;
    if (doc.getElementsByTagName("frame").length == 0 &&
        doc.getElementsByTagName("iframe").length == 0)
    {
        // only one frame (the top-level one), no need to use the hints system
        yield co_return(buf.top_frame);
    }

    var result = yield buf.window.minibuffer.read_hinted_element(
        $buffer = buf,
        $prompt = prompt,
        $hint_xpath_expression = "//iframe | //frame | //xhtml:iframe | //xhtml:frame");
    yield co_return(result);
});

define_browser_object_class(
    "links", $label = "link",
    $xpath_expression =
        "//*[@onclick or @onmouseover or @onmousedown or @onmouseup or @oncommand or " +
        "@role='link'] | " +
        "//input[not(@type='hidden')] | //a | //area | //iframe | //textarea | //button | //select | //label | " +
        "//xhtml:*[@onclick or @onmouseover or @onmousedown or @onmouseup or @oncommand] | " +
        "//xhtml:input[not(@type='hidden')] | //xhtml:a | //xhtml:area | //xhtml:iframe | //xhtml:textarea | " +
        "//xhtml:button | //xhtml:select");

define_browser_object_class("mathml", $label = "MathML element", $xpath_expression = "//m:math");

define_browser_object_class("top", $handler = function (buf, prompt) { yield co_return(buf.top_frame); });

define_browser_object_class("url", $handler = function (buf, prompt) {
                                check_buffer (buf, content_buffer);
                                var result = yield buf.window.minibuffer.read_url ($prompt = prompt);
                                yield co_return (result);
                            });

define_variable(
    "default_browser_object_classes",
    {
        follow: "links",
        follow_top: "frames",
        focus: "frames",
        save: "links",
        copy: "links",
        view_source: "frames",
        bookmark: "frames",
        save_page: "frames",
        save_page_complete: "top",
        save_page_as_text: "frames",
        default: "links"
    },
    "Specifies the default object class for each operation.\n" +
        "This variable should be an object literal with string-valued properties that specify one of the defined browser object classes.  If a property named after the operation is not present, the \"default\" property is consulted instead.");

interactive_context.prototype.browser_object_class = function (action_name) {
    var cls =
        this._browser_object_class ||
        this.get("default_browser_object_classes")[action_name] ||
        this.get("default_browser_object_classes")["default"];
    return cls;
};

function browser_object_class_selector(name) {
    return function (ctx, active_keymap, overlay_keymap, top_keymap) {
        ctx._browser_object_class = name;
        ctx.overlay_keymap = top_keymap;
    }
}

function lookup_browser_object_class(class_name, action) {
    var obj;
    if (action != null) {
        obj = browser_object_classes[class_name + "/" + action];
        if (obj)
            return obj;
    }
    return browser_object_classes[class_name];
}

interactive_context.prototype.read_browser_object = function(action, action_name, target)
{
    var object_class_name = this.browser_object_class(action);
    var object_class = lookup_browser_object_class(object_class_name, action);

    var prompt = action_name;
    var label = object_class.label || object_class_name;
    if (target != null)
        prompt += TARGET_PROMPTS[target];
    prompt += " (select " + label + "):";

    var result = yield object_class.handler.call(null, this.buffer, prompt);
    yield co_return(result);
}


function is_dom_node_or_window(elem) {
    if (elem instanceof Ci.nsIDOMNode)
        return true;
    if (elem instanceof Ci.nsIDOMWindow)
        return true;
    return false;
}

/**
 * This is a simple wrapper function that sets focus to elem, and
 * bypasses the automatic focus prevention system, which might
 * otherwise prevent this from happening.
 */
function browser_set_element_focus(buffer, elem, prevent_scroll) {
    if (!is_dom_node_or_window(elem))
        return;

    buffer.last_user_input_received = Date.now();
    if (prevent_scroll)
        set_focus_no_scroll(buffer.window, elem);
    else
        elem.focus();
}

function browser_element_focus(buffer, elem)
{
    if (!is_dom_node_or_window(elem))
        return;

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

    var no_click = (is_load_spec(elem) ||
                    (elem instanceof Ci.nsIDOMWindow) ||
                    (elem instanceof Ci.nsIDOMHTMLFrameElement) ||
                    (elem instanceof Ci.nsIDOMHTMLIFrameElement) ||
                    (elem instanceof Ci.nsIDOMHTMLLinkElement) ||
                    (elem instanceof Ci.nsIDOMHTMLImageElement &&
                     !elem.hasAttribute("onmousedown") && !elem.hasAttribute("onclick")));

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

    var spec = element_get_load_spec(elem);
    if (spec == null) {
        throw interactive_error("Element has no associated URL");
        return;
    }

    if (load_spec_uri_string(spec).match(/^\s*javascript:/)) {
        // This URL won't work
        throw interactive_error("Can't load javascript URL");
    }

    switch (target) {
    case FOLLOW_CURRENT_FRAME:
        var current_frame = load_spec_source_frame(spec);
        if (current_frame && current_frame != buffer.top_frame) {
            var target_obj = get_web_navigation_for_frame(current_frame);
            apply_load_spec(target_obj, spec);
            break;
        }
    case FOLLOW_DEFAULT:
    case FOLLOW_TOP_FRAME:
    case OPEN_CURRENT_BUFFER:
        buffer.load(spec);
        break;
    case OPEN_NEW_WINDOW:
    case OPEN_NEW_BUFFER:
    case OPEN_NEW_BUFFER_BACKGROUND:
        create_buffer(buffer.window,
                      buffer_creator(content_buffer,
                                     $load = spec,
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

function element_get_load_spec(elem) {

    if (is_load_spec(elem))
        return elem;

    var spec = null;

    if (elem instanceof Ci.nsIDOMWindow)
        spec = load_spec({document: elem.document});

    else if (elem instanceof Ci.nsIDOMHTMLFrameElement ||
             elem instanceof Ci.nsIDOMHTMLIFrameElement)
        spec = load_spec({document: elem.contentDocument});

    else {
        var url = null;
        var title = null;

        if (elem instanceof Ci.nsIDOMHTMLAnchorElement ||
            elem instanceof Ci.nsIDOMHTMLAreaElement ||
            elem instanceof Ci.nsIDOMHTMLLinkElement) {
            if (!elem.hasAttribute("href"))
                return null; // nothing can be done, as no nesting within these elements is allowed
            url = elem.href;
            title = elem.title || elem.textContent;
        }
        else if (elem instanceof Ci.nsIDOMHTMLImageElement) {
            url = elem.src;
            title = elem.title || elem.alt;
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
                title = node.title || node.textContent;
            }
        }
        if (url && url.length > 0) {
            if (title && title.length == 0)
                title = null;
            spec = load_spec({uri: url, source_frame: elem.ownerDocument.defaultView, title: title});
        }
    }
    return spec;
}

interactive("follow", function (I) {
    var target = I.browse_target("follow");
    var element = yield I.read_browser_object("follow", "Follow", target);
    browser_element_follow(I.buffer, target, element);
});

interactive("follow-top", function (I) {
    var target = I.browse_target("follow-top");
    var element = yield I.read_browser_object("follow_top", "Follow", target);
    browser_element_follow(I.buffer, target, element);
});

interactive("focus", function (I) {
    var element = yield I.read_browser_object("focus", "Focus");
    browser_element_focus(I.buffer, element);
});

function element_get_load_target_label(element) {
    if (element instanceof Ci.nsIDOMWindow)
        return "page";
    if (element instanceof Ci.nsIDOMHTMLFrameElement)
        return "frame";
    if (element instanceof Ci.nsIDOMHTMLIFrameElement)
        return "iframe";
    return null;
}

function element_get_operation_label(element, op_name, suffix) {
    var target_label = element_get_load_target_label(element);
    if (target_label != null)
        target_label = " " + target_label;
    else
        target_label = "";

    if (suffix != null)
        suffix = " " + suffix;
    else
        suffix = "";

    return op_name + target_label + suffix + ":";
}

interactive("save", function (I) {
    var element = yield I.read_browser_object("save", "Save");

    var spec = element_get_load_spec(element);
    if (spec == null)
        throw interactive_error("Element has no associated URI");

    var panel;
    panel = create_info_panel(I.window, "download-panel",
                              [["downloading",
                                element_get_operation_label(element, "Saving"),
                                load_spec_uri_string(spec)],
                               ["mime-type", "Mime type:", load_spec_mime_type(spec)]]);

    try {
        var file = yield I.minibuffer.read_file_check_overwrite(
            $prompt = "Save as:",
            $initial_value = suggest_save_path_from_file_name(suggest_file_name(spec), I.buffer),
            $history = "save");

    } finally {
        panel.destroy();
    }

    save_uri(spec, file,
             $buffer = I.buffer,
             $use_cache = false);
});

function browser_element_copy(buffer, elem)
{
    var spec = element_get_load_spec(elem);
    var text = null;
    if (spec)
        text = load_spec_uri_string(spec);
    else  {
        if (!(elem instanceof Ci.nsIDOMNode))
            throw interactive_error("Element has no associated text to copy.");
        switch (elem.localName) {
        case "INPUT":
        case "TEXTAREA":
            text = elem.value;
            break;
        case "SELECT":
            if (elem.selectedIndex >= 0)
                text = elem.item(elem.selectedIndex).text;
            break;
        default:
            text = elem.textContent;
            break;
        }
    }
    writeToClipboard (text);
    buffer.window.minibuffer.message ("Copied: " + text);
}


interactive("copy", function (I) {
    var element = yield I.read_browser_object("copy", "Copy");
    browser_element_copy(I.buffer, element);
});

var view_source_use_external_editor = false, view_source_function = null;
function browser_element_view_source(buffer, target, elem)
{
    if (view_source_use_external_editor || view_source_function)
    {
        var spec = element_get_load_spec(elem);
        if (spec == null) {
            throw interactive_error("Element has no associated URL");
            return;
        }

        let [file, temp] = yield download_as_temporary(spec,
                                                       $buffer = buffer,
                                                       $action = "View source");
        if (view_source_use_external_editor)
            yield open_file_with_external_editor(file, $temporary = temp);
        else
            yield view_source_function(file, $temporary = temp);
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
    var element = yield I.read_browser_object("view_source", "View source", target);
    yield browser_element_view_source(I.buffer, target, element);
});

interactive("shell-command-on-url", function (I) {
    var cwd = I.cwd;
    var element = yield I.read_browser_object("shell_command_url", "URL shell command");
    var spec = element_get_load_spec(element);
    if (spec == null)
        throw interactive_error("Unable to obtain URI from element");

    var uri = load_spec_uri_string(spec);

    var panel;
    panel = create_info_panel(I.window, "download-panel",
                              [["downloading",
                                element_get_operation_label(element, "Running on", "URI"),
                                load_spec_uri_string(spec)],
                               ["mime-type", "Mime type:", load_spec_mime_type(spec)]]);

    try {
        var cmd = yield I.minibuffer.read_shell_command(
            $cwd = cwd,
            $initial_value = load_spec_default_shell_command(spec));
    } finally {
        panel.destroy();
    }

    shell_command_with_argument_blind(cmd, uri, $cwd = cwd);
});

function browser_element_shell_command(buffer, elem, command) {
    var spec = element_get_load_spec(elem);
    if (spec == null) {
        throw interactive_error("Element has no associated URL");
        return;
    }
    yield download_as_temporary(spec,
                                $buffer = buffer,
                                $shell_command = command,
                                $shell_command_cwd = buffer.cwd);
}

interactive("shell-command-on-file", function (I) {
    var cwd = I.cwd;
    var element = yield I.read_browser_object("shell_command", "Shell command");

    var spec = element_get_load_spec(element);
    if (spec == null)
        throw interactive_error("Unable to obtain URI from element");

    var uri = load_spec_uri_string(spec);

    var panel;
    panel = create_info_panel(I.window, "download-panel",
                              [["downloading",
                                element_get_operation_label(element, "Running on"),
                                load_spec_uri_string(spec)],
                               ["mime-type", "Mime type:", load_spec_mime_type(spec)]]);

    try {

        var cmd = yield I.minibuffer.read_shell_command(
            $cwd = cwd,
            $initial_value = load_spec_default_shell_command(spec));
    } finally {
        panel.destroy();
    }

    /* FIXME: specify cwd as well */
    yield browser_element_shell_command(I.buffer, element, cmd);
});

interactive("bookmark", function (I) {
    var element = yield I.read_browser_object("bookmark", "Bookmark");
    var spec = element_get_load_spec(element);
    if (!spec)
        throw interactive_error("Element has no associated URI");
    var uri_string = load_spec_uri_string(spec);
    var panel;
    panel = create_info_panel(I.window, "bookmark-panel",
                              [["bookmarking",
                                element_get_operation_label(element, "Bookmarking"),
                                uri_string]]);
    try {
        var title = yield I.minibuffer.read($prompt = "Bookmark with title:", $initial_value = load_spec_title(spec) || "");
    } finally {
        panel.destroy();
    }
    add_bookmark(uri_string, title);
    I.minibuffer.message("Added bookmark: " + uri_string + " - " + title);
});

interactive("save-page", function (I) {
    check_buffer(I.buffer, content_buffer);
    var element = yield I.read_browser_object("save_page", "Save page");
    var spec = element_get_load_spec(element);
    if (!spec || !load_spec_document(spec))
        throw interactive_error("Element is not associated with a document.");
    var suggested_path = suggest_save_path_from_file_name(suggest_file_name(spec), I.buffer);

    var panel;
    panel = create_info_panel(I.window, "download-panel",
                              [["downloading",
                                element_get_operation_label(element, "Saving"),
                                load_spec_uri_string(spec)],
                               ["mime-type", "Mime type:", load_spec_mime_type(spec)]]);

    try {
        var file = yield I.minibuffer.read_file_check_overwrite(
            $prompt = "Save page as:",
            $history = "save",
            $initial_value = suggested_path);
    } finally {
        panel.destroy();
    }

    save_uri(spec, file, $buffer = I.buffer);
});

interactive("save-page-as-text", function (I) {
    check_buffer(I.buffer, content_buffer);
    var element = yield I.read_browser_object("save_page_as_text", "Save page as text");
    var spec = element_get_load_spec(element);
    var doc;
    if (!spec || !(doc = load_spec_document(spec)))
        throw interactive_error("Element is not associated with a document.");
    var suggested_path = suggest_save_path_from_file_name(suggest_file_name(spec, "txt"), I.buffer);

    var panel;
    panel = create_info_panel(I.window, "download-panel",
                              [["downloading",
                                element_get_operation_label(element, "Saving", "as text"),
                                load_spec_uri_string(spec)],
                               ["mime-type", "Mime type:", load_spec_mime_type(spec)]]);

    try {
        var file = yield I.minibuffer.read_file_check_overwrite(
            $prompt = "Save page as text:",
            $history = "save",
            $initial_value = suggested_path);
    } finally {
        panel.destroy();
    }

    save_document_as_text(doc, file, $buffer = I.buffer);
});

interactive("save-page-complete", function (I) {
    check_buffer(I.buffer, content_buffer);
    var element = yield I.read_browser_object("save_page_complete", "Save page complete");
    var spec = element_get_load_spec(element);
    var doc;
    if (!spec || !(doc = load_spec_document(spec)))
        throw interactive_error("Element is not associated with a document.");
    var suggested_path = suggest_save_path_from_file_name(suggest_file_name(spec), I.buffer);

    var panel;
    panel = create_info_panel(I.window, "download-panel",
                              [["downloading",
                                element_get_operation_label(element, "Saving complete"),
                                load_spec_uri_string(spec)],
                               ["mime-type", "Mime type:", load_spec_mime_type(spec)]]);

    try {
        var file = yield I.minibuffer.read_file_check_overwrite(
            $prompt = "Save page complete:",
            $history = "save",
            $initial_value = suggested_path);
        // FIXME: use proper read function
        var dir = yield I.minibuffer.read_file(
            $prompt = "Data Directory:",
            $history = "save",
            $initial_value = file.path + ".support");
    } finally {
        panel.destroy();
    }

    save_document_complete(doc, file, dir, $buffer = I.buffer);
});

default_browse_targets["view-as-mime-type"] = [FOLLOW_CURRENT_FRAME, OPEN_CURRENT_BUFFER,
                                               OPEN_NEW_BUFFER, OPEN_NEW_WINDOW];
interactive("view-as-mime-type",
            "Display a browser object in the browser using the specified MIME type.",
            function (I) {
                var element = yield I.read_browser_object("view_as_mime_type", "View in browser as mime type");
                var spec = element_get_load_spec(element);

                var target = I.browse_target("view-as-mime-type");

                if (!spec)
                    throw interactive_error("Element is not associated with a URI");

                if (!can_override_mime_type_for_uri(load_spec_uri(spec)))
                    throw interactive_error("Overriding the MIME type is not currently supported for non-HTTP URLs.");

                var panel;

                var mime_type = load_spec_mime_type(spec);
                panel = create_info_panel(I.window, "download-panel",
                                          [["downloading",
                                            element_get_operation_label(element, "View in browser"),
                                            load_spec_uri_string(spec)],
                                           ["mime-type", "Mime type:", load_spec_mime_type(spec)]]);


                try {
                    let suggested_type = mime_type;
                    if (gecko_viewable_mime_type_list.indexOf(suggested_type) == -1)
                        suggested_type = "text/plain";
                    mime_type = yield I.minibuffer.read_gecko_viewable_mime_type(
                        $prompt = "View internally as",
                        $initial_value = suggested_type,
                        $select);
                    override_mime_type_for_next_load(load_spec_uri(spec), mime_type);
                    browser_element_follow(I.buffer, target, spec);
                } finally {
                    panel.destroy();
                }
            });
