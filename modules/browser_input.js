require("browser_buffer.js");

define_buffer_local_hook("browser_buffer_input_mode_change_hook");
define_current_buffer_hook("current_browser_buffer_input_mode_change_hook", "browser_buffer_input_mode_change_hook");

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
        browser_buffer_input_mode_change_hook.run(buffer);
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
        var form_input_mode_enabled =
            buffer.browser_buffer_text_input_mode_enabled ||
            buffer.browser_buffer_textarea_input_mode_enabled ||
            buffer.browser_buffer_select_input_mode_enabled;

        if (form_input_mode_enabled || buffer.browser_buffer_normal_input_mode_enabled) {
            var elem = buffer.focused_element();

            if (elem) {
                var input_mode_function = null;
                if (elem instanceof Ci.nsIDOMHTMLInputElement) {
                    var type = elem.getAttribute("type");
                    if (type != null) type = type.toLowerCase();
                    if (type != "radio" &&
                        type != "checkbox" &&
                        type != "submit" &&
                        type != "reset")
                        input_mode_function = browser_buffer_text_input_mode;
                }
                else if (elem instanceof Ci.nsIDOMHTMLTextAreaElement)
                    input_mode_function = browser_buffer_textarea_input_mode;

                else if (elem instanceof Ci.nsIDOMHTMLSelectElement)
                    input_mode_function = browser_buffer_select_input_mode;

                if (input_mode_function) {
                    if (browser_prevent_automatic_form_focus_mode_enabled &&
                        !form_input_mode_enabled &&
                        (buffer.last_user_input_received == null ||
                         (Date.now() - buffer.last_user_input_received)
                         > browser_automatic_form_focus_window_duration)) {
                        // Automatic focus attempt blocked
                        elem.blur();
                    } else
                        input_mode_function(buffer);
                    return;
                }
            }
            browser_buffer_normal_input_mode(buffer);
        }
    });

function browser_input_minibuffer_status(frame) {
    this.frame = frame;
    var element = create_XUL(frame, "label");
    element.setAttribute("id", "minibuffer-input-status");
    element.collapsed = true;
    element.setAttribute("class", "minibuffer");
    var insert_before = frame.document.getElementById("minibuffer-prompt");
    insert_before.parentNode.insertBefore(element, insert_before);
    this.element = element;
    this.select_buffer_hook_func = add_hook.call(frame, "select_buffer_hook", method_caller(this, this.update));
    this.mode_change_hook_func = add_hook.call(frame, "current_browser_buffer_input_mode_change_hook",
                                               method_caller(this, this.update));
    this.update();
}
browser_input_minibuffer_status.prototype = {
    update : function () {
        var buf = this.frame.buffers.current;
        if (buf.browser_buffer_normal_input_mode_enabled) {
            this.element.collapsed = true;
            this.frame.minibuffer.element.className = "";
        } else {
            var name = "";
            var className = null;
            if (buf.browser_buffer_text_input_mode_enabled) {
                name = "[TEXT INPUT]";
                className = "text";
            } else if (buf.browser_buffer_textarea_input_mode_enabled) {
                name = "[TEXTAREA INPUT]";
                className = "textarea";
            } else if (buf.browser_buffer_select_input_mode_enabled) {
                name = "[SELECT INPUT]";
                className = "select";
            } else if (buf.browser_buffer_quote_next_input_mode_enabled) {
                name = "[PASS THROUGH (next)]";
                className = "quote-next";
            } else if (buf.browser_buffer_quote_input_mode_enabled) {
                name = "[PASS THROUGH]";
                className = "quote";
            } else /* error */;

            this.element.value = name;
            this.element.collapsed = false;
            this.frame.minibuffer.element.className = "minibuffer-" + className + "-input-mode";
        }
    },
    uninstall : function () {
        remove_hook.call(frame, "select_buffer_hook", this.select_buffer_hook_func);
        remove_hook.call(frame, "current_browser_buffer_input_mode_change_hook",
                         method_caller(this, this.update), this.mode_change_hook_func);
        this.element.parentNode.removeChild(this.element);
    }
};

