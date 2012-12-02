/**
 * (C) Copyright 2007-2009 John J. Foerch
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
 * browser_object_class
 *
 *   In normal cases, make a new browser_object_class with the function,
 * `define_browser_object_class'.
 *
 * name: See note on `define_browser_object_class'.
 *
 * doc: a docstring
 *
 * handler: a coroutine called as: handler(I, prompt).  `I' is a normal
 *          interactive context.  `prompt' is there to pass along as the
 *          $prompt of various minibuffer read procedures, if needed.
 *
 * $hint: short string (usually verb and noun) to describe the UI
 *        of the browser object class to the user.  Only used by
 *        browser object classes which make use of the minibuffer.
 */
define_keywords("$hint");
function browser_object_class (name, doc, handler) {
    keywords(arguments);
    this.name = name;
    this.handler = handler;
    this.doc = doc;
    this.hint = arguments.$hint;
}

/**
 * define_browser_object_class
 *
 *   In normal cases, make a new browser_object_class with the function,
 * `define_browser_object_class'.
 *
 * name: the name of the browser object class.  multiword names should be
 *       hyphenated.  From this name, a variable browser_object_NAME and
 *       an interactive command browser-object-NAME will be generated.
 *
 *   Other arguments are as for `browser_object_class'.
 */
// keywords: $hint
function define_browser_object_class (name, doc, handler) {
    keywords(arguments);
    var varname = 'browser_object_'+name.replace('-','_','g');
    var ob = conkeror[varname] =
        new browser_object_class(name, doc, handler,
                                 forward_keywords(arguments));
    interactive("browser-object-"+name,
        "A prefix command to specify that the following command operate "+
        "on objects of type: "+name+".",
        function (I) { I.browser_object = ob; },
        $prefix = true);
    return ob;
}

/**
 * xpath_browser_object_handler
 *
 *   This generates a function of the type needed for a handler of a
 * browser object class.  The handler uses `read_hinted_element' of
 * hints.js to let the user pick a DOM node from those matched by
 * `xpath_expression'.
 */
function xpath_browser_object_handler (xpath_expression) {
    return function (I, prompt) {
        var result = yield I.buffer.window.minibuffer.read_hinted_element(
            $buffer = I.buffer,
            $prompt = prompt,
            $hint_xpath_expression = xpath_expression);
        yield co_return(result);
    };
}

define_browser_object_class("images",
    "Browser object class for selecting an html:img via hinting.",
    xpath_browser_object_handler("//img | //xhtml:img"),
    $hint = "select image");

define_browser_object_class("frames",
    "Browser object class for selecting a frame or iframe via hinting.",
    function (I, prompt) {
        var doc = I.buffer.document;
        // Check for any frames or visible iframes
        var skip_hints = true;
        if (doc.getElementsByTagName("frame").length > 0)
            skip_hints = false;
        else {
            let topwin = I.buffer.top_frame;
            let iframes = doc.getElementsByTagName("iframe");
            for (var i = 0, nframes = iframes.length; i < nframes; i++) {
                let style = topwin.getComputedStyle(iframes[i], "");
                if (style.display == "none" || style.visibility == "hidden")
                    continue;
                skip_hints = false;
                break;
            }
        }
        if (skip_hints) {
            // only one frame (the top-level one), no need to use the hints system
            yield co_return(I.buffer.top_frame);
        }
        var result = yield I.buffer.window.minibuffer.read_hinted_element(
            $buffer = I.buffer,
            $prompt = prompt,
            $hint_xpath_expression = "//iframe | //frame | //xhtml:iframe | //xhtml:frame");
        yield co_return(result);
    },
    $hint = "select frame");

define_browser_object_class("links",
    "Browser object class for selecting a hyperlink, form field, "+
    "or link-like element, via hinting.",
    xpath_browser_object_handler(
        "//*[@onclick or @onmouseover or @onmousedown or @onmouseup or "+
            "@oncommand or @role='link' or @role='button' or @role='menuitem'] | "+
        "//input[not(@type='hidden')] | //a[@href] | //area | "+
        "//iframe | //textarea | //button | //select | "+
        "//*[@contenteditable = 'true'] | "+
        "//xhtml:*[@onclick or @onmouseover or @onmousedown or @onmouseup or "+
                  "@oncommand or @role='link' or @role='button' or @role='menuitem'] | "+
        "//xhtml:input[not(@type='hidden')] | //xhtml:a[@href] | //xhtml:area | "+
        "//xhtml:iframe | //xhtml:textarea | //xhtml:button | //xhtml:select | " +
        "//xhtml:*[@contenteditable = 'true'] | "+
        "//svg:a"),
    $hint = "select link");

