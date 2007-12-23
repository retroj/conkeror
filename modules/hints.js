/**
 * hints module
 *
 * Portions are derived from Vimperator (c) 2006-2007: Martin Stubenschrott <stubenschrott@gmx.net>
 */

/* USER PREFERENCE */
/* FIXME: figure out why this needs to have a bunch of duplication */
var hint_xpath_expression =
    "//*[@onclick or @onmouseover or @onmousedown or @onmouseup or @oncommand or @class='lk' or @class='s'] | " +
    "//input[not(@type='hidden')] | //a | //area | //iframe | //textarea | //button | //select | " +
    "//xhtml:*[@onclick or @onmouseover or @onmousedown or @onmouseup or @oncommand or @class='lk' or @class='s'] | " +
    "//xhtml:input[not(@type='hidden')] | //xhtml:a | //xhtml:area | //xhtml:iframe | //xhtml:textarea | " +
    "//xhtml:button | //xhtml:select";

var active_img_hint_background_color = "#88FF00";
var img_hint_background_color = "yellow";
var active_hint_background_color = "#88FF00";
var hint_background_color = "yellow";

/**
 * buffer is a browser_buffer
 *
 */
function hint_manager(window, xpath_expr)
{
    this.window = window;
    this.hints = [];
    this.valid_hints = [];
    this.xpath_expr = xpath_expr;
    this.generate_hints();
}

