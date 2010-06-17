/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 * (C) Copyright 2008-2009 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

require("content-buffer.js");


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
        for (var i = 0, nframes = win.frames.length; i < nframes; ++i) {
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

function cut_to_end_of_line (field, window) {
    try {
        var st = field.selectionStart;
        var en = field.selectionEnd;
        if (st == en) {
            // there is no selection.  set one up.
            var eol = field.value.indexOf("\n", en);
            if (eol == -1)
                field.selectionEnd = field.textLength;
            else if (eol == st)
                field.selectionEnd = eol + 1;
            else if (kill_whole_line &&
                     (st == 0 || field.value[st - 1] == "\n"))
                field.selectionEnd = eol + 1;
            else
                field.selectionEnd = eol;
        }
        call_builtin_command(window, 'cmd_cut');
    } catch (e) {
        /* FIXME: Make this work for richedit mode as well */
    }
}
interactive("cut-to-end-of-line",
    null,
    function (I) {
        call_on_focused_field(I, function (field) {
            cut_to_end_of_line(field, I.window);
        });
    });


interactive("downcase-word",
    "Convert following word to lower case, moving over.",
    function (I) {
        call_on_focused_field(I, function (field) {
            modify_word_at_point(field, function (word) {
                return word.toLocaleLowerCase();
            });
        });
    });


interactive("upcase-word",
    "Convert following word to upper case, moving over.",
    function (I) {
        call_on_focused_field(I, function (field) {
            modify_word_at_point(field, function (word) {
                return word.toLocaleUpperCase();
            });
        });
    });


interactive("capitalize-word",
    "Capitalize the following word (or arg words), moving over.",
    function (I) {
        call_on_focused_field(I, function (field) {
            modify_word_at_point(field, function (word) {
                if (word.length > 0)
                    return word[0].toLocaleUpperCase() + word.substring(1);
                return word;
            });
        });
    });

provide("content-buffer-input");