define_browser_object_class("mathml",
    "Browser object class for selecting a MathML node via hinting.",
    xpath_browser_object_handler("//m:math"),
    $hint = "select MathML element");

define_browser_object_class("top",
    "Browser object class which returns the top frame of the document.",
    function (I, prompt) { return I.buffer.top_frame; });

define_browser_object_class("url",
    "Browser object class which prompts the user for an url or webjump.",
    function (I, prompt) {
        var result = yield I.buffer.window.minibuffer.read_url($prompt = prompt);
        yield co_return(result);
    },
    $hint = "enter URL/webjump");

define_browser_object_class("paste-url",
    "Browser object which reads an url from the X Primary Selection, "+
    "falling back on the clipboard for operating systems which lack one.",
    function (I, prompt) {
		var url = read_from_x_primary_selection();
		// trim spaces
		url = url.replace(/^\s*|\s*$/,"");
		// add http:// if needed
		if (url.match(/^[^:]+\./)) {
			url = "http://" + url;
		}
        try {
            return make_uri(url).spec;
        } catch (e) {
            throw new interactive_error("error: malformed url: "+url);
        }
    });

define_browser_object_class("file",
    "Browser object which prompts for a file name.",
    function (I, prompt) {
        var result = yield I.buffer.window.minibuffer.read_file(
            $prompt = prompt,
            $history = I.command.name+"/file",
            $initial_value = I.local.cwd.path);
        yield co_return(result);
    },
    $hint = "enter file name");

define_browser_object_class("alt",
    "Browser object class which returns the alt text of an html:img, "+
    "selected via hinting",
    function (I, prompt) {
        var result = yield I.buffer.window.minibuffer.read_hinted_element(
            $buffer = I.buffer,
            $prompt = prompt,
            $hint_xpath_expression = "//img[@alt] | //xhtml:img[@alt]");
        yield co_return(result.alt);
    },
    $hint = "select image for alt-text");

define_browser_object_class("title",
    "Browser object class which returns the title attribute of an element, "+
    "selected via hinting",
    function (I, prompt) {
        var result = yield I.buffer.window.minibuffer.read_hinted_element(
            $buffer = I.buffer,
            $prompt = prompt,
            $hint_xpath_expression = "//*[@title] | //xhtml:*[@title]");
        yield co_return(result.title);
    },
    $hint = "select element for title attribute");

define_browser_object_class("title-or-alt",
    "Browser object which is the union of browser-object-alt and "+
    "browser-object-title, with title having higher precedence in "+
    "the case of an element that has both.",
    function (I, prompt) {
        var result = yield I.buffer.window.minibuffer.read_hinted_element(
            $buffer = I.buffer,
            $prompt = prompt,
            $hint_xpath_expression = "//img[@alt] | //*[@title] | //xhtml:img[@alt] | //xhtml:*[@title]");
        yield co_return(result.title ? result.title : result.alt);
    },
    $hint = "select element for title or alt-text");

