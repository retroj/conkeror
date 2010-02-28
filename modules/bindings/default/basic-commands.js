/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2009 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

function bind_scroll_keys (keymap) {
    define_key(keymap, "back_space", "cmd_scrollPageUp");
    define_key(keymap, "space","cmd_scrollPageDown");
    define_key(keymap, "M-v","cmd_scrollPageUp");
    define_key(keymap, "C-v","cmd_scrollPageDown");
    define_key(keymap, "page_up","cmd_scrollPageUp");
    define_key(keymap, "page_down","cmd_scrollPageDown");
    define_key(keymap, "C-page_up","cmd_scrollLeft");
    define_key(keymap, "C-page_down","cmd_scrollRight");
    define_key(keymap, "C-p","cmd_scrollLineUp");
    define_key(keymap, "C-n","cmd_scrollLineDown");

    define_key(keymap, "up","cmd_scrollLineUp");
    define_key(keymap, "down","cmd_scrollLineDown");
    define_key(keymap, "left","cmd_scrollLeft");
    define_key(keymap, "right","cmd_scrollRight");

    define_key(keymap, "C-b","cmd_scrollLeft");
    define_key(keymap, "C-f","cmd_scrollRight");
    define_key(keymap, "C-a","scroll-beginning-of-line");
    define_key(keymap, "C-e","scroll-end-of-line");
    define_key(keymap, "M-<","scroll-top-left");
    define_key(keymap, "M->","cmd_scrollBottom");
    define_key(keymap, "home","scroll-top-left");
    define_key(keymap, "end","cmd_scrollBottom");
}


function bind_selection_keys (keymap) {
    define_key(keymap, "M-w","cmd_copy");
    define_key(keymap, "S-page_up", "cmd_selectPageUp");
    define_key(keymap, "S-page_down", "cmd_selectPageDown");
    define_key(keymap, "C-delete", "cmd_copy");
    define_key(keymap, "C-space", "set-mark");
    define_key(keymap, "C-@", "set-mark");
    define_key(keymap, "C-insert", "cmd_copy");
    define_key(keymap, "C-S-home", "cmd_selectTop");
    define_key(keymap, "C-S-end", "cmd_selectBottom");
    define_key(keymap, "C-S-left", "cmd_selectWordPrevious");
    define_key(keymap, "C-S-right", "cmd_selectWordNext");
    define_key(keymap, "S-left", "cmd_selectCharPrevious");
    define_key(keymap, "S-right", "cmd_selectCharNext");
    define_key(keymap, "S-home", "cmd_selectBeginLine");
    define_key(keymap, "S-end", "cmd_selectEndLine");
    define_key(keymap, "S-up", "cmd_selectLinePrevious");
    define_key(keymap, "S-down", "cmd_selectLineNext");

    define_key(keymap, "C-B", "cmd_selectCharPrevious");
    define_key(keymap, "C-F", "cmd_selectCharNext");
    define_key(keymap, "M-B", "cmd_selectWordPrevious");
    define_key(keymap, "M-F", "cmd_selectWordNext");
    define_key(keymap, "C-P", "cmd_selectLinePrevious");
    define_key(keymap, "C-N", "cmd_selectLineNext");
}
