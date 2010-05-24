/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2010 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

/**
 * Given a callback func and an interactive context I, call func, passing
 * either a focused field, or the minibuffer's input element if the
 * minibuffer is active. Afterward, call `scroll_selection_into_view' on
 * the field. See `paste_x_primary_selection' and `open_line' for
 * examples.
 */
function call_on_focused_field (I, func, clear_mark) {
    var m = I.window.minibuffer;
    var s = m.current_state;
    if (m._input_mode_enabled) {
        m._restore_normal_state();
        var e = m.input_element;
    } else
        var e = I.buffer.focused_element;
    func(e);
    if (clear_mark) {
        if (m._input_mode_enabled)
            s.mark_active = false;
        else
            I.buffer.mark_active = false;
    }
    scroll_selection_into_view(e);
    if (s && s.handle_input)
        s.handle_input(m);
}


/**
 * Replace the current region with modifier(selection). Deactivates region
 * and sets point to the end of the inserted text.  The modifier can
 * control the exact placement of point by returning an array
 * [replacement, point_offset] instead of just a string.
 */
function modify_region (field, modifier) {
    if (field.getAttribute("contenteditable") == 'true') {
        // richedit
        var doc = field.ownerDocument;
        var win = doc.defaultView;
        let replacement = modifier(win.getSelection().toString());
        if (array_p(replacement))
            replacement = replacement[0];
        doc.execCommand("insertHTML", false,
                        html_escape(replacement)
                            .replace(/\n/g, '<br>')
                            .replace(/  /g, ' &nbsp;'));
    } else {
        // normal text field
        let replacement =
            modifier(field.value.substring(field.selectionStart, field.selectionEnd));
        var point = field.selectionStart;
        if (array_p(replacement)) {
            point += replacement[1];
            replacement = replacement[0];
        } else
            point += replacement.length;
        field.value =
            field.value.substr(0, field.selectionStart) + replacement +
            field.value.substr(field.selectionEnd);
        field.setSelectionRange(point, point);
    }
}


/**
 * Takes an interactive context and a function to call with the word
 * at point as its sole argument, and which returns a modified word.
 */
//XXX: this should be implemented in terms of modify_region,
//     in order to work in richedit fields.
function modify_word_at_point (I, func) {
    var focused = I.buffer.focused_element;

    // Skip any whitespaces at point and move point to the right place.
    var point = focused.selectionStart;
    var rest = focused.value.substring(point);

    // Skip any whitespaces.
    for (var i = 0, rlen = rest.length; i < rlen; i++) {
        if (" \n".indexOf(rest.charAt(i)) == -1) {
            point += i;
            break;
        }
    }

    // Find the next whitespace, as it is the end of the word.  If no next
    // whitespace is found, we're at the end of input.  TODO: Add "\n" support.
    goal = focused.value.indexOf(" ", point);
    if (goal == -1)
        goal = focused.value.length;

    // Change the value of the text field.
    var input = focused.value;
    focused.value =
        input.substring(0, point) +
        func(input.substring(point, goal)) +
        input.substring(goal);

    // Move point.
    focused.selectionStart = goal;
    focused.selectionEnd = goal;
}

provide("text");