function browser_input_minibuffer_status_install(frame) {
    if (frame.browser_input_minibuffer_status)
        throw new Error("browser input minibuffer status already initialized for frame");
    frame.browser_input_minibuffer_status = new browser_input_minibuffer_status(frame);
}

function browser_input_minibuffer_status_uninstall(frame) {
    if (frame.browser_input_minibuffer_status)
        return;
    frame.browser_input_minibuffer_status.uninstall();
    delete frame.browser_input_minibuffer_status;
}

define_global_mode("browser_input_minibuffer_status_mode",
                   function () { // enable
                       add_hook("frame_initialize_hook", browser_input_minibuffer_status_install);
                       for_each_frame(browser_input_minibuffer_status_install);
                   },
                   function () { // disable
                       remove_hook("frame_initialize_hook", browser_input_minibuffer_status_install);
                       for_each_frame(browser_input_minibuffer_status_uninstall);
                   });
browser_input_minibuffer_status_mode(true);

/* USER PREFERENCE */
// Milliseconds
var browser_automatic_form_focus_window_duration = 20;

define_global_mode("browser_prevent_automatic_form_focus_mode",
                   function () {}, // enable
                   function () {} // disable
                   );
browser_prevent_automatic_form_focus_mode(true);

var browser_form_field_xpath_expression =
    "//input[" + (
//        "translate(@type,'RADIO','radio')!='radio' and " +
//        "translate(@type,'CHECKBOX','checkbox')!='checkbox' and " +
        "translate(@type,'HIDEN','hiden')!='hidden'"
//        "translate(@type,'SUBMIT','submit')!='submit' and " +
//        "translate(@type,'REST','rest')!='reset'"
        ) +  "] | " +
    "//xhtml:input[" + (
//        "translate(@type,'RADIO','radio')!='radio' and " +
//        "translate(@type,'CHECKBOX','checkbox')!='checkbox' and " +
        "translate(@type,'HIDEN','hiden')!='hidden'"
//        "translate(@type,'SUBMIT','submit')!='submit' and " +
//        "translate(@type,'REST','rest')!='reset'"
        ) +  "] |" +
    "//select | //xhtml:select" +
    "//textarea | //xhtml:textarea";

function browser_focus_next_form_field(buffer, count, xpath_expr) {
    var focused_elem = buffer.focused_element();
    if (count == 0)
        return; // invalid count

    function helper(win, skip_win) {
        if (win == skip_win)
            return null;
        var doc = win.document;
        var res = doc.evaluate(xpath_expr, doc, xpath_lookup_namespace,
                               Ci.nsIDOMXPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                               null /* existing results */);
        var length = res.snapshotLength;
        if (length > 0) {
            var index = null;
            if (focused_elem != null) {
                for (var i = 0; i < length; ++i) {
                    if (res.snapshotItem(i) == focused_elem) {
                        index = i;
                        break;
                    }
                }
            }
            if (index == null) {
                if (count > 0)
                    index = count - 1;
                else
                    index = -count;
            }
            else
                index = index + count;
            index = index % length;
            if (index < 0)
                index += length;

            return res.snapshotItem(index);
        }

        // Recurse on sub-frames
        for (var i = 0; i < win.frames.length; ++i) {
            var elem = helper(win.frames[i], skip_win);
            if (elem)
                return elem;
        }
        return null;
    }

    var focused_win = buffer.focused_window();
    var elem = helper(focused_win, null);
    if (!elem)
        elem = helper(buffer.content_window, focused_win);
    if (elem) {
        browser_element_focus(buffer, elem);
    } else
        throw interactive_error("No form field found");
}

interactive("browser-focus-next-form-field",
            browser_focus_next_form_field,
            I.current_buffer(browser_buffer),
            I.p,
            browser_form_field_xpath_expression);

interactive("browser-focus-previous-form-field",
            browser_focus_next_form_field,
            I.current_buffer(browser_buffer),
            I.bind(function (x) {return -x;}, I.p),
            browser_form_field_xpath_expression);
