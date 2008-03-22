/**
 * hints module
 *
 * Portions are derived from Vimperator (c) 2006-2007: Martin Stubenschrott <stubenschrott@gmx.net>
 */

define_variable("active_img_hint_background_color", "#88FF00", "Color for the active image hint background.");
define_variable("img_hint_background_color", "yellow", "Color for inactive image hint backgrounds.");
define_variable("active_hint_background_color", "#88FF00", "Color for the active hint background.");
define_variable("hint_background_color", "yellow", "Color for the inactive hint.");

/**
 * Register hints style sheet
 */
const hints_stylesheet = "chrome://conkeror/content/hints.css";
function hints_register_stylesheet()
{
    var uri = makeURL(hints_stylesheet);
    var sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
    sss.loadAndRegisterSheet(uri, sss.USER_SHEET);
}

function hints_unregister_stylesheet()
{
    var uri = makeURL(hints_stylesheet);
    var sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
    if (sss.sheetRegistered(uri, sss.USER_SHEET))
        ss.unregisterSheet(uri, sss.USER_SHEET);
}
hints_register_stylesheet();

/**
 * buffer is a content_buffer
 *
 */
function hint_manager(window, xpath_expr, focused_frame, focused_element)
{
    this.window = window;
    this.hints = [];
    this.valid_hints = [];
    this.xpath_expr = xpath_expr;
    this.focused_frame = focused_frame;
    this.focused_element = focused_element;
    this.last_selected_hint = null;

    // Generate
    this.generate_hints();
}

