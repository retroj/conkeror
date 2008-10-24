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
function browser_object_class (name, label, doc, handler) {
    this.name = name;
    this.handler = handler;
    if (doc) this.doc = doc;
    if (label) this.label = label;
}

function define_browser_object_class (name, label, doc, handler) {
    var varname = 'browser_object_'+name.replace('-','_');
    var ob = conkeror[varname] =
        new browser_object_class (name, label, doc, handler);
    interactive(
        "browser-object-"+name,
        "A prefix command to specify that the following command operate "+
            "on objects of type: "+name+".",
        function (ctx) { ctx._browser_object_class = ob; },
        $prefix = true);
    return ob;
}

function xpath_browser_object_handler (xpath_expression) {
    return function (buf, prompt) {
        var result = yield buf.window.minibuffer.read_hinted_element(
            $buffer = buf,
            $prompt = prompt,
            $hint_xpath_expression = xpath_expression);
        yield co_return(result);
    };
}

define_browser_object_class(
    "images", "image", null,
    xpath_browser_object_handler ("//img | //xhtml:img"));

define_browser_object_class(
    "frames","frame", null,
    function (buf, prompt) {
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
    "links", "link", null,
    xpath_browser_object_handler (
        "//*[@onclick or @onmouseover or @onmousedown or @onmouseup or @oncommand or " +
        "@role='link'] | " +
        "//input[not(@type='hidden')] | //a | //area | //iframe | //textarea | //button | //select | " +
        "//xhtml:*[@onclick or @onmouseover or @onmousedown or @onmouseup or @oncommand] | " +
        "//xhtml:input[not(@type='hidden')] | //xhtml:a | //xhtml:area | //xhtml:iframe | //xhtml:textarea | " +
        "//xhtml:button | //xhtml:select"));

define_browser_object_class(
    "mathml", "MathML element", null,
    xpath_browser_object_handler ("//m:math"));

define_browser_object_class(
    "top", null, null,
    function (buf, prompt) { yield co_return(buf.top_frame); });

define_browser_object_class(
    "url", null, null,
    function (buf, prompt) {
        check_buffer (buf, content_buffer);
        var result = yield buf.window.minibuffer.read_url ($prompt = prompt);
        yield co_return (result);
    });

define_browser_object_class(
    "alt", "Image Alt-text", null,
    function (buf, prompt) {
        var result = yield buf.window.minibuffer.read_hinted_element(
            $buffer = buf,
            $prompt = prompt,
            $hint_xpath_expression = "//img[@alt]");
        yield (co_return (result.alt));
    });

define_browser_object_class(
    "title", "Element Title", null,
    function (buf, prompt) {
        var result = yield buf.window.minibuffer.read_hinted_element(
            $buffer = buf,
            $prompt = prompt,
            $hint_xpath_expression = "//*[@title]");
        yield (co_return (result.title));
    });

define_browser_object_class(
    "title-or-alt", "Element Title or Alt-text", null,
    function (buf, prompt) {
        var result = yield buf.window.minibuffer.read_hinted_element(
            $buffer = buf,
            $prompt = prompt,
            $hint_xpath_expression = "//img[@alt] | //*[@title]");
        yield (co_return (result.title ? result.title : result.alt));
    });


/* browser object predicates
 */
function browser_object_any (o) { return true; }


interactive_context.prototype.read_browser_object = function(action, target)
{
    var browser_object = this.browser_object; //default
    // literals cannot be overridden
    if (! (browser_object instanceof browser_object_class))
        yield co_return(browser_object);

    var object_class = this._browser_object_class; //override
    if (! object_class)
        object_class = browser_object;
    var prompt = action.split(/-|_/).join(" ");
    prompt = prompt[0].toUpperCase() + prompt.substring(1);
    if (target != null)
        prompt += TARGET_PROMPTS[target];
    if (object_class.label)
        prompt += " (select " + object_class.label + ")";
    prompt += ":";

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

function browser_object_follow(buffer, target, elem)
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

    if (!(buffer instanceof content_buffer) &&
        (target == FOLLOW_CURRENT_FRAME ||
         target == FOLLOW_DEFAULT ||
         target == FOLLOW_TOP_FRAME ||
         target == OPEN_CURRENT_BUFFER))
        target = OPEN_NEW_BUFFER;

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


function follow (I) {
    //dumpln(dump_obj(I._browser_object_class));
    var target = I.browse_target("follow");
    var element = yield I.read_browser_object(I.command, target);
    // XXX: to follow in the current buffer requires that the current
    // buffer be a content_buffer.  this is perhaps not the best place
    // for this check, because FOLLOW_DEFAULT could signify new buffer
    // or new window.
    check_buffer (I.buffer, content_buffer);
    browser_object_follow(I.buffer, target, element);
}

function follow_new_buffer (I) {
    var target = I.browse_target("find-url-new-buffer");
    var element = yield I.read_browser_object(I.command, target);
    browser_object_follow(I.buffer, target, element);
}

function follow_new_window (I) {
    var target = I.browse_target("find-url-new-window");
    var element = yield I.read_browser_object(I.command, target);
    browser_object_follow(I.buffer, target, element);
}

function follow_top (I) {
    var target = I.browse_target("follow-top");
    var element = yield I.read_browser_object(I.command, target);
    // XXX: to follow in the current buffer requires that the current
    // buffer be a content_buffer.  this is perhaps not the best place
    // for this check, because FOLLOW_DEFAULT could signify new buffer
    // or new window.
    check_buffer (I.buffer, content_buffer);
    browser_object_follow(I.buffer, target, element);
}

function follow_current_frame (I) {
    var target = FOLLOW_CURRENT_FRAME; //XXX: what does this target mean?
    var element = yield I.read_browser_object(I.command, target);
    // XXX: to follow in the current buffer requires that the current
    // buffer be a content_buffer.  this is perhaps not the best place
    // for this check, because FOLLOW_DEFAULT could signify new buffer
    // or new window.
    check_buffer (I.buffer, content_buffer);
    browser_object_follow(I.buffer, target, element);
}


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
    browser_set_element_focus(buffer, elem);
    writeToClipboard (text);
    buffer.window.minibuffer.message ("Copied: " + text);
}


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
            browser_object_follow(buffer, target, "view-source:" + url_s);
        } catch(e) { dump_error(e); }
    } else {
        window.minibuffer.message ("Already viewing source");
    }
}


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

