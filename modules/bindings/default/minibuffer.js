require("bindings/default/global.js");

var minibuffer_base_keymap = new keymap($parent = default_base_keymap);


// {{{ minibuffer_base_keymap

define_key(minibuffer_base_keymap, "C-a", "minibuffer-beginning-of-line");
define_key(minibuffer_base_keymap, "C-e", "minibuffer-end-of-line");
define_key(minibuffer_base_keymap, "back_space", "minibuffer-cmd_deleteCharBackward");
define_key(minibuffer_base_keymap, "M-back_space", "minibuffer-cmd_deleteWordBackward");
define_key(minibuffer_base_keymap, "C-d", "minibuffer-cmd_deleteCharForward");
define_key(minibuffer_base_keymap, "delete", "minibuffer-cmd_deleteCharForward");
define_key(minibuffer_base_keymap, "M-d", "minibuffer-cmd_deleteWordForward");
define_key(minibuffer_base_keymap, "C-b", "minibuffer-backward-char");
define_key(minibuffer_base_keymap, "left", "minibuffer-backward-char");
define_key(minibuffer_base_keymap, "M-b", "minibuffer-backward-word");
define_key(minibuffer_base_keymap, "C-f", "minibuffer-forward-char");
define_key(minibuffer_base_keymap, "right", "minibuffer-forward-char");
define_key(minibuffer_base_keymap, "M-f", "minibuffer-forward-word");
define_key(minibuffer_base_keymap, "C-y", "minibuffer-cmd_paste");
define_key(minibuffer_base_keymap, "M-w", "minibuffer-cmd_copy");
define_key(minibuffer_base_keymap, "C-k", "minibuffer-cmd_deleteToEndOfLine");

define_key(minibuffer_base_keymap, "home", "minibuffer-beginning-of-line");
define_key(minibuffer_base_keymap, "end", "minibuffer-end-of-line");
define_key(minibuffer_base_keymap, "S-home", "minibuffer-cmd_selectBeginLine");
define_key(minibuffer_base_keymap, "S-end", "minibuffer-cmd_selectEndLine");
define_key(minibuffer_base_keymap, "S-left", "minibuffer-cmd_selectCharPrevious");
define_key(minibuffer_base_keymap, "S-right", "minibuffer-cmd_selectCharNext");
define_key(minibuffer_base_keymap, "C-back_space", "minibuffer-cmd_deleteWordBackward");
define_key(minibuffer_base_keymap, "C-S-left", "minibuffer-cmd_selectWordPrevious");
define_key(minibuffer_base_keymap, "C-S-right", "minibuffer-cmd_selectWordNext");

define_key(minibuffer_base_keymap, "C-space", "minibuffer-set-mark");


// Nasty keys
define_key(minibuffer_base_keymap, "C-r", "minibuffer-cmd_redo");

define_key(minibuffer_base_keymap, match_any_unmodified_key, "minibuffer-insert-character");

// }}}

// {{{ minibuffer_keymap

var minibuffer_keymap = new keymap($parent = minibuffer_base_keymap);

define_key (minibuffer_keymap, "return", "exit-minibuffer");
define_key (minibuffer_keymap, "M-p", "minibuffer-history-previous");
define_key (minibuffer_keymap, "M-n", "minibuffer-history-next");
define_key (minibuffer_keymap, "C-g", "minibuffer-abort");
define_key (minibuffer_keymap, "tab", "minibuffer-complete");
define_key (minibuffer_keymap, "S-tab", "minibuffer-complete-previous");

define_key (minibuffer_keymap, "down", "minibuffer-complete");
define_key (minibuffer_keymap, "up", "minibuffer-complete-previous");

define_key (minibuffer_keymap, "escape", "minibuffer-abort");

// }}}

// {{{ minibuffer_completion_keymap

var minibuffer_completion_keymap = new keymap($parent = minibuffer_keymap);

define_key (minibuffer_completion_keymap, "tab", "minibuffer-complete-old");
define_key (minibuffer_completion_keymap, "space", "minibuffer-accept-match");
define_key (minibuffer_completion_keymap, match_any_unmodified_key, "minibuffer-insert-character-complete");

// }}}

// {{{ single_character_options_minibuffer_keymap
var single_character_options_minibuffer_keymap = new keymap($parent = default_base_keymap);

define_key(single_character_options_minibuffer_keymap, "C-g", "minibuffer-abort");
define_key(single_character_options_minibuffer_keymap, match_any_unmodified_key,
           "single-character-options-enter-character");
define_key(single_character_options_minibuffer_keymap, "escape", "minibuffer-abort");

// }}}