hint_manager.prototype = {
    current_hint_string : "",
    current_hint_number : -1,

    /**
     * Create an initially hidden hint span element absolutely
     * positioned over each element that matches
     * hint_xpath_expression.  This is done recursively for all frames
     * and iframes.  Information about the resulting hints are also
     * stored in the hints array.
     */
    generate_hints : function () {
        var topwin = this.window;
        var top_height = topwin.innerHeight;
        var top_width = topwin.innerWidth;
        var hints = this.hints;
        var xpath_expr = this.xpath_expr;
        var focused_frame_hint = null, focused_element_hint = null;
        var focused_frame = this.focused_frame;
        var focused_element = this.focused_element;
        function helper(window, offsetX, offsetY) {
            var win_height = window.height;
            var win_width = window.width;

            // Bounds
            var minX = offsetX < 0 ? -offsetX : 0;
            var minY = offsetY < 0 ? -offsetY : 0;
            var maxX = offsetX + win_width > top_width ? top_width - offsetX : top_width;
            var maxY = offsetY + win_height > top_height ? top_height - offsetY : top_height;

            var scrollX = window.scrollX;
            var scrollY = window.scrollY;

            var doc = window.document;
            var res = doc.evaluate(xpath_expr, doc, xpath_lookup_namespace,
                                   Ci.nsIDOMXPathResult.UNORDERED_NODE_ITERATOR_TYPE,
                                   null /* existing results */);

            var base_node = doc.createElementNS(XHTML_NS, "span");
            base_node.className = "__conkeror_hint";

            var fragment = doc.createDocumentFragment();
            var rect, elem, text, node;
            while ((elem = res.iterateNext()) != null)
            {
                rect = elem.getBoundingClientRect();
                if (!rect || rect.left > maxX || rect.right < minX || rect.top > maxY || rect.bottom < minY)
                    continue;
                rect = elem.getClientRects()[0];
                if (!rect)
                    continue;
                if (elem instanceof Ci.nsIDOMHTMLInputElement || elem instanceof Ci.nsIDOMHTMLTextAreaElement)
                    text = elem.value.toLowerCase();
                else if (elem instanceof Ci.nsIDOMHTMLSelectElement) {
                    if (elem.selectedIndex >= 0)
                        text = elem.item(elem.selectedIndex).text.toLowerCase();
                    else
                        text = "";
                } else if (elem instanceof Ci.nsIDOMHTMLFrameElement) {
                    text = elem.name ? elem.name : "";
                } else
                    text = elem.textContent.toLowerCase();

                node = base_node.cloneNode(true);
                node.style.left = (rect.left + scrollX) + "px";
                node.style.top = (rect.top + scrollY) + "px";
                fragment.appendChild(node);

                var hint = {text: text,
                            elem: elem,
                            hint: node,
                            img_hint: null,
                            visible : false};
                if (elem.style) {
                    hint.saved_color = elem.style.color;
                    hint.saved_bgcolor = elem.style.backgroundColor;
                }
                hints.push(hint);

                if (elem == focused_element)
                    focused_element_hint = hint;
                else if ((elem instanceof Ci.nsIDOMHTMLFrameElement ||
                          elem instanceof Ci.nsIDOMHTMLIFrameElement) &&
                         elem.contentWindow == focused_frame)
                    focused_frame_hint = hint;
            }
            doc.documentElement.appendChild(fragment);

            /* Recurse into any IFRAME or FRAME elements */
            var frametag = "frame";
            while (true) {
                var frames = doc.getElementsByTagName(frametag);
                for (var i = 0; i < frames.length; ++i)
                {
                    elem = frames[i];
                    rect = elem.getBoundingClientRect();
                    if (!rect || rect.left > maxX || rect.right < minX || rect.top > maxY || rect.bottom < minY)
                        continue;
                    helper(elem.contentWindow, offsetX + rect.left, offsetY + rect.top);
                }
                if (frametag == "frame") frametag = "iframe"; else break;
            }
        }
        helper(topwin, 0, 0);
        this.last_selected_hint = focused_element_hint || focused_frame_hint;
    },

    /* Updates valid_hints and also re-numbers and re-displays all hints. */
    update_valid_hints : function () {
        this.valid_hints = [];
        var active_number = this.current_hint_number;

        var tokens = this.current_hint_string.split(" ");
        var rect, h, text, img_hint, doc, scrollX, scrollY;
        var hints = this.hints;

    outer:
        for (var i = 0; i < hints.length; ++i)
        {
            h = hints[i];
            text = h.text;
            for (var j = 0; j < tokens.length; ++j)
            {
                if (text.indexOf(tokens[j]) == -1)
                {
                    if (h.visible)
                    {
                        h.visible = false;
                        h.hint.style.display = "none";
                        if (h.img_hint)
                            h.img_hint.style.display = "none";
                        if (h.saved_color != null) {
                            h.elem.style.backgroundColor = h.saved_bgcolor;
                            h.elem.style.color = h.saved_color;
                        }
                    }
                    continue outer;
                }
            }

            var cur_number = this.valid_hints.length + 1;
            h.visible = true;

            if (h == this.last_selected_hint && active_number == -1)
                this.current_hint_number = active_number = cur_number;

            var img_elem = null;

            if (text.length == 0 && h.elem.firstChild &&
                h.elem.firstChild instanceof Ci.nsIDOMHTMLImageElement)
                img_elem = h.elem.firstChild;
            else if (h.elem instanceof Ci.nsIDOMHTMLImageElement)
                img_elem = h.elem;

            if (img_elem)
            {
                if (!h.img_hint)
                {
                    rect = img_elem.getBoundingClientRect();
                    if (rect) {
                        doc = h.elem.ownerDocument;
                        scrollX = doc.defaultView.scrollX;
                        scrollY = doc.defaultView.scrollY;
                        img_hint = doc.createElementNS(XHTML_NS, "span");
                        img_hint.className = "__conkeror_img_hint";
                        img_hint.style.left = (rect.left + scrollX) + "px";
                        img_hint.style.top = (rect.top + scrollY) + "px";
                        img_hint.style.width = (rect.right - rect.left) + "px";
                        img_hint.style.height = (rect.bottom - rect.top) + "px";
                        h.img_hint = img_hint;
                        doc.documentElement.appendChild(img_hint);
                    } else
                        img_elem = null;
                }
                if (img_elem) {
                    var bgcolor = (active_number == cur_number) ? 
                        active_img_hint_background_color : img_hint_background_color;
                    h.img_hint.style.backgroundColor = bgcolor;
                    h.img_hint.style.display = "inline";
                }
            }

            if (!h.img_hint && h.elem.style)
                h.elem.style.backgroundColor = (active_number == cur_number) ?
                    active_hint_background_color : hint_background_color;

            if (h.elem.style)
                h.elem.style.color = "black";

            var label = "" + cur_number;
            if (h.elem instanceof Ci.nsIDOMHTMLFrameElement) {
                label +=  " " + text;
            }
            h.hint.textContent = label;
            h.hint.style.display = "inline";
            this.valid_hints.push(h);
        }

        if (active_number == -1)
            this.select_hint(1);
    },

    select_hint : function (index) {
        var old_index = this.current_hint_number;
        if (index == old_index)
            return;
        var vh = this.valid_hints;
        if (old_index >= 1 && old_index <= vh.length)
        {
            var h = vh[old_index - 1];
            if (h.img_hint)
                h.img_hint.style.backgroundColor = img_hint_background_color;
            if (h.elem.style)
                h.elem.style.backgroundColor = hint_background_color;
        }
        this.current_hint_number = index;
        if (index >= 1 && index <= vh.length)
        {
            var h = vh[index - 1];
            if (h.img_hint)
                h.img_hint.style.backgroundColor = active_img_hint_background_color;
            if (h.elem.style)
                h.elem.style.backgroundColor = active_hint_background_color;
            this.last_selected_hint = h;
        }
    },

    hide_hints : function () {
        for (var i = 0; i < this.hints.length; ++i)
        {
            var h = this.hints[i];
            if (h.visible) {
                h.visible = false;
                if (h.saved_color != null)
                {
                    h.elem.style.color = h.saved_color;
                    h.elem.style.backgroundColor = h.saved_bgcolor;
                }
                if (h.img_hint)
                    h.img_hint.style.display = "none";
                h.hint.style.display = "none";
            }
        }
    },

    remove : function () {
        for (var i = 0; i < this.hints.length; ++i)
        {
            var h = this.hints[i];
            if (h.visible && h.saved_color != null) {
                h.elem.style.color = h.saved_color;
                h.elem.style.backgroundColor = h.saved_bgcolor;
            }
            if (h.img_hint)
                h.img_hint.parentNode.removeChild(h.img_hint);
            h.hint.parentNode.removeChild(h.hint);
        }
        this.hints = [];
        this.valid_hints = [];
    }
};

