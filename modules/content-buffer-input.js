/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 * (C) Copyright 2008 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("content-buffer.js");

define_current_buffer_hook("current_buffer_input_mode_change_hook", "input_mode_change_hook");

var content_buffer_input_mode_keymaps = {};

function define_input_mode(base_name, display_name, keymap_name, doc) {
    var name = base_name + "_input_mode";
    content_buffer_input_mode_keymaps[name] = keymap_name;
    define_buffer_mode(name,
                       display_name,
                       $class = "input_mode",
                       $enable = function (buffer) { check_buffer(buffer, content_buffer);
                                                     content_buffer_update_keymap_for_input_mode(buffer); },
                       $disable = false,
                       $doc = doc);
}
ignore_function_for_get_caller_source_code_reference("define_input_mode");

function content_buffer_update_keymap_for_input_mode(buffer) {
    if (buffer.input_mode)
        buffer.keymap = buffer.get(content_buffer_input_mode_keymaps[buffer.input_mode]);
}

add_hook("page_mode_change_hook", content_buffer_update_keymap_for_input_mode);

add_hook("content_buffer_location_change_hook", function (buf) { normal_input_mode(buf, true); });

define_input_mode("normal", null, "content_buffer_normal_keymap");

// For SELECT elements
define_input_mode("select", "input:SELECT", "content_buffer_select_keymap");

// For text INPUT and TEXTAREA elements
define_input_mode("text", "input:TEXT", "content_buffer_text_keymap");
define_input_mode("textarea", "input:TEXTAREA", "content_buffer_textarea_keymap");
define_input_mode("richedit", "input:RICHEDIT", "content_buffer_richedit_keymap");

define_input_mode("checkbox", "input:CHECKBOX/RADIOBUTTON", "content_buffer_checkbox_keymap");

define_input_mode(
    "quote_next", "input:PASS-THROUGH(next)", "content_buffer_quote_next_keymap",
    "This input mode sends the next key combo to the buffer, "+
        "bypassing Conkeror's normal key handling.  The mode disengages "+
        "after one key combo.");
define_input_mode(
    "quote", "input:PASS-THROUGH", "content_buffer_quote_keymap",
    "This input mode sends all key combos to the buffer, "+
        "bypassing Conkeror's normal key handling, until the "+
        "Escape key is pressed.");

function content_buffer_update_input_mode_for_focus(buffer, force) {
    var mode = buffer.input_mode;
    var form_input_mode_enabled = (mode == "text_input_mode" ||
                                   mode == "textarea_input_mode" ||
                                   mode == "select_input_mode" ||
                                   mode == "checkbox_input_mode" ||
                                   mode == "richedit_input_mode");

    if (force || form_input_mode_enabled || mode == "normal_input_mode") {
        let elem = buffer.focused_element;

        if (elem) {
            var input_mode_function = null;
            if (elem instanceof Ci.nsIDOMHTMLInputElement) {
                var type = elem.getAttribute("type");
                if (type != null) type = type.toLowerCase();
                if (type == "checkbox" || type == "radio")
                    input_mode_function = checkbox_input_mode;
                else if (type != "submit" &&
                         type != "reset")
                    input_mode_function = text_input_mode;
            }
            else if (elem instanceof Ci.nsIDOMHTMLTextAreaElement)
                input_mode_function = textarea_input_mode;

            else if (elem instanceof Ci.nsIDOMHTMLSelectElement)
                input_mode_function = select_input_mode;
        }

        if (!input_mode_function) {

            let frame = buffer.focused_frame;
            let in_design_mode = false;
            if (frame && frame.document.designMode == "on")
                in_design_mode = true;
            else {
                outer:
                while (elem) {
                    switch (elem.contentEditable) {
                    case "true":
                        in_design_mode = true;
                        break outer;
                    case "false":
                        break outer;
                    default: // == "inherit"
                        elem = elem.parentNode;
                    }
                }
            }
            if (in_design_mode)
                input_mode_function = richedit_input_mode;
        }

        if (input_mode_function) {
            if (!force &&
                browser_prevent_automatic_form_focus_mode_enabled &&
                !form_input_mode_enabled &&
                (buffer.last_user_input_received == null ||
                 (Date.now() - buffer.last_user_input_received)
                 > browser_automatic_form_focus_window_duration)) {
                // Automatic focus attempt blocked
                elem.blur();
            } else
                input_mode_function(buffer, true);
            return;
        }

        normal_input_mode(buffer, true);
    }
}

add_hook("content_buffer_focus_change_hook", function (buf) { content_buffer_update_input_mode_for_focus(buf, false); } );

