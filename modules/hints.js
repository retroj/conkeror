/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 * (C) Copyright 2009-2010 John J. Foerch
 *
 * Portions of this file are derived from Vimperator,
 * (C) Copyright 2006-2007 Martin Stubenschrott.
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

define_variable("active_img_hint_background_color", "#88FF00",
    "Color for the active image hint background.");

define_variable("img_hint_background_color", "yellow",
    "Color for inactive image hint backgrounds.");

define_variable("active_hint_background_color", "#88FF00",
    "Color for the active hint background.");

define_variable("hint_background_color", "yellow",
    "Color for the inactive hint.");


/**
 * Register hints style sheet
 */
const hints_stylesheet = "chrome://conkeror-gui/content/hints.css";
register_user_stylesheet(hints_stylesheet);


function hints_simple_text_match (text, pattern) {
    var pos = text.indexOf(pattern);
    if (pos == -1)
        return false;
    return [pos, pos + pattern.length];
}

define_variable('hints_text_match', hints_simple_text_match,
    "A function which takes a string and a pattern (another string) "+
    "and returns an array of [start, end] indices if the pattern was "+
    "found in the string, or false if it was not.");


/**
 *   In the hints interaction, a node can be selected either by typing
 * the number of its associated hint, or by typing substrings of the
 * text content of the node.  In the case of selecting by text
 * content, multiple substrings can be given by separating them with
 * spaces.
 */