var hint_keymap = null;

function initialize_hint_keymap()
{
    hint_keymap = new keymap();
}
initialize_hint_keymap();

/**
 * keyword arguments:
 *
 * $prompt
 * $callback
 * $abort_callback
 */
define_keywords("$keymap", "$auto", "$hint_xpath_expression", "$multiple");
function hints_minibuffer_state(continuation, buffer)
{
    keywords(arguments, $keymap = hint_keymap, $auto);
    basic_minibuffer_state.call(this, $prompt = arguments.$prompt);
    this.continuation = continuation;
    this.keymap = arguments.$keymap;
    this.auto_exit = arguments.$auto ? true : false;
    this.xpath_expr = arguments.$hint_xpath_expression;
    this.auto_exit_timer_ID = null;
    this.multiple = arguments.$multiple;
    this.focused_element = buffer.focused_element;
    this.focused_frame = buffer.focused_frame;
}
hints_minibuffer_state.prototype = {
    __proto__: basic_minibuffer_state.prototype,
    manager : null,
    typed_string : "",
    typed_number : "",
    load : function (window) {
        if (!this.manager) {
            var buf = window.buffers.current;
            this.manager = new hint_manager(buf.top_frame, this.xpath_expr,
                                            this.focused_frame, this.focused_element);
        }
        this.manager.update_valid_hints();
    },
    unload : function (window) {
        if (this.auto_exit_timer_ID) {
            window.clearTimeout(this.auto_exit_timer_ID);
            this.auto_exit_timer_ID = null;
        }
        this.manager.hide_hints();
    },
    destroy : function () {
        if (this.auto_exit_timer_ID) {
            window.clearTimeout(this.auto_exit_timer_ID);
            this.auto_exit_timer_ID = null;
        }
        this.manager.remove();
    },
    update_minibuffer : function (window) {
        var str = this.typed_string;
        if (this.typed_number.length > 0) {
            str += " #" + this.typed_number;
        }
        window.minibuffer._input_text = str;
        window.minibuffer._set_selection();
    }
};

define_variable("hints_auto_exit_delay", 500, "Delay (in milliseconds) after the most recent key stroke before a sole matching element is automatically selected.  If this is set to 0, automatic selection is disabled.");

function hints_handle_character(window, s, e) {
    /* Check for numbers */
    var ch = String.fromCharCode(e.charCode);
    var auto_exit = false;
    /* TODO: implement number escaping */
    if (e.charCode >= 48 && e.charCode <= 57) {
        // Number entered
        s.typed_number += ch;
        s.manager.select_hint(parseInt(s.typed_number));
        var num = s.manager.current_hint_number;
        if (s.auto_exit) {
            if (num > 0 && num <= s.manager.valid_hints.length && num * 10 > s.manager.valid_hints.length)
                auto_exit = true;
            if (num == 0) {
                if (!s.multiple) {
                    hints_exit(window, s);
                    return;
                }
                auto_exit = true;
            }
        }
    } else {
        s.typed_number = "";
        s.typed_string += ch;
        s.manager.current_hint_string = s.typed_string;
        s.manager.current_hint_number = -1;
        s.manager.update_valid_hints();
        if (s.auto_exit && s.manager.valid_hints.length == 1)
            auto_exit = true;
    }
    if (auto_exit) {
        if (this.auto_exit_timer_ID) {
            window.clearTimeout(this.auto_exit_timer_ID);
        }
        this.auto_exit_timer_ID = window.setTimeout(function() { hints_exit(window, s); },
                                                   hints_auto_exit_delay);
    }
    s.update_minibuffer(window);
}
interactive("hints-handle-character", function (I) {
    hints_handle_character(I.window, I.minibuffer.check_state(hints_minibuffer_state), I.event);
});

