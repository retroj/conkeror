/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 * (C) Copyright 2008-2009 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

/**
 * This file contains the default input-mode system.  An input-mode
 * system is a set of input-modes along with code that coordinates
 * switching among them based on user actions and focus-context.
 */

require("content-buffer.js");

/*
 * DEFAULT INPUT-MODE SYSTEM
 */

// Input mode for "normal" view mode.  You might also call it "scroll" mode.
define_input_mode("normal", null, "content_buffer_normal_keymap");

// Input modes for form elements
define_input_mode("select", "input:SELECT", "content_buffer_select_keymap");
define_input_mode("text", "input:TEXT", "content_buffer_text_keymap");
define_input_mode("textarea", "input:TEXTAREA", "content_buffer_textarea_keymap");
define_input_mode("richedit", "input:RICHEDIT", "content_buffer_richedit_keymap");
define_input_mode("checkbox", "input:CHECKBOX/RADIOBUTTON", "content_buffer_checkbox_keymap");


/**
 * content_buffer_update_input_mode_for_focus is the controller for
 * this input-mode system.  It sets the input-mode based on the focused
 * element or lack thereof in the given buffer.  By default, it will
 * not override input-modes such as caret-mode, which have been turned
 * on explicitly by the user.  If force is true, then this function
 * will even override those special input-modes.
 */
