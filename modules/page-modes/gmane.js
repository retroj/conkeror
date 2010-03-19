/**
 * (C) Copyright 2008 David Kettler
 * (C) Copyright 2009 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

require("content-buffer.js");

define_keymap("gmane_keymap");

/* Rebind most overridden commands. */
//BAAAAAAD
define_key(gmane_keymap, "C-c c", "copy");
define_key(gmane_keymap, "C-c +", "zoom-in-text");
define_key(gmane_keymap, "C-c -", "zoom-out-text");
define_key(gmane_keymap, "C-c f", "follow");
define_key(gmane_keymap, "C-c l", "back");
define_key(gmane_keymap, "C-c n", "browser-object-links");


/*
  The f keystroke is hard to live without; put this in rc to restore it:
    define_key(gmane_keymap, "f", "follow");
*/

/*
  Loom keystrokes.  http://gmane.org/loom-help.php

  SPC 	Page down, then next article
  DEL 	Page up the current article
  n 	Select the next unread article
  p 	Select the previous unread article
  N 	Select the next article
  P 	Select the previous article
  + 	Go to the next page
  - 	Go to the previous page
  f 	Go to the first page
  l 	Go to the last page
  c 	Catch up -- mark all articles as read
  C 	Clear -- mark all articles as unread
  R 	Refresh the group
  < 	Go to the first article on the page
  > 	Go to the last article on the page
  . 	Go to the first article currently displayed in the frame
  down 	Move focus to the next subject
  up 	Move focus to the previous subject
* q 	Quit and go to the list of groups
  S 	Report the current article as spam
* D 	Disable all Loom keystrokes

  Keystrokes marked with * are not passed through in this mode.

  There's a disable, but no enable.  Maybe should provide a way to
  switch the keymap in and out.
*/

define_key(gmane_keymap, "space", null, $fallthrough);
define_key(gmane_keymap, "back_space", null, $fallthrough);
define_key(gmane_keymap, "n", null, $fallthrough);
define_key(gmane_keymap, "p", null, $fallthrough);
define_key(gmane_keymap, "N", null, $fallthrough);
define_key(gmane_keymap, "P", null, $fallthrough);
define_key(gmane_keymap, "+", null, $fallthrough);
define_key(gmane_keymap, "-", null, $fallthrough);
define_key(gmane_keymap, "f", null, $fallthrough);
define_key(gmane_keymap, "l", null, $fallthrough);
define_key(gmane_keymap, "c", null, $fallthrough);
define_key(gmane_keymap, "C", null, $fallthrough);
define_key(gmane_keymap, "R", null, $fallthrough);
define_key(gmane_keymap, "<", null, $fallthrough);
define_key(gmane_keymap, ">", null, $fallthrough);
define_key(gmane_keymap, ".", null, $fallthrough);
define_key(gmane_keymap, "down", null, $fallthrough);
define_key(gmane_keymap, "up", null, $fallthrough);
define_key(gmane_keymap, "S", null, $fallthrough);


function gmane_modality (buffer, element) {
    if (! buffer.input_mode)
        buffer.keymaps.push(gmane_keymap);
}


define_page_mode("gmane_mode",
    $enable = function (buffer) {
        buffer.modalities.push(gmane_modality);
    },
    $disable = function (buffer) {
        var i = buffer.modalities.indexOf(gmane_modality);
        if (i > -1)
            buffer.modalities.splice(i, 1);
    },
    $display_name = "Gmane");


let (re = build_url_regex($domain = /(news|thread)\.gmane/, $tlds = ["org"])) {
    auto_mode_list.push([re, gmane_mode]);
}

provide("gmane");