hint_manager.prototype = {
    current_hint_string : "",
    current_hint_number : 1,

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
                                   window.XPathResult.UNORDERED_NODE_ITERATOR_TYPE,
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
                var tagname = elem.localName;
                if (tagname == "INPUT" || tagname == "TEXTAREA")
                    text = elem.value.toLowerCase();
                else if (tagname == "SELECT") {
                    if (elem.selectedIndex >= 0)
                        text = elem.item(elem.selectedIndex).text.toLowerCase();
                    else
                        text = "";
                } else if (tagname == "FRAME") {
                    text = elem.name ? elem.name : "";
                } else
                    text = elem.textContent.toLowerCase();

                node = base_node.cloneNode(true);
                node.style.left = (rect.left + scrollX) + "px";
                node.style.top = (rect.top + scrollY) + "px";
                fragment.appendChild(node);

                hints.push({text: text,
                            elem: elem,
                            hint: node,
                            img_hint: null,
                            saved_color: elem.style.color,
                            saved_bgcolor: elem.style.backgroundColor,
                            visible : false});
            }
            doc.documentElement.appendChild(fragment);

            /* Recurse into any IFRAME or FRAME elements */
            var frametag = "FRAME";
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
                if (frametag == "FRAME") frametag = "IFRAME"; else break;
            }
        }
        helper(topwin, 0, 0);
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
                        h.elem.style.backgroundColor = h.saved_bgcolor;
                        h.elem.style.color = h.saved_color;
                    }
                    continue outer;
                }
            }
            h.visible = true;

            if (text.length == 0 && h.elem.firstChild && h.elem.firstChild.localName == "IMG")
            {
                if (!h.img_hint)
                {
                    rect = h.elem.firstChild.getBoundingClientRect();
                    if (!rect)
                        continue;
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
                }
                h.img_hint.style.backgroundColor = (active_index == i) ?
                    active_img_hint_background_color : img_hint_background_color;
                h.img_hint.style.display = "inline";
            }

            var cur_number = this.valid_hints.length + 1;

            if (!h.img_hint)
                h.elem.style.backgroundColor = (active_number == cur_number) ?
                    active_hint_background_color : hint_background_color;
            h.elem.style.color = "black";
            var label = "" + cur_number;
            if (h.elem.localName == "FRAME") {
                label +=  " " + text;
            }
            h.hint.textContent = label;
            h.hint.style.display = "inline";
            this.valid_hints.push(h);
        }
    },

    select_hint : function (index) {
        var old_index = this.current_hint_number;
        if (index == old_index)
            return;
        var vh = this.valid_hints;
        if (old_index >= 1 && old_index <= vh.length)
        {
            var h = vh[old_index - 1];
            h.elem.style.backgroundColor = hint_background_color;
            if (h.img_hint)
                h.img_hint.style.backgroundColor = img_hint_background_color;
        }
        this.current_hint_number = index;
        if (index >= 1 && index <= vh.length)
        {
            var h = vh[index - 1];
            h.elem.style.backgroundColor = active_hint_background_color;
            if (h.img_hint)
                h.img_hint.style.backgroundColor = active_img_hint_background_color;
        }
    },

    hide_hints : function () {
        for (var i = 0; i < this.hints.length; ++i)
        {
            var h = this.hints[i];
            if (h.visible) {
                h.visible = false;
                h.elem.style.color = h.saved_color;
                h.elem.style.backgroundColor = h.saved_bgcolor;
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
            if (h.visible) {
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
    define_key(hint_keymap, kbd(match_any_unmodified_key), "hints-handle-character");
    define_key(hint_keymap, "back_space", "hints-backspace");
    define_key(hint_keymap, "tab", "hints-next");
    define_key(hint_keymap, "right", "hints-next");
    define_key(hint_keymap, "down", "hints-next");
    define_key(hint_keymap, "S-tab", "hints-previous");
    define_key(hint_keymap, "left", "hints-previous");
    define_key(hint_keymap, "up", "hints-previous");
    define_key(hint_keymap, "escape", "hints-abort");
    define_key(hint_keymap, "C-g", "hints-abort");
    define_key(hint_keymap, "return", "hints-exit");

    // FIXME: this should probably be some better more general
    // property, i.e. catch_all or something.
    define_key(hint_keymap, kbd(match_any_key), null);
}
initialize_hint_keymap();

/**
 * keyword arguments:
 *
 * $prompt
 * $callback
 * $abort_callback
 */
define_keywords("$keymap", "$auto", "$callback", "$abort_callback", "$hint_xpath_expression");
function hints_minibuffer_state()
{
    keywords(arguments, $keymap = hint_keymap, $hint_xpath_expression = hint_xpath_expression, $auto);
    basic_minibuffer_state.call(this, $prompt = arguments.$prompt);
    this.keymap = arguments.$keymap;
    this.callback = arguments.$callback;
    this.abort_callback = arguments.$abort_callback;
    this.auto_exit = arguments.$auto ? true : false;
    this.xpath_expr = arguments.$hint_xpath_expression;
    this.auto_exit_timer_ID = null;
}
hints_minibuffer_state.prototype = {
    __proto__: basic_minibuffer_state.prototype,
    manager : null,
    typed_string : "",
    typed_number : "",
    load : function (frame) {
        if (!this.manager)
            this.manager = new hint_manager(frame.buffers.current.content_window, this.xpath_expr);
        this.manager.update_valid_hints();
    },
    unload : function (frame) {
        this.manager.hide_hints();
    },
    destroy : function () {
        this.manager.remove();
    },
    update_minibuffer : function (frame) {
        var str = this.typed_string;
        if (this.typed_number.length > 0) {
            str += " #" + this.typed_number;
        }
        frame.minibuffer._input_text = str;
        frame.minibuffer._set_selection();
    }
};

/* USER PREFERENCE */
var hints_auto_exit_delay = 800;

function hints_handle_character(frame, s, e) {
    /* Check for numbers */
    var ch = String.fromCharCode(e.charCode);
    var auto_exit = false;
    /* TODO: implement number escaping */
    if (e.charCode >= 48 && e.charCode <= 57) {
        // Number entered
        s.typed_number += ch;
        s.manager.select_hint(parseInt(s.typed_number));
        var num = s.manager.current_hint_number;
        if (s.auto_exit && num > 0 && num <= s.manager.valid_hints.length
            && num * 10 > s.manager.valid_hints.length)
            auto_exit = true;
    } else {
        s.typed_number = "";
        s.typed_string += ch;
        s.manager.current_hint_string = s.typed_string;
        s.manager_current_hint_number = 1;
        s.manager.update_valid_hints();
        if (s.auto_exit && s.manager.valid_hints.length == 1)
            auto_exit = true;
    }
    if (auto_exit) {
        if (this.auto_exit_timer_ID) {
            frame.clearTimeout(this.auto_exit_timer_ID);
        }
        this.auto_exit_timer_ID = frame.setTimeout(function() { hints_exit(frame, s); },
                                                   hints_auto_exit_delay);
    }
    s.update_minibuffer(frame);
}
interactive("hints-handle-character", hints_handle_character,
            I.current_frame, I.minibuffer_state(hints_minibuffer_state), I.e);

function hints_backspace(frame, s) {
    if (s.typed_number.length > 0) {
        s.typed_number = s.typed_number.substring(0, s.typed_number.length - 1);
        var num = s.typed_number.length > 0 ? parseInt(s.typed_number) : 1;
        s.manager.select_hint(num);
    } else if (s.typed_string.length > 0) {
        s.typed_string = s.typed_string.substring(0, s.typed_string.length - 1);
        s.manager.current_hint_string = s.typed_string;
        s.manager_current_hint_number = 1;
        s.manager.update_valid_hints();
    }
    s.update_minibuffer(frame);
}
interactive("hints-backspace", hints_backspace,
            I.current_frame, I.minibuffer_state(hints_minibuffer_state));

function hints_next(frame, s, count) {
    s.typed_number = "";
    var cur = s.manager.current_hint_number - 1;
    var vh = s.manager.valid_hints;
    if (vh.length > 0) {
        cur = (cur + count) % vh.length;
        if (cur < 0)
            cur += vh.length;
        s.manager.select_hint(cur + 1);
    }
    s.update_minibuffer(frame);
}
interactive("hints-next", hints_next,
            I.current_frame, I.minibuffer_state(hints_minibuffer_state), I.p);

interactive("hints-previous", hints_next,
            I.current_frame, I.minibuffer_state(hints_minibuffer_state),
            I.bind(function (x) {return -x;}, I.p));

function hints_abort(frame, s) {
    if (this.auto_exit_timer_ID) {
        frame.clearTimeout(this.auto_exit_timer_ID);
        this.auto_exit_timer_ID = null;
    }
    frame.minibuffer.pop_state();
    if (s.abort_callback)
        s.abort_callback();
}

interactive("hints-abort", hints_abort,
            I.current_frame, I.minibuffer_state(hints_minibuffer_state));

function hints_exit(frame, s)
{
    if (this.auto_exit_timer_ID) {
        frame.clearTimeout(this.auto_exit_timer_ID);
        this.auto_exit_timer_ID = null;
    }
    var cur = s.manager.current_hint_number - 1;
    if (cur >= 0 && cur < s.manager.valid_hints.length)
    {
        var elem = s.manager.valid_hints[cur].elem;
        frame.minibuffer.pop_state();
        if (s.callback)
            s.callback(elem);
    }
}

interactive("hints-exit", hints_exit,
            I.current_frame, I.minibuffer_state(hints_minibuffer_state));

I.hinted_element = interactive_method(
    $doc = "DOM element chosen using the hints system",
    $async = function (ctx, cont) {
        keywords(arguments);
        var s = new hints_minibuffer_state(forward_keywords(arguments), $callback = cont);
        ctx.frame.minibuffer.push_state(s);
    });

function element_focus(buffer, elem)
{
    var elemTagName = elem.localName;
    if (elemTagName == "FRAME" || elemTagName == "IFRAME")
    {
        elem.contentWindow.focus();
        return false;
    }

    elem.focus();

    var doc = elem.ownerDocument;

    var evt = doc.createEvent("MouseEvents");
    var x = 0;
    var y = 0;
    // for imagemap
    if (elemTagName == "area")
    {
        var coords = elem.getAttribute("coords").split(",");
        x = Number(coords[0]);
        y = Number(coords[1]);
    }

    var doc = elem.ownerDocument;

    evt.initMouseEvent("mouseover", true, true, doc.defaultView, 1, x, y, 0, 0, 0, 0, 0, 0, 0, null);
    elem.dispatchEvent(evt);
}
interactive("hinted-focus-element", element_focus,
            I.current_buffer, I.hinted_element($prompt = "Focus:"));

function element_follow(buffer, elem)
{
    var elemTagName = elem.localName;
    elem.focus();
    if (elemTagName == "FRAME" || elemTagName == "IFRAME")
        return;

    var x = 1, y = 1;
    // for imagemap
    if (elemTagName == "area")
    {
        var coords = elem.getAttribute("coords").split(",");
        x = Number(coords[0]) + 1;
        y = Number(coords[1]) + 1;
    }
    
    var doc = elem.ownerDocument;
    var view = doc.defaultView;

    var evt = doc.createEvent("MouseEvents");
    /* FIXME: maybe use modifiers to indicate new tab/new window etc. behavior */
    evt.initMouseEvent("mousedown", true, true, view, 1, x, y, 0, 0, /*ctrl*/ 0, /*event.altKey*/0,
                       /*event.shiftKey*/ 0, /*event.metaKey*/ 0, 0, null);
    elem.dispatchEvent(evt);

    evt.initMouseEvent("click", true, true, view, 1, x, y, 0, 0, /*ctrl*/ 0, /*event.altKey*/0,
                       /*event.shiftKey*/ 0, /*event.metaKey*/ 0, 0, null);
    elem.dispatchEvent(evt);
}

interactive("hinted-follow-element", element_follow,
            I.current_buffer, I.hinted_element($prompt = "Follow:"));



interactive("hinted-focus-frame", element_focus,
            I.current_buffer,
            I.hinted_element(
                $prompt = "Frame:",
                $hint_xpath_expression = "//xhtml:frame | //xhtml:iframe | //iframe | //frame"
                ));