function content_buffer_update_input_mode_for_focus (buffer, force) {
    var mode = buffer.input_mode;
    var form_input_mode_enabled = (mode == "text_input_mode" ||
                                   mode == "textarea_input_mode" ||
                                   mode == "select_input_mode" ||
                                   mode == "checkbox_input_mode" ||
                                   mode == "richedit_input_mode");

    if (force || form_input_mode_enabled ||
        mode == "normal_input_mode" || mode == null)
    {
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
                browser_prevent_automatic_form_focus_mode_enabled && //XXX: breaks abstraction
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

//XXX: why does this command exist?  if the input-mode system works correctly
//     then the user should never have to call this.
interactive("content-buffer-update-input-mode-for-focus",
    "This command provides a way for the user to force a reset of the"+
    "input-mode system.",
    function (I) {
        content_buffer_update_input_mode_for_focus(I.buffer, true);
    });


/**
 * Install the default input-mode system
 */
add_hook("content_buffer_location_change_hook",
         content_buffer_update_input_mode_for_focus);

add_hook("content_buffer_focus_change_hook",
         content_buffer_update_input_mode_for_focus);


/*
 * QUOTE INPUT MODES
 */

// Input modes for sending key events to gecko
//
// XXX: These quote modes are not rightly part of the system because
// they are always invoked by the user.  Furthermore, they should be
// generalized to work with any type of buffer.
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

define_key_match_predicate('match_not_escape_key', 'any key but escape',
    function (event) {
        return event.keyCode != 27 ||
            event.shiftKey ||
            event.altKey ||
            event.metaKey ||
            event.ctrlKey;
    });


/*
 * CARET INPUT MODE
 */

// Input mode for the visible caret
//
// XXX: caret-mode should be defined elsewhere, as it is not part of
// the input-mode system.
define_input_mode("caret", null, "content_buffer_caret_keymap");

define_buffer_mode('caret_mode', 'CARET',
                   $enable = function(buffer) {
                       buffer.browser.setAttribute('showcaret', 'true');
                       let sc = getFocusedSelCtrl(buffer);
                       sc.setCaretEnabled(true);
                       buffer.top_frame.focus();
                       caret_input_mode(buffer, true);
                   },
                   $disable = function(buffer) {
                       buffer.browser.setAttribute('showcaret', '');
                       let sc = getFocusedSelCtrl(buffer);
                       sc.setCaretEnabled(false);
                       buffer.browser.focus();
                       //XXX: dependency on the default input-mode system
                       content_buffer_update_input_mode_for_focus(buffer, true);
                   });

//XXX: CARET_PREF is defined in find.js---why?
watch_pref(CARET_PREF, function() {
               if (get_pref(CARET_PREF)) {
                   session_pref(CARET_PREF, false);
                   let window = window_watcher.activeWindow;
                   let buffer = window.buffers.current;
                   caret_mode(buffer);
               }
           });



/*
 * Browser Prevent Automatic Form Focus Mode
 */

// Milliseconds
define_variable("browser_automatic_form_focus_window_duration", 20,
                "Time window (in milliseconds) during which a form element "+
                "is allowed to gain focus following a mouse click or key "+
                "press, if `browser_prevent_automatic_form_focus_mode' is "+
                "enabled.");;

define_global_mode("browser_prevent_automatic_form_focus_mode",
                   function () {}, // enable
                   function () {} // disable
                  );

// note: The apparent misspellings here are not a bug.
// see https://developer.mozilla.org/en/XPath/Functions/translate
//
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

function focus_next (buffer, count, xpath_expr, name) {
    var focused_elem = buffer.focused_element;
    if (count == 0)
        return; // invalid count

    function helper (win, skip_win) {
        if (win == skip_win)
            return null;
        var doc = win.document;
        var res = doc.evaluate(xpath_expr, doc, xpath_lookup_namespace,
            Ci.nsIDOMXPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
            null /* existing results */);
        var length = res.snapshotLength;
        if (length > 0) {
            let valid_nodes = [];
            for (let i = 0; i < length; ++i) {
                let elem = res.snapshotItem(i);
                if (elem.offsetWidth == 0 ||
                    elem.offsetHeight == 0)
                    continue;
                let style = win.getComputedStyle(elem, "");
                if (style.display == "none" || style.visibility == "hidden")
                    continue;
                valid_nodes.push(elem);
            }

            if (valid_nodes.length > 0) {
                var index = -1;
                if (focused_elem != null)
                    index = valid_nodes.indexOf(focused_elem);
                if (index == -1) {
                    if (count > 0)
                        index = count - 1;
                    else
                        index = -count;
                }
                else
                    index = index + count;
                index = index % valid_nodes.length;
                if (index < 0)
                    index += valid_nodes.length;

                return valid_nodes[index];
            }
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
        // if focused_frame is top_frame, we're doing twice as much
        // work as necessary
        elem = helper(buffer.top_frame, focused_win);
    if (elem)
        browser_element_focus(buffer, elem);
    else
        throw interactive_error("No "+name+" found");
}

interactive("browser-focus-next-form-field",
            "Focus the next element matching "+
            "`browser_form_field_xpath_expression'.",
            function (I) {
                focus_next(I.buffer, I.p,
                           browser_form_field_xpath_expression,
                           "form field");
            });

interactive("browser-focus-previous-form-field",
            "Focus the previous element matching "+
            "`browser_form_field_xpath_expression'.",
            function (I) {
                focus_next(I.buffer, -I.p,
                           browser_form_field_xpath_expression,
                           "form field");
            });


define_variable("links_xpath_expression",
    "//*[@onclick or @onmouseover or @onmousedown or "+
        "@onmouseup or @oncommand or @role='link'] | " +
    "//input[not(@type='hidden')] | //a | //area | "+
    "//iframe | //textarea | //button | //select",
    "XPath expression matching elements to be selected by "+
    "`focus-next-link' and `focus-previous-link.'");

interactive("focus-next-link",
            "Focus the next element matching `links_xpath_expression'.",
            function (I) {
                focus_next(I.buffer, I.p,
                           links_xpath_expression,
                           "link");
            });

interactive("focus-previous-link",
            "Focus the previous element matching `links_xpath_expression'.",
            function (I) {
                focus_next(I.buffer, -I.p,
                           links_xpath_expression,
                           "link");
            });


define_variable('edit_field_in_external_editor_extension', "txt",
    "File extension for the temp files created by "+
    "edit-current-field-in-external-editor.");

function get_filename_for_current_textfield (doc, elem) {
    var name = doc.URL
        + "-"
        + ( elem.getAttribute("name")
            || elem.getAttribute("id")
            || "textarea" );

    // get rid filesystem unfriendly chars
    name = name.replace(doc.location.protocol, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/(^-+|-+$)/g, "")
        + '.' + edit_field_in_external_editor_extension;

    return name;
}

function edit_field_in_external_editor (buffer, elem) {
    if (elem instanceof Ci.nsIDOMHTMLInputElement) {
        var type = elem.getAttribute("type");
        if (type != null)
            type = type.toLowerCase();
        if (type == "hidden" || type == "checkbox" || type == "radio")
            throw interactive_error("Element is not a text field.");
    } else if (!(elem instanceof Ci.nsIDOMHTMLTextAreaElement))
        throw interactive_error("Element is not a text field.");

    var name = get_filename_for_current_textfield(buffer.document, elem);
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

interactive("edit-current-field-in-external-editor",
            "Edit the contents of the currently-focused text field in an external editor.",
            function (I) {
                var buf = I.buffer;
                var elem = buf.focused_element;
                yield edit_field_in_external_editor(buf, elem);
                elem.blur();
            });

define_variable("kill_whole_line", false,
                "If true, `kill-line' with no arg at beg of line kills the whole line.");

function cut_to_end_of_line (buffer) {
    var elem = buffer.focused_element;
    try {
        var st = elem.selectionStart;
        var en = elem.selectionEnd;
        if (st == en) {
            // there is no selection.  set one up.
            var eol = elem.value.indexOf("\n", en);
            if (eol == -1)
                elem.selectionEnd = elem.textLength;
            else if (eol == st)
                elem.selectionEnd = eol + 1;
            else if (kill_whole_line &&
                     (st == 0 || elem.value[st - 1] == "\n"))
                elem.selectionEnd = eol + 1;
            else
                elem.selectionEnd = eol;
        }
        buffer.do_command('cmd_cut');
    } catch (e) {
        /* FIXME: Make this work for richedit mode as well */
    }
}
interactive("cut-to-end-of-line",
    null,
    function (I) {
        cut_to_end_of_line(I.buffer);
    });


function downcase_word (I) {
    modify_word_at_point(I, function (word) { return word.toLocaleLowerCase(); });
}
interactive("downcase-word",
            "Convert following word to lower case, moving over.",
            downcase_word);


function upcase_word (I) {
    modify_word_at_point(I, function (word) { return word.toLocaleUpperCase(); });
}
interactive("upcase-word",
            "Convert following word to upper case, moving over.",
            upcase_word);


function capitalize_word (I) {
    modify_word_at_point(I, function (word) {
        if (word.length > 0) {
            return word[0].toLocaleUpperCase() + word.substring(1);
        }
        return word;
    });
}
interactive("capitalize-word",
            "Capitalize the following word (or arg words), moving over.",
            capitalize_word);