define_browser_object_class("scrape-url",
    "Browser object which lets the user choose an url from a list of "+
    "urls scraped from the source code of the document.",
    function (I, prompt) {
        var completions = I.buffer.document.documentElement.innerHTML
            .match(/https?:[^\s<>)"]*/g)
            .filter(remove_duplicates_filter());
        var completer = all_word_completer($completions = completions);
        var result = yield I.buffer.window.minibuffer.read(
            $prompt = prompt,
            $completer = completer,
            $initial_value = null,
            $auto_complete = "url",
            $select,
            $require_match = false);
        yield co_return(result);
    },
    $hint = "choose scraped URL");

define_browser_object_class("up-url",
    "Browser object which returns the url one level above the current one.",
    function (I, prompt) {
        return compute_up_url(I.buffer.current_uri);
    });

define_browser_object_class("focused-element",
    "Browser object which returns the focused element.",
    function (I, prompt) { return I.buffer.focused_element; });

define_browser_object_class("dom-node", null,
    xpath_browser_object_handler("//* | //xhtml:*"),
    $hint = "select DOM node");

define_browser_object_class("fragment-link",
    "Browser object class which returns a link to the specified fragment of a page",
    function (I, prompt) {
        var elem = yield I.buffer.window.minibuffer.read_hinted_element(
            $buffer = I.buffer,
            $prompt = prompt,
            $hint_xpath_expression = "//*[@id] | //a[@name] | //xhtml:*[@id] | //xhtml:a[@name]");
        yield co_return(page_fragment_load_spec(elem));
    },
    $hint = "select element to link to");

interactive("browser-object-text",
    "Composable browser object which returns the text of another object.",
    function (I) {
        // our job here is to modify the interactive context.
        // set I.browser_object to a browser_object which calls the
        // original one, then returns its text.
        var b = I.browser_object;
        I.browser_object = function (I) {
            I.browser_object = b;
            var e = yield read_browser_object(I);
            if (e instanceof Ci.nsIDOMHTMLImageElement)
                yield co_return(e.getAttribute("alt"));
            yield co_return(e.textContent);
        };
    },
    $prefix);

function get_browser_object (I) {
    var obj = I.browser_object;
    var cmd = I.command;

    // if there was no interactive browser-object,
    // binding_browser_object becomes the default.
    if (obj === undefined) {
        obj = I.binding_browser_object;
    }
    // if the command's default browser object is a non-null literal,
    // it overrides an interactive browser-object, but not a binding
    // browser object.
    if (cmd.browser_object != null &&
        (! (cmd.browser_object instanceof browser_object_class)) &&
        (I.binding_browser_object === undefined))
    {
        obj = cmd.browser_object;
    }
    // if we still have no browser-object, look for a page-mode
    // default, or finally the command default.
    if (obj === undefined) {
        obj = (I.buffer &&
               I.buffer.default_browser_object_classes[cmd.name]) ||
            cmd.browser_object;
    }

    return obj;
}

function read_browser_object (I) {
    var browser_object = get_browser_object(I);
    if (browser_object === undefined)
        throw interactive_error("No browser object");

    var result;
    // literals cannot be overridden
    if (browser_object instanceof Function) {
        result = yield browser_object(I);
        yield co_return(result);
    }
    if (! (browser_object instanceof browser_object_class))
        yield co_return(browser_object);

    var prompt = I.command.prompt;
    if (! prompt) {
        prompt = I.command.name.split(/-|_/).join(" ");
        prompt = prompt[0].toUpperCase() + prompt.substring(1);
    }
    if (I.target != null)
        prompt += TARGET_PROMPTS[I.target];
    if (browser_object.hint)
        prompt += " (" + browser_object.hint + ")";
    prompt += ":";

    result = yield browser_object.handler.call(null, I, prompt);
    yield co_return(result);
}


/**
 * This is a simple wrapper function that sets focus to elem, and
 * bypasses the automatic focus prevention system, which might
 * otherwise prevent this from happening.
 */
function browser_set_element_focus (buffer, elem, prevent_scroll) {
    if (! dom_node_or_window_p(elem))
        return;
    if (! elem.focus)
        return;
    if (prevent_scroll)
        set_focus_no_scroll(buffer.window, elem);
    else
        elem.focus();
}

function browser_element_focus (buffer, elem) {
    if (! dom_node_or_window_p(elem))
        return;

    if (elem instanceof Ci.nsIDOMXULTextBoxElement) {
        if (elem.wrappedJSObject)
            elem = elem.wrappedJSObject.inputField; // focus the input field
        else
            elem = elem.inputField;
    }

    browser_set_element_focus(buffer, elem);
    if (elem instanceof Ci.nsIDOMWindow)
        return;

    // If it is not a window, it must be an HTML element
    var x = 0;
    var y = 0;
    if (elem instanceof Ci.nsIDOMHTMLFrameElement ||
        elem instanceof Ci.nsIDOMHTMLIFrameElement)
    {
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

    evt.initMouseEvent("mouseover", true, true, doc.defaultView, 1, x, y, 0, 0, 0, 0, 0, 0, 0, null);
    elem.dispatchEvent(evt);
}

function browser_object_follow (buffer, target, elem) {
    // XXX: would be better to let nsILocalFile objects be load_specs
    if (elem instanceof Ci.nsILocalFile)
        elem = elem.path;

    var e;
    if (elem instanceof load_spec)
        e = load_spec_element(elem);
    if (! e)
        e = elem;

    browser_set_element_focus(buffer, e, true /* no scroll */);

    var no_click = (((elem instanceof load_spec) &&
                     load_spec_forced_charset(elem)) ||
                    (e instanceof load_spec) ||
                    (e instanceof Ci.nsIDOMWindow) ||
                    (e instanceof Ci.nsIDOMHTMLFrameElement) ||
                    (e instanceof Ci.nsIDOMHTMLIFrameElement) ||
                    (e instanceof Ci.nsIDOMHTMLLinkElement) ||
                    (e instanceof Ci.nsIDOMHTMLImageElement &&
                     !e.hasAttribute("onmousedown") && !e.hasAttribute("onclick")));

    if (target == FOLLOW_DEFAULT && !no_click) {
        var x = 1, y = 1;
        if (e instanceof Ci.nsIDOMHTMLAreaElement) {
            var coords = e.getAttribute("coords").split(",");
            if (coords.length >= 2) {
                x = Number(coords[0]) + 1;
                y = Number(coords[1]) + 1;
            }
        }
        dom_node_click(e, x, y);
        return;
    }

    var spec = load_spec(elem);

    if (load_spec_uri_string(spec).match(/^\s*javascript:/)) {
        // it is nonsensical to follow a javascript url in a different
        // buffer or window
        target = FOLLOW_DEFAULT;
    } else if (!(buffer instanceof content_buffer) &&
        (target == FOLLOW_CURRENT_FRAME ||
         target == FOLLOW_DEFAULT ||
         target == OPEN_CURRENT_BUFFER))
    {
        target = OPEN_NEW_BUFFER;
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
    case OPEN_CURRENT_BUFFER:
        buffer.load(spec);
        break;
    case OPEN_NEW_WINDOW:
    case OPEN_NEW_BUFFER:
    case OPEN_NEW_BUFFER_BACKGROUND:
        if (dom_node_or_window_p(e))
            var opener = buffer;
        else
            opener = null;
        create_buffer(buffer.window,
                      buffer_creator(content_buffer,
                                     $opener = opener,
                                     $load = spec),
                      target);
    }
}

/**
 * Follow a link-like element by generating fake mouse events.
 */
function dom_node_click (elem, x, y) {
    var doc = elem.ownerDocument;
    var view = doc.defaultView;

    var evt = doc.createEvent("MouseEvents");
    evt.initMouseEvent("mousedown", true, true, view, 1, x, y, 0, 0, /*ctrl*/ 0, /*event.altKey*/0,
                       /*event.shiftKey*/ 0, /*event.metaKey*/ 0, 0, null);
    elem.dispatchEvent(evt);

    evt = doc.createEvent("MouseEvents");
    evt.initMouseEvent("click", true, true, view, 1, x, y, 0, 0, /*ctrl*/ 0, /*event.altKey*/0,
                       /*event.shiftKey*/ 0, /*event.metaKey*/ 0, 0, null);
    elem.dispatchEvent(evt);

    evt = doc.createEvent("MouseEvents");
    evt.initMouseEvent("mouseup", true, true, view, 1, x, y, 0, 0, /*ctrl*/ 0, /*event.altKey*/0,
                       /*event.shiftKey*/ 0, /*event.metaKey*/ 0, 0, null);
    elem.dispatchEvent(evt);
}


function follow (I, target) {
    if (target == null)
        target = FOLLOW_DEFAULT;
    I.target = target;
    if (target == OPEN_CURRENT_BUFFER)
        check_buffer(I.buffer, content_buffer);
    var element = yield read_browser_object(I);
    try {
        element = load_spec(element);
        if (I.forced_charset)
            element.forced_charset = I.forced_charset;
    } catch (e) {}
    browser_object_follow(I.buffer, target, element);
}

function follow_new_buffer (I) {
    yield follow(I, OPEN_NEW_BUFFER);
}

function follow_new_buffer_background (I) {
    yield follow(I, OPEN_NEW_BUFFER_BACKGROUND);
}

function follow_new_window (I) {
    yield follow(I, OPEN_NEW_WINDOW);
}

function follow_current_frame (I) {
    yield follow(I, FOLLOW_CURRENT_FRAME);
}

function follow_current_buffer (I) {
    yield follow(I, OPEN_CURRENT_BUFFER);
}


function element_get_load_target_label (element) {
    if (element instanceof Ci.nsIDOMWindow)
        return "page";
    if (element instanceof Ci.nsIDOMHTMLFrameElement)
        return "frame";
    if (element instanceof Ci.nsIDOMHTMLIFrameElement)
        return "iframe";
    return null;
}

function element_get_operation_label (element, op_name, suffix) {
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


function browser_element_text (buffer, elem) {
    try {
       var spec = load_spec(elem);
    } catch (e) {}
    var text = null;
    if (typeof elem == "string" || elem instanceof String)
        text = elem;
    else if (spec)
        text = load_spec_uri_string(spec);
    else {
        if (!(elem instanceof Ci.nsIDOMNode))
            throw interactive_error("Element has no associated text to copy.");
        var tag = elem.localName.toLowerCase();
        if ((tag == "input" || tag == "button") &&
            elem.type == "submit" && elem.form && elem.form.action)
        {
            text = elem.form.action;
        } else if (tag == "input" || tag == "textarea") {
            text = elem.value;
        } else if (tag == "select") {
            if (elem.selectedIndex >= 0)
                text = elem.item(elem.selectedIndex).text;
        } else {
            text = elem.textContent;
        }
    }
    return text;
}


define_variable("copy_append_separator", "\n",
    "String used to separate old and new text when text is appended to clipboard");

function copy_text (I) {
    var element = yield read_browser_object(I);
    browser_set_element_focus(I.buffer, element);
    var text = browser_element_text(I.buffer, element);
    writeToClipboard(text);
    I.buffer.window.minibuffer.message("Copied: " + text);
}

function copy_text_append (I) {
    var element = yield read_browser_object(I);
    browser_set_element_focus(I.buffer, element);
    var new_text = browser_element_text(I.buffer, element);
    var text = read_from_clipboard() + copy_append_separator + new_text;
    writeToClipboard(text);
    I.buffer.window.minibuffer.message("Copied: ..." + new_text);
}


define_variable("view_source_use_external_editor", false,
    "When true, the `view-source' command will send its document to "+
    "your external editor.");

define_variable("view_source_function", null,
    "May be set to a user-defined function for viewing source code. "+
    "The function should accept an nsILocalFile of the filename as "+
    "its one positional argument, and it will also be called with "+
    "the keyword `$temporary', whose value will be true if the file "+
    "is considered temporary, and therefore the function must take "+
    "responsibility for deleting it.");

function browser_object_view_source (buffer, target, elem) {
    if (view_source_use_external_editor || view_source_function) {
        var spec = load_spec(elem);

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
            view_mathml_source(window, charset, elem);
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
        try {
            browser_object_follow(buffer, target, url_s.replace(/^view-source\:/, ''));
        } catch(e) { dump_error(e); }
    }
}

function view_source (I, target) {
    I.target = target;
    if (target == null)
        target = OPEN_CURRENT_BUFFER;
    var element = yield read_browser_object(I);
    yield browser_object_view_source(I.buffer, target, element);
}

function view_source_new_buffer (I) {
    yield view_source(I, OPEN_NEW_BUFFER);
}

function view_source_new_window (I) {
    yield view_source(I, OPEN_NEW_WINDOW);
}


function browser_element_shell_command (buffer, elem, command, cwd) {
    var spec = load_spec(elem);
    yield download_as_temporary(spec,
                                $buffer = buffer,
                                $shell_command = command,
                                $shell_command_cwd = cwd);
}

provide("element");
