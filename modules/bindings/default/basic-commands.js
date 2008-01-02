
function bind_scroll_keys(keymap)
{
    define_key(keymap, "back_space", "cmd_scrollPageUp");
    define_key(keymap, "space","cmd_scrollPageDown");
    define_key(keymap, "M-v","cmd_scrollPageUp");
    define_key(keymap, "C-v","cmd_scrollPageDown");
    define_key(keymap, "page_up","cmd_scrollPageUp");
    define_key(keymap, "page_down","cmd_scrollPageDown");
    define_key(keymap, "C-p","cmd_scrollLineUp");
    define_key(keymap, "C-n","cmd_scrollLineDown");

    define_key(keymap, "up","cmd_scrollLineUp");
    define_key(keymap, "down","cmd_scrollLineDown");
    define_key(keymap, "left","cmd_scrollLeft");
    define_key(keymap, "right","cmd_scrollRight");

    define_key(keymap, "C-b","cmd_scrollLeft");
    define_key(keymap, "C-f","cmd_scrollRight");
    define_key(keymap, "C-a","beginning-of-line");
    define_key(keymap, "C-e","end-of-line");
    define_key(keymap, "M-S-comma","cmd_scrollTop");
    define_key(keymap, "M-S-period","cmd_scrollBottom");
}


function bind_selection_keys(keymap)
{
    define_key(keymap, "M-w","cmd_copy");
    define_key(keymap, "S-page_up", "cmd_selectPageUp");
    define_key(keymap, "S-page_down", "cmd_selectPageDown");
    define_key(keymap, "C-delete", "cmd_copy");
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

}