function hint_manager (window, xpath_expr, focused_frame, focused_element) {
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
    constructor: hint_manager,
    current_hint_string: "",
    current_hint_number: -1,

    /**
     * Create an initially hidden hint span element absolutely
     * positioned over each element that matches
     * hint_xpath_expression.  This is done recursively for all frames
     * and iframes.  Information about the resulting hints are also
     * stored in the hints array.
     */
    generate_hints: function () {
        var topwin = this.window;
        var top_height = topwin.innerHeight;
        var top_width = topwin.innerWidth;
        var hints = this.hints;
        var xpath_expr = this.xpath_expr;
        var focused_frame_hint = null, focused_element_hint = null;
        var focused_frame = this.focused_frame;
        var focused_element = this.focused_element;

        function helper (window, offsetX, offsetY) {
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
                                   Ci.nsIDOMXPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
                                   null /* existing results */);

            var base_node = doc.createElementNS(XHTML_NS, "span");
            base_node.className = "__conkeror_hint";

            var fragment = doc.createDocumentFragment();
            var rect, elem, text, node, show_text;
            for (var j = 0; j < res.snapshotLength; j++) {
                elem = res.snapshotItem(j);
                rect = elem.getBoundingClientRect();
                if (elem instanceof Ci.nsIDOMHTMLAreaElement) {
                    rect = { top: rect.top,
                             left: rect.left,
                             bottom: rect.bottom,
                             right: rect.right };
                    try {
                        var coords = elem.getAttribute("coords")
                            .match(/^\D*(-?\d+)\D+(-?\d+)/);
                        if (coords.length == 3) {
                            rect.left += parseInt(coords[1]);
                            rect.top += parseInt(coords[2]);
                        }
                    } catch (e) {}
                }
                if (!rect || rect.left > maxX || rect.right < minX || rect.top > maxY || rect.bottom < minY)
                    continue;
                let style = topwin.getComputedStyle(elem, "");
                if (style.display == "none" || style.visibility == "hidden")
                    continue;
                if (! (elem instanceof Ci.nsIDOMHTMLAreaElement))
                    rect = elem.getClientRects()[0];
                if (!rect)
                    continue;
                show_text = false;
                if (elem instanceof Ci.nsIDOMHTMLInputElement || elem instanceof Ci.nsIDOMHTMLTextAreaElement)
                    text = elem.value;
                else if (elem instanceof Ci.nsIDOMHTMLSelectElement) {
                    if (elem.selectedIndex >= 0)
                        text = elem.item(elem.selectedIndex).text;
                    else
                        text = "";
                } else if (elem instanceof Ci.nsIDOMHTMLFrameElement) {
                    text = elem.name ? elem.name : "";
                } else if (/^\s*$/.test(elem.textContent) &&
                           elem.childNodes.length == 1 &&
                           elem.childNodes.item(0) instanceof Ci.nsIDOMHTMLImageElement) {
                    text = elem.childNodes.item(0).alt;
                    show_text = true;
                } else
                    text = elem.textContent;
                text = text.toLowerCase();

                node = base_node.cloneNode(true);
                node.style.left = (rect.left + scrollX) + "px";
                node.style.top = (rect.top + scrollY) + "px";
                fragment.appendChild(node);

                let hint = { text: text,
                             elem: elem,
                             hint: node,
                             img_hint: null,
                             visible: false,
                             show_text: show_text };
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
                for (var i = 0, nframes = frames.length; i < nframes; ++i) {
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
    update_valid_hints: function () {
        this.valid_hints = [];
        var active_number = this.current_hint_number;

        var tokens = this.current_hint_string.split(" ");
        var rect, h, text, img_hint, doc, scrollX, scrollY;
        var hints = this.hints;

    outer:
        for (var i = 0, nhints = hints.length; i < nhints; ++i) {
            h = hints[i];
            text = h.text;
            for (var j = 0, ntokens = tokens.length; j < ntokens; ++j) {
                if (! hints_text_match(text, tokens[j])) {
                    if (h.visible) {
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

            if (img_elem) {
                if (!h.img_hint) {
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
            } else if (h.show_text && !/^\s*$/.test(text)) {
                let substrs = [[0,4]];
                for (j = 0; j < ntokens; ++j) {
                    let m = hints_text_match(text, tokens[j]);
                    if (m == false) continue;
                    splice_range(substrs, m[0], m[1] + 2);
                }
                label += " " + substrs.map(function (x) {
                    return text.substring(x[0],Math.min(x[1], text.length));
                }).join("..") + "..";
            }
            h.hint.textContent = label;
            h.hint.style.display = "inline";
            this.valid_hints.push(h);
        }

        if (active_number == -1)
            this.select_hint(1);
    },

    select_hint: function (index) {
        var old_index = this.current_hint_number;
        if (index == old_index)
            return;
        var vh = this.valid_hints;
        if (old_index >= 1 && old_index <= vh.length) {
            var h = vh[old_index - 1];
            if (h.img_hint)
                h.img_hint.style.backgroundColor = img_hint_background_color;
            if (h.elem.style)
                h.elem.style.backgroundColor = hint_background_color;
        }
        this.current_hint_number = index;
        if (index >= 1 && index <= vh.length) {
            var h = vh[index - 1];
            if (h.img_hint)
                h.img_hint.style.backgroundColor = active_img_hint_background_color;
            if (h.elem.style)
                h.elem.style.backgroundColor = active_hint_background_color;
            this.last_selected_hint = h;
        }
    },

    hide_hints: function () {
        for (var i = 0, nhints = this.hints.length; i < nhints; ++i) {
            var h = this.hints[i];
            if (h.visible) {
                h.visible = false;
                if (h.saved_color != null) {
                    h.elem.style.color = h.saved_color;
                    h.elem.style.backgroundColor = h.saved_bgcolor;
                }
                if (h.img_hint)
                    h.img_hint.style.display = "none";
                h.hint.style.display = "none";
            }
        }
    },

    remove: function () {
        for (var i = 0, nhints = this.hints.length; i < nhints; ++i) {
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

/* Show panel with currently selected URL. */
function hints_url_panel (hints, window) {
    var g = new dom_generator(window.document, XUL_NS);

    var p = g.element("hbox", "class", "panel url", "flex", "0");
    g.element("label", p, "value", "URL:", "class", "url-panel-label");
    var url_value = g.element("label", p, "class", "url-panel-value",
                              "crop", "end", "flex", "1");
    window.minibuffer.insert_before(p);

    p.update = function () {
	url_value.value = "";
	if (hints.manager && hints.manager.last_selected_hint) {
            var spec;
            try {
                spec = load_spec(hints.manager.last_selected_hint.elem);
            } catch (e) {}
            if (spec) {
                var uri = load_spec_uri_string(spec);
                if (uri) url_value.value = uri;
            }
	}
    };

    p.destroy = function () {
        this.parentNode.removeChild(this);
    };

    return p;
}

define_variable("hints_display_url_panel", false,
    "When selecting a hint, the URL can be displayed in a panel above "+
    "the minibuffer.  This is useful for confirming that the correct "+
    "link is selected and that the URL is not evil.  This option is "+
    "most useful when hints_auto_exit_delay is long or disabled.");

/**
 * keyword arguments:
 *
 * $prompt
 * $callback
 * $abort_callback
 */
define_keywords("$keymap", "$auto", "$hint_xpath_expression", "$multiple");
function hints_minibuffer_state (minibuffer, continuation, buffer) {
    keywords(arguments, $keymap = hint_keymap, $auto);
    basic_minibuffer_state.call(this, minibuffer, $prompt = arguments.$prompt,
                                $keymap = arguments.$keymap);
    if (hints_display_url_panel)
	this.url_panel = hints_url_panel(this, buffer.window);
    this.original_prompt = arguments.$prompt;
    this.continuation = continuation;
    this.auto_exit = arguments.$auto ? true : false;
    this.xpath_expr = arguments.$hint_xpath_expression;
    this.auto_exit_timer_ID = null;
    this.multiple = arguments.$multiple;
    this.focused_element = buffer.focused_element;
    this.focused_frame = buffer.focused_frame;
}
hints_minibuffer_state.prototype = {
    constructor: hints_minibuffer_state,
    __proto__: basic_minibuffer_state.prototype,
    manager: null,
    typed_string: "",
    typed_number: "",
    load: function () {
        basic_minibuffer_state.prototype.load.call(this);
        if (!this.manager) {
            var buf = this.minibuffer.window.buffers.current;
            this.manager = new hint_manager(buf.top_frame, this.xpath_expr,
                                            this.focused_frame, this.focused_element);
        }
        this.manager.update_valid_hints();
        if (this.url_panel)
            this.url_panel.update();
    },
    clear_auto_exit_timer: function () {
        var window = this.minibuffer.window;
        if (this.auto_exit_timer_ID != null) {
            window.clearTimeout(this.auto_exit_timer_ID);
            this.auto_exit_timer_ID = null;
        }
    },
    unload: function () {
        this.clear_auto_exit_timer();
        this.manager.hide_hints();
        basic_minibuffer_state.prototype.unload.call(this);
    },
    destroy: function () {
        this.clear_auto_exit_timer();
        this.manager.remove();
        if (this.url_panel)
            this.url_panel.destroy();
        basic_minibuffer_state.prototype.destroy.call(this);
    },
    update_minibuffer: function (m) {
        if (this.typed_number.length > 0)
            m.prompt = this.original_prompt + " #" + this.typed_number;
        else
            m.prompt = this.original_prompt;
        if (this.url_panel)
            this.url_panel.update();
    },

    handle_auto_exit: function (ambiguous) {
        var window = this.minibuffer.window;
        var num = this.manager.current_hint_number;
        if (!this.auto_exit)
            return;
        let s = this;
        let delay = ambiguous ? hints_ambiguous_auto_exit_delay : hints_auto_exit_delay;
        if (delay > 0)
            this.auto_exit_timer_ID = window.setTimeout(function () { hints_exit(window, s); },
                                                        delay);
    },

    handle_input: function (m) {
        this.clear_auto_exit_timer();
        this.typed_number = "";
        this.typed_string = m._input_text;
        this.manager.current_hint_string = this.typed_string;
        this.manager.current_hint_number = -1;
        this.manager.update_valid_hints();
        if (this.manager.valid_hints.length == 1)
            this.handle_auto_exit(false /* unambiguous */);
        else if (this.manager.valid_hints.length > 1)
        this.handle_auto_exit(true /* ambiguous */);
        this.update_minibuffer(m);
    }
};

define_variable("hints_auto_exit_delay", 0,
    "Delay (in milliseconds) after the most recent key stroke before a "+
    "sole matching element is automatically selected.  When zero, "+
    "automatic selection is disabled.  A value of 500 is a good "+
    "starting point for an average-speed typist.");

define_variable("hints_ambiguous_auto_exit_delay", 0,
    "Delay (in milliseconds) after the most recent key stroke before the "+
    "first of an ambiguous match is automatically selected.  If this is "+
    "set to 0, automatic selection in ambiguous matches is disabled.");

interactive("hints-handle-number", null,
    function (I) {
        let s = I.minibuffer.check_state(hints_minibuffer_state);
        s.clear_auto_exit_timer();
        var ch = String.fromCharCode(I.event.charCode);
        var auto_exit_ambiguous = null; // null -> no auto exit; false -> not ambiguous; true -> ambiguous
        /* TODO: implement number escaping */
        // Number entered
        s.typed_number += ch;

        s.manager.select_hint(parseInt(s.typed_number));
        var num = s.manager.current_hint_number;
        if (num > 0 && num <= s.manager.valid_hints.length)
            auto_exit_ambiguous = num * 10 > s.manager.valid_hints.length ? false : true;
        else if (num == 0) {
            if (!s.multiple) {
                hints_exit(I.window, s);
                return;
            }
            auto_exit_ambiguous = false;
        }
        if (auto_exit_ambiguous !== null)
            s.handle_auto_exit(auto_exit_ambiguous);
        s.update_minibuffer(I.minibuffer);
    });

function hints_backspace (window, s) {
    let m = window.minibuffer;
    s.clear_auto_exit_timer();
    if (s.typed_number.length > 0) {
        s.typed_number = s.typed_number.substring(0, s.typed_number.length - 1);
        var num = s.typed_number.length > 0 ? parseInt(s.typed_number) : 1;
        s.manager.select_hint(num);
    } else if (s.typed_string.length > 0) {
        call_builtin_command(window, 'cmd_deleteCharBackward');
        s.typed_string = m._input_text;
        //m._set_selection();
        s.manager.current_hint_string = s.typed_string;
        s.manager.current_hint_number = -1;
        s.manager.update_valid_hints();
    }
    s.update_minibuffer(m);
}
interactive("hints-backspace", null,
    function (I) {
        hints_backspace(I.window, I.minibuffer.check_state(hints_minibuffer_state));
    });

function hints_next (window, s, count) {
    s.clear_auto_exit_timer();
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
interactive("hints-next", null,
    function (I) {
        hints_next(I.window, I.minibuffer.check_state(hints_minibuffer_state), I.p);
    });

interactive("hints-previous", null,
    function (I) {
        hints_next(I.window, I.minibuffer.check_state(hints_minibuffer_state), -I.p);
    });

function hints_exit (window, s) {
    var cur = s.manager.current_hint_number;
    var elem = null;
    if (cur > 0 && cur <= s.manager.valid_hints.length) {
        elem = s.manager.valid_hints[cur - 1].elem;
    } else if (cur == 0) {
        elem = window.buffers.current.top_frame;
    }
    if (elem !== null) {
        var c = s.continuation;
        delete s.continuation;
        window.minibuffer.pop_state();
        if (c)
            c(elem);
    }
}

interactive("hints-exit", null,
    function (I) {
        hints_exit(I.window, I.minibuffer.check_state(hints_minibuffer_state));
    });


define_keywords("$buffer");
minibuffer.prototype.read_hinted_element = function () {
    keywords(arguments);
    var buf = arguments.$buffer;
    var s = new hints_minibuffer_state(this, (yield CONTINUATION), buf, forward_keywords(arguments));
    this.push_state(s);
    var result = yield SUSPEND;
    yield co_return(result);
};

provide("hints");