interactive("content-buffer-update-input-mode-for-focus", function (I) {
    content_buffer_update_input_mode_for_focus(I.buffer, true);
});

function minibuffer_input_mode_indicator(window) {
    this.window = window;
    this.hook_func = method_caller(this, this.update);
    add_hook.call(window, "select_buffer_hook", this.hook_func);
    add_hook.call(window, "current_buffer_input_mode_change_hook", this.hook_func);
    this.update();
}

minibuffer_input_mode_indicator.prototype = {
    update : function () {
        var buf = this.window.buffers.current;
        var mode = buf.input_mode;
        if (mode)
            this.window.minibuffer.element.className = "minibuffer-" + buf.input_mode.replace("_","-","g");
    },
    uninstall : function () {
        remove_hook.call(window, "select_buffer_hook", this.hook_func);
        remove_hook.call(window, "current_buffer_input_mode_change_hook", this.hook_func);
    }
};

define_global_window_mode("minibuffer_input_mode_indicator", "window_initialize_hook");
minibuffer_input_mode_indicator_mode(true);

// Milliseconds
define_variable("browser_automatic_form_focus_window_duration", 20, "Time window (in milliseconds) during which a form element is allowed to gain focus following a mouse click or key press, if `browser_prevent_automatic_form_focus_mode' is enabled.");;

define_global_mode("browser_prevent_automatic_form_focus_mode",
                   function () {}, // enable
                   function () {} // disable
                  );
browser_prevent_automatic_form_focus_mode(true);

define_variable(
    "browser_form_field_xpath_expression",
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
        "//textbox | //xul:textbox",
    "XPath expression matching elements to be selected by `browser-focus-next-form-field' " +
        "and `browser-focus-previous-form-field.'");

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

interactive("browser-focus-next-form-field", "Focus the next element matching `browser_form_field_xpath_expression'.",
            function (I) {
                browser_focus_next_form_field(I.buffer, I.p, browser_form_field_xpath_expression);
            });

interactive("browser-focus-previous-form-field",  "Focus the previous element matching `browser_form_field_xpath_expression'.",
            function (I) {
                browser_focus_next_form_field(I.buffer, -I.p, browser_form_field_xpath_expression);
            });

function edit_field_in_external_editor(buffer, elem) {
    if (elem instanceof Ci.nsIDOMHTMLInputElement) {
        var type = elem.getAttribute("type");
        if (type != null)
            type = type.toLowerCase();
        if (type == "hidden" || type == "checkbox" || type == "radio")
            throw interactive_error("Element is not a text field.");
    } else if (!(elem instanceof Ci.nsIDOMHTMLTextAreaElement))
        throw interactive_error("Element is not a text field.");

    var name = elem.getAttribute("name");
    if (!name || name.length == 0)
        name = elem.getAttribute("id");
    if (!name)
        name = "";
    name = name.replace(/[^a-zA-Z0-9\-_]/g, "");
    if (name.length == 0)
        name = "text";
    name += ".txt";
    var file = get_temporary_file(name);

    // Write to file
    try {
        write_text_file(file, elem.value);
    } catch (e) {
        file.remove(false);
        throw e;
    }

    // FIXME: decide if we should do this
    var old_class = elem.className;
    elem.className = "__conkeror_textbox_edited_externally " + old_class;

    try {
        yield open_file_with_external_editor(file);

        elem.value = read_text_file(file);
    } finally {
        elem.className = old_class;

        file.remove(false);
    }
}
interactive("edit-current-field-in-external-editor", "Edit the contents of the currently-focused text field in an external editor.",
            function (I) {
                var buf = I.buffer;
                yield edit_field_in_external_editor(buf, buf.focused_element);
                unfocus(buf);
            });

define_variable("kill_whole_line", false, "If true, `kill-line' with no arg at beg of line kills the whole line.");

function cut_to_end_of_line (buffer) {
    var elem = buffer.focused_element;
    try {
        var st = elem.selectionStart;
        var en = elem.selectionEnd;
        if (st == en) {
            // there is no selection.  set one up.
            var eol = elem.value.indexOf ("\n", en);
            if (eol == -1)
            {
                elem.selectionEnd = elem.textLength;
            } else if (eol == st) {
                elem.selectionEnd = eol + 1;
            } else if (kill_whole_line &&
                       (st == 0 || elem.value[st - 1] == "\n"))
            {
                elem.selectionEnd = eol + 1;
            } else {
                elem.selectionEnd = eol;
            }
        }
        buffer.do_command ('cmd_cut');
    } catch (e) {
        /* FIXME: Make this work for richedit mode as well */
    }
}

interactive (
    "cut-to-end-of-line",
    function (I) {
        cut_to_end_of_line (I.buffer);
    });