function hints_backspace(window, s) {
    if (this.auto_exit_timer_ID) {
        window.clearTimeout(this.auto_exit_timer_ID);
        this.auto_exit_timer_ID = null;
    }
    if (s.typed_number.length > 0) {
        s.typed_number = s.typed_number.substring(0, s.typed_number.length - 1);
        var num = s.typed_number.length > 0 ? parseInt(s.typed_number) : 1;
        s.manager.select_hint(num);
    } else if (s.typed_string.length > 0) {
        s.typed_string = s.typed_string.substring(0, s.typed_string.length - 1);
        s.manager.current_hint_string = s.typed_string;
        s.manager_current_hint_number = -1;
        s.manager.update_valid_hints();
    }
    s.update_minibuffer(window);
}
interactive("hints-backspace", function (I) {
    hints_backspace(I.window, I.minibuffer.check_state(hints_minibuffer_state));
});

function hints_next(window, s, count) {
    if (this.auto_exit_timer_ID) {
        window.clearTimeout(this.auto_exit_timer_ID);
        this.auto_exit_timer_ID = null;
    }
    s.typed_number = "";
    var cur = s.manager.current_hint_number - 1;
    var vh = s.manager.valid_hints;
    if (vh.length > 0) {
        cur = (cur + count) % vh.length;
        if (cur < 0)
            cur += vh.length;
        s.manager.select_hint(cur + 1);
    }
    s.update_minibuffer(window);
}
interactive("hints-next", function (I) {
    hints_next(I.window, I.minibuffer.check_state(hints_minibuffer_state), I.p);
});

interactive("hints-previous", function (I) {
    hints_next(I.window, I.minibuffer.check_state(hints_minibuffer_state), -I.p);
});

function hints_exit(window, s)
{
    if (this.auto_exit_timer_ID) {
        window.clearTimeout(this.auto_exit_timer_ID);
        this.auto_exit_timer_ID = null;
    }
    var cur = s.manager.current_hint_number;
    var elem = null;
    if (cur > 0 && cur <= s.manager.valid_hints.length)
        elem = s.manager.valid_hints[cur - 1].elem;
    else if (cur == 0)
        elem = window.buffers.current.top_frame;
    if (elem) {
        var c = s.continuation;
        delete s.continuation;
        window.minibuffer.pop_state();
        if (c)
            c(elem);
    }
}

interactive("hints-exit", function (I) {
    hints_exit(I.window, I.minibuffer.check_state(hints_minibuffer_state));
});


/* FIXME: figure out why this needs to have a bunch of duplication */
define_variable(
    "hints_xpath_expressions",
    {
        images: {def: "//img | //xhtml:img"},
        frames: {def: "//iframe | //frame | //xhtml:iframe | //xhtml:frame"},
        links: {def:
                "//*[@onclick or @onmouseover or @onmousedown or @onmouseup or @oncommand or @class='lk' or @class='s'] | " +
                "//input[not(@type='hidden')] | //a | //area | //iframe | //textarea | //button | //select | " +
                "//xhtml:*[@onclick or @onmouseover or @onmousedown or @onmouseup or @oncommand or @class='lk' or @class='s'] | " +
                "//xhtml:input[not(@type='hidden')] | //xhtml:a | //xhtml:area | //xhtml:iframe | //xhtml:textarea | " +
                "//xhtml:button | //xhtml:select"},
        mathml: {def: "//m:math"}
    },
    "XPath expressions for each object class.");

minibuffer_auto_complete_preferences["media"] = true;
define_keywords("$object_class", "$buffer", "$action");
minibuffer.prototype.read_hinted_element = function () {
    keywords(arguments);
    var buf = arguments.$buffer;
    // FIXME: clean this up and replace with proper object class declaration
    var object_class = arguments.$object_class;
    if (object_class == "top")
        yield co_return(buf.top_frame);

    if (object_class == "media") {
        let media = media_scrape(buf);
        if (!media || media.length == 0)
            throw interactive_error("No media found.");

        if (media.length == 1)
            yield co_return(media[0]);

        let completer = all_word_completer(
            $completions = media,
            $get_string = function (x) x.uri || "",
            $get_description = function (x) x.title);

        let result = yield this.read(
            $prompt = "Media",
            $match_required,
            $completer = completer,
            $auto_complete_initial,
            $auto_complete = "media");

        yield co_return(result);
    }

    if (object_class == "frames") {
        check_buffer(buf, content_buffer);
        var doc = buf.top_document;
        if (doc.getElementsByTagName("frame").length == 0 &&
            doc.getElementsByTagName("iframe").length == 0)
        {
            // only one frame (the top-level one), no need to use the hints system
            yield co_return(buf.top_frame);
        }
    }
    var s = new hints_minibuffer_state((yield CONTINUATION), buf, forward_keywords(arguments),
        $hint_xpath_expression = resolve_hints_xpath_expression(object_class, arguments.$action));
    this.push_state(s);
    var result = yield SUSPEND;
    yield co_return(result);
};
