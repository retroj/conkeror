/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2008 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

function bind_scroll_keys(keymap)
{
    define_key(keymap, "back_space", "cmd_scrollPageUp", $category = "Scrolling");
    define_key(keymap, "space","cmd_scrollPageDown", $category = "Scrolling");
    define_key(keymap, "M-v","backward-page", $category = "Scrolling");
    define_key(keymap, "C-v","forward-page", $category = "Scrolling");
    define_key(keymap, "page_up","forward-page", $category = "Scrolling");
    define_key(keymap, "page_down","backward-page", $category = "Scrolling");
    define_key(keymap, "C-n","forward-line", $category = "Scrolling");
    define_key(keymap, "C-p","backward-line", $category = "Scrolling");

    define_key(keymap, "up","backward-line", $category = "Scrolling");
    define_key(keymap, "down","forward-line", $category = "Scrolling");
    define_key(keymap, "left","cmd_scrollLeft", $category = "Scrolling");
    define_key(keymap, "right","cmd_scrollRight", $category = "Scrolling");

    define_key(keymap, "M-f","forward-word", $category = "Scrolling");
    define_key(keymap, "M-b","backward-word", $category = "Scrolling");

    define_key(keymap, "C-b","backward-char", $category = "Scrolling");
    define_key(keymap, "C-f","forward-char", $category = "Scrolling");
    define_key(keymap, "C-a","beginning-of-line", $category = "Scrolling");
    define_key(keymap, "C-e","end-of-line", $category = "Scrolling");
    define_key(keymap, "M-<","beginning-of-first-line", $category = "Scrolling");
    define_key(keymap, "M->","end-of-last-line", $category = "Scrolling");
    define_key(keymap, "home","beginning-of-first-line", $category = "Scrolling");
    define_key(keymap, "end","end-of-last-line", $category = "Scrolling");
}


function bind_selection_keys(keymap)
{
    define_key(keymap, "M-w","cmd_copy", $category = "Selection");
    define_key(keymap, "S-page_up", "cmd_selectPageUp", $category = "Selection");
    define_key(keymap, "S-page_down", "cmd_selectPageDown", $category = "Selection");
    define_key(keymap, "C-delete", "cmd_copy", $category = "Selection");
    define_key(keymap, "C-space", "set-mark", $category = "Selection");
    define_key(keymap, "C-insert", "cmd_copy", $category = "Selection");
    define_key(keymap, "C-S-home", "cmd_selectTop", $category = "Selection");
    define_key(keymap, "C-S-end", "cmd_selectBottom", $category = "Selection");
    define_key(keymap, "C-S-left", "cmd_selectWordPrevious", $category = "Selection");
    define_key(keymap, "C-S-right", "cmd_selectWordNext", $category = "Selection");
    define_key(keymap, "S-left", "cmd_selectCharPrevious", $category = "Selection");
    define_key(keymap, "S-right", "cmd_selectCharNext", $category = "Selection");
    define_key(keymap, "S-home", "cmd_selectBeginLine", $category = "Selection");
    define_key(keymap, "S-end", "cmd_selectEndLine", $category = "Selection");
    define_key(keymap, "S-up", "cmd_selectLinePrevious", $category = "Selection");
    define_key(keymap, "S-down", "cmd_selectLineNext", $category = "Selection");
}
