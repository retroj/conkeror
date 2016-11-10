/**
 * (C) Copyright 2013 John J Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

define_variable("key_kill_input_fields", false,
    "When true, key-kill-mode will operate in input fields and textareas.");

{ let mozilla_version_below_25 = version_compare(get_mozilla_version(), "25.0") < 0;
  var key_kill_event_kill = function key_kill_event_kill (event) {
      var elem = event.target;
      if (!key_kill_input_fields &&
          (elem instanceof Ci.nsIDOMHTMLInputElement ||
           elem instanceof Ci.nsIDOMHTMLTextAreaElement))
      {
          return;
      }
      if (mozilla_version_below_25) {
          event.preventDefault();
      }
      event.stopPropagation();
  };
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
