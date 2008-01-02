require("content-buffer.js");

define_buffer_local_hook("content_buffer_input_mode_change_hook");
define_current_buffer_hook("current_content_buffer_input_mode_change_hook", "content_buffer_input_mode_change_hook");

function define_content_buffer_input_mode(base_name, keymap_name) {
    var name = "content_buffer_" + base_name + "_input_mode";
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
        content_buffer_input_mode_change_hook.run(buffer);
    }
    var hyphen_name = name.replace("_","-","g");
    interactive(hyphen_name, conkeror[name], I.current_buffer(content_buffer));
}

define_content_buffer_input_mode("normal", "content_buffer_normal_keymap");

// For SELECT elements
define_content_buffer_input_mode("select", "content_buffer_select_keymap");

// For text INPUT and TEXTAREA elements
define_content_buffer_input_mode("text", "content_buffer_text_keymap");
define_content_buffer_input_mode("textarea", "content_buffer_textarea_keymap");

define_content_buffer_input_mode("quote_next", "content_buffer_quote_next_keymap");
define_content_buffer_input_mode("quote", "content_buffer_quote_keymap");

add_hook("content_buffer_focus_change_hook", function (buffer) {
        var form_input_mode_enabled =
            buffer.content_buffer_text_input_mode_enabled ||
            buffer.content_buffer_textarea_input_mode_enabled ||
            buffer.content_buffer_select_input_mode_enabled;

        if (form_input_mode_enabled || buffer.content_buffer_normal_input_mode_enabled) {
            var elem = buffer.focused_element;

            if (elem) {
                var input_mode_function = null;
                if (elem instanceof Ci.nsIDOMHTMLInputElement) {
                    var type = elem.getAttribute("type");
                    if (type != null) type = type.toLowerCase();
                    if (type != "radio" &&
                        type != "checkbox" &&
                        type != "submit" &&
                        type != "reset")
                        input_mode_function = content_buffer_text_input_mode;
                }
                else if (elem instanceof Ci.nsIDOMHTMLTextAreaElement)
                    input_mode_function = content_buffer_textarea_input_mode;

                else if (elem instanceof Ci.nsIDOMHTMLSelectElement)
                    input_mode_function = content_buffer_select_input_mode;

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
            content_buffer_normal_input_mode(buffer);
        }
    });

function browser_input_minibuffer_status(window) {
    this.window = window;
    var element = create_XUL(window, "label");
    element.setAttribute("id", "minibuffer-input-status");
    element.collapsed = true;
    element.setAttribute("class", "minibuffer");
    var insert_before = window.document.getElementById("minibuffer-prompt");
    insert_before.parentNode.insertBefore(element, insert_before);
    this.element = element;
    this.select_buffer_hook_func = add_hook.call(window, "select_buffer_hook", method_caller(this, this.update));
    this.mode_change_hook_func = add_hook.call(window, "current_content_buffer_input_mode_change_hook",
                                               method_caller(this, this.update));
    this.update();
}
browser_input_minibuffer_status.prototype = {
    update : function () {
        var buf = this.window.buffers.current;
        if (buf.content_buffer_normal_input_mode_enabled) {
            this.element.collapsed = true;
            this.window.minibuffer.element.className = "";
        } else {
            var name = "";
            var className = null;
            if (buf.content_buffer_text_input_mode_enabled) {
                name = "[TEXT INPUT]";
                className = "text";
            } else if (buf.content_buffer_textarea_input_mode_enabled) {
                name = "[TEXTAREA INPUT]";
                className = "textarea";
            } else if (buf.content_buffer_select_input_mode_enabled) {
                name = "[SELECT INPUT]";
                className = "select";
            } else if (buf.content_buffer_quote_next_input_mode_enabled) {
                name = "[PASS THROUGH (next)]";
                className = "quote-next";
            } else if (buf.content_buffer_quote_input_mode_enabled) {
                name = "[PASS THROUGH]";
                className = "quote";
            } else /* error */;

            this.element.value = name;
            this.element.collapsed = false;
            this.window.minibuffer.element.className = "minibuffer-" + className + "-input-mode";
        }
    },
    uninstall : function () {
        remove_hook.call(window, "select_buffer_hook", this.select_buffer_hook_func);
        remove_hook.call(window, "current_content_buffer_input_mode_change_hook",
                         method_caller(this, this.update), this.mode_change_hook_func);
        this.element.parentNode.removeChild(this.element);
    }
};

function browser_input_minibuffer_status_install(window) {
    if (window.browser_input_minibuffer_status)
        throw new Error("browser input minibuffer status already initialized for window");
    window.browser_input_minibuffer_status = new browser_input_minibuffer_status(window);
}

function browser_input_minibuffer_status_uninstall(window) {
    if (window.browser_input_minibuffer_status)
        return;
    window.browser_input_minibuffer_status.uninstall();
    delete window.browser_input_minibuffer_status;
}

define_global_mode("browser_input_minibuffer_status_mode",
                   function () { // enable
                       add_hook("window_initialize_hook", browser_input_minibuffer_status_install);
                       for_each_window(browser_input_minibuffer_status_install);
                   },
                   function () { // disable
                       remove_hook("window_initialize_hook", browser_input_minibuffer_status_install);
                       for_each_window(browser_input_minibuffer_status_uninstall);
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
    "//select | //xhtml:select | " +
    "//textarea | //xhtml:textarea | " +
    "//textbox | //xul:textbox";

function browser_focus_next_form_field(buffer, count, xpath_expr) {
    var focused_elem = buffer.focused_element;
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

    var focused_win = buffer.focused_frame;
    var elem = helper(focused_win, null);
    if (!elem)
        elem = helper(buffer.top_frame, focused_win);
    if (elem) {
        browser_element_focus(buffer, elem);
    } else
        throw interactive_error("No form field found");
}

interactive("browser-focus-next-form-field",
            browser_focus_next_form_field,
            I.current_buffer(content_buffer),
            I.p,
            browser_form_field_xpath_expression);

interactive("browser-focus-previous-form-field",
            browser_focus_next_form_field,
            I.current_buffer(content_buffer),
            I.bind(function (x) {return -x;}, I.p),
            browser_form_field_xpath_expression);

function edit_field_in_external_editor(buffer, elem) {
    if (elem instanceof Ci.nsIDOMHTMLInputElement) {
        var type = elem.getAttribute("type");
        if (type != null)
            type = type.toLowerCase();
        if (type == "hidden" || type == "checkbox" || type == "radio")
            throw interactive_error("Element is not a text field.");
    } else if (!(elem instanceof Ci.nsIDOMHTMLTextAreaElement))
        throw interactive_error("Element is not a text field.");

    var file = file_locator.get("TmpD", Ci.nsIFile);
    var name = elem.getAttribute("name") || "";
    name = name.replace(/[^a-zA-Z0-9\-_]/g, "");
    if (name.length == 0)
        name = "text";
    name += ".txt";
    file.append(name);
    file.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, 0600);

    // Write to file
    try {
        write_text_file(file, elem.value);
    } catch (e) {
        file.remove(false);
        throw e;
    }

    var old_readonly = elem.getAttribute("readonly");
    elem.setAttribute("readonly", "true");
    // FIXME: decide if we should do this
    //var oldBg = elem.style.backgroundColor;
    //elem.style.backgroundColor = "#bbbbbb";
    function cleanup() {
        if (old_readonly)
            elem.setAttribute("readonly", old_readonly);
        else
            elem.removeAttribute("readonly");
        file.remove(false);
    }
    spawn_process(editor_program, [file.path], function () {
            try {
                elem.value = read_text_file(file);
            } catch (e) {
            }
            // FIXME: flash the textbox?
            cleanup();
        },
        cleanup);
}
interactive("edit-current-field-in-external-editor",
            edit_field_in_external_editor,
            I.current_buffer(content_buffer),
            I.focused_element);
