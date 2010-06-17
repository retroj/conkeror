/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2010 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

require("interactive.js");

interactive("set-mark",
    "Toggle whether the mark is active.\n" +
    "When the mark is active, movement commands affect the selection.",
    function (I) {
        var m = I.minibuffer;
        var s = m.current_state;
        if (m.active)
            s.mark_active = !s.mark_active;
        else
            I.buffer.mark_active = !I.buffer.mark_active;
    });

function mark_active_predicate (I) {
    var m = I.minibuffer;
    var s = m.current_state;
    if (m.active)
        return s.mark_active;
    else
        return I.buffer.mark_active;
}

function define_builtin_commands (prefix, do_command_function, mode) {

    // Specify a docstring
    function D (cmd, docstring) {
        var o = new String(cmd);
        o.doc = docstring;
        return o;
    }

    // Specify a forward/reverse pair
    function R (a, b) {
        var o = [a,b];
        o.is_reverse_pair = true;
        return o;
    }

    // Specify a movement/select/scroll/move-caret command group.
    function S (command, movement, select, scroll, caret) {
        var o = [movement, select, scroll, caret];
        o.command = command;
        o.is_move_select_pair = true;
        return o;
    }

    var builtin_commands = [

        /*
         * cmd_scrollBeginLine and cmd_scrollEndLine don't do what I
         * want, either in or out of caret mode...
         */
        S(D("beginning-of-line", "Move or extend the selection to the beginning of the current line."),
          D("cmd_beginLine", "Move point to the beginning of the current line."),
          D("cmd_selectBeginLine", "Extend selection to the beginning of the current line."),
          D("cmd_beginLine", "Scroll to the beginning of the line"),
          D("cmd_beginLine", "Scroll to the beginning of the line")),
        S(D("end-of-line", "Move or extend the selection to the end of the current line."),
          D("cmd_endLine", "Move point to the end of the current line."),
          D("cmd_selectEndLine", "Extend selection to the end of the current line."),
          D("cmd_endLine", "Scroll to the end of the current line."),
          D("cmd_endLine", "Scroll to the end of the current line.")),
        S(D("beginning-of-first-line", "Move or extend the selection to the beginning of the first line."),
          D("cmd_moveTop", "Move point to the beginning of the first line."),
          D("cmd_selectTop", "Extend selection to the beginning of the first line."),
          D("cmd_scrollTop", "Scroll to the top of the buffer"),
          D("cmd_scrollTop", "Move point to the beginning of the first line.")),
        S(D("end-of-last-line", "Move or extend the selection to the end of the last line."),
          D("cmd_moveBottom", "Move point to the end of the last line."),
          D("cmd_selectBottom", "Extend selection to the end of the last line."),
          D("cmd_scrollBottom", "Scroll to the bottom of the buffer"),
          D("cmd_scrollBottom", "Move point to the end of the last line.")),
        "cmd_copyOrDelete",
        "cmd_scrollBeginLine",
        "cmd_scrollEndLine",
        "cmd_cutOrDelete",
        D("cmd_copy", "Copy the selection into the clipboard."),
        D("cmd_cut", "Cut the selection into the clipboard."),
        D("cmd_deleteToBeginningOfLine", "Delete to the beginning of the current line."),
        D("cmd_deleteToEndOfLine", "Delete to the end of the current line."),
        D("cmd_selectAll", "Select all."),
        D("cmd_scrollTop", "Scroll to the top of the buffer."),
        D("cmd_scrollBottom", "Scroll to the bottom of the buffer.")];

    var builtin_commands_with_count = [
        R(S(D("forward-char", "Move or extend the selection forward one character."),
            D("cmd_charNext", "Move point forward one character."),
            D("cmd_selectCharNext", "Extend selection forward one character."),
            D("cmd_scrollRight", "Scroll to the right"),
            D("cmd_scrollRight", "Scroll to the right")),
          S(D("backward-char", "Move or extend the selection backward one character."),
            D("cmd_charPrevious", "Move point backward one character."),
            D("cmd_selectCharPrevious", "Extend selection backward one character."),
            D("cmd_scrollLeft", "Scroll to the left."),
            D("cmd_scrollLeft", "Scroll to the left."))),
        R(D("cmd_deleteCharForward", "Delete the following character."),
          D("cmd_deleteCharBackward", "Delete the previous character.")),
        R(D("cmd_deleteWordForward", "Delete the following word."),
          D("cmd_deleteWordBackward", "Delete the previous word.")),
        R(S(D("forward-line", "Move or extend the selection forward one line."),
            D("cmd_lineNext", "Move point forward one line."),
            D("cmd_selectLineNext", "Extend selection forward one line."),
            D("cmd_scrollLineDown", "Scroll down one line."),
            D("cmd_scrollLineDown", "Scroll down one line.")),
          S(D("backward-line", "Move or extend the selection backward one line."),
            D("cmd_linePrevious", "Move point backward one line."),
            D("cmd_selectLinePrevious", "Extend selection backward one line."),
            D("cmd_scrollLineUp", "Scroll up one line."),
            D("cmd_scrollLineUp", "Scroll up one line."))),
        R(S(D("forward-page", "Move or extend the selection forward one page."),
            D("cmd_movePageDown", "Move point forward one page."),
            D("cmd_selectPageDown", "Extend selection forward one page."),
            D("cmd_scrollPageDown", "Scroll forward one page."),
            D("cmd_movePageDown", "Move point forward one page.")),
          S(D("backward-page", "Move or extend the selection backward one page."),
            D("cmd_movePageUp", "Move point backward one page."),
            D("cmd_selectPageUp", "Extend selection backward one page."),
            D("cmd_scrollPageUp", "Scroll backward one page."),
            D("cmd_movePageUp", "Move point backward one page."))),
        R(D("cmd_undo", "Undo last editing action."),
          D("cmd_redo", "Redo last editing action.")),
        R(S(D("forward-word", "Move or extend the selection forward one word."),
            D("cmd_wordNext", "Move point forward one word."),
            D("cmd_selectWordNext", "Extend selection forward one word."),
            D("cmd_scrollRight", "Scroll to the right."),
            D("cmd_wordNext", "Move point forward one word.")),
          S(D("backward-word", "Move or extend the selection backward one word."),
            D("cmd_wordPrevious", "Move point backward one word."),
            D("cmd_selectWordPrevious", "Extend selection backward one word."),
            D("cmd_scrollLeft", "Scroll to the left."),
            D("cmd_wordPrevious", "Move point backward one word."))),
        R(D("cmd_scrollPageUp", "Scroll up one page."),
          D("cmd_scrollPageDown", "Scroll down one page.")),
        R(D("cmd_scrollLineUp", "Scroll up one line."),
          D("cmd_scrollLineDown", "Scroll down one line.")),
        R(D("cmd_scrollLeft", "Scroll left."),
          D("cmd_scrollRight", "Scroll right.")),
        D("cmd_paste", "Insert the contents of the clipboard.")];

    function get_mode_idx () {
        if (mode == 'scroll') return 2;
        else if (mode == 'caret') return 3;
        else return 0;
    }

    function get_move_select_idx (I) {
        return mark_active_predicate(I) ? 1 : get_mode_idx();
    }

    function doc_for_builtin (c) {
        var s = "";
        if (c.doc != null)
            s += c.doc + "\n";
        return s + "Run the built-in command " + c + ".";
    }

    function define_simple_command (c) {
        interactive(prefix + c, doc_for_builtin(c), function (I) { do_command_function(I, c); });
    }

    function get_move_select_doc_string (c) {
        return c.command.doc +
            "\nSpecifically, if the mark is active, runs `" + prefix + c[1] + "'.  " +
            "Otherwise, runs `" + prefix + c[get_mode_idx()] + "'\n" +
            "To toggle whether the mark is active, use `" + prefix + "set-mark'.";
    }

    for each (let c_temp in builtin_commands) {
        let c = c_temp;
        if (c.is_move_select_pair) {
            interactive(prefix + c.command, get_move_select_doc_string(c), function (I) {
                var idx = get_move_select_idx(I);
                do_command_function(I, c[idx]);
            });
            define_simple_command(c[0]);
            define_simple_command(c[1]);
        }
        else
            define_simple_command(c);
    }

    function get_reverse_pair_doc_string (main_doc, alt_command) {
        return main_doc + "\n" +
            "The prefix argument specifies a repeat count for this command.  " +
            "If the count is negative, `" + prefix + alt_command + "' is performed instead with " +
            "a corresponding positive repeat count.";
    }

    function define_simple_reverse_pair (a, b) {
        interactive(prefix + a, get_reverse_pair_doc_string(doc_for_builtin(a), b),
                    function (I) {
                        do_repeatedly(do_command_function, I.p, [I, a], [I, b]);
                    });
        interactive(prefix + b, get_reverse_pair_doc_string(doc_for_builtin(b), a),
                    function (I) {
                        do_repeatedly(do_command_function, I.p, [I, b], [I, a]);
                    });
    }

    for each (let c_temp in builtin_commands_with_count) {
        let c = c_temp;
        if (c.is_reverse_pair) {
            if (c[0].is_move_select_pair) {
                interactive(prefix + c[0].command, get_reverse_pair_doc_string(get_move_select_doc_string(c[0]),
                                                                               c[1].command),
                            function (I) {
                                var idx = get_move_select_idx(I);
                                do_repeatedly(do_command_function, I.p, [I, c[0][idx]], [I, c[1][idx]]);
                            });
                interactive(prefix + c[1].command, get_reverse_pair_doc_string(get_move_select_doc_string(c[1]),
                                                                               c[0].command),
                            function (I) {
                                var idx = get_move_select_idx(I);
                                do_repeatedly(do_command_function, I.p, [I, c[1][idx]], [I, c[0][idx]]);
                            });
                define_simple_reverse_pair(c[0][0], c[1][0]);
                define_simple_reverse_pair(c[0][1], c[1][1]);
            } else
                define_simple_reverse_pair(c[0], c[1]);
        } else {
            let doc = doc_for_builtin(c) +
                "\nThe prefix argument specifies a positive repeat count for this command.";
            interactive(prefix + c, doc, function (I) {
                do_repeatedly_positive(do_command_function, I.p, I, c);
            });
        }
    }
}

provide("builtin-commands");
