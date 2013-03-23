/**
 * (C) Copyright 2013 John J Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

function key_kill_event_kill (event) {
    var elem = event.target;
    if (elem instanceof Ci.nsIDOMHTMLInputElement ||
        elem instanceof Ci.nsIDOMHTMLTextAreaElement)
    {
        return;
    }
    event_kill(event);
}

define_page_mode("key-kill-mode",
    [],
    function enable (buffer) {
        buffer.browser.addEventListener("keyup", key_kill_event_kill, true);
        buffer.browser.addEventListener("keydown", key_kill_event_kill, true);
    },
    function disable (buffer) {
        buffer.browser.removeEventListener("keyup", key_kill_event_kill, true);
        buffer.browser.removeEventListener("keydown", key_kill_event_kill, true);
    },
    $display_name = "Key-kill");

page_mode_activate(key_kill_mode);

provide("key-kill");
