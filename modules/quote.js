/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 * (C) Copyright 2008-2010 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

define_buffer_mode("quote-next-mode",
    function enable (buffer) {
        buffer.override_keymaps([quote_next_keymap]);
    },
    function disable (buffer) {
        buffer.override_keymaps();
    },
    $display_name = "QUOTE-NEXT",
    $doc = "This mode sends the next key combo to the buffer, bypassing "+
        "normal key handling.  It disengages after one key combo.");

interactive("quote-next-mode-disable",
    "Disable quote-next-mode.",
    function (I) {
        quote_next_mode.disable(I.buffer);
        I.buffer.set_input_mode();
    });


define_buffer_mode("quote-mode",
    function enable (buffer) {
        buffer.override_keymaps([quote_keymap]);
    },
    function disable (buffer) {
        buffer.override_keymaps();
    },
    $display_name = "QUOTE",
    $doc = "This mode sends all key combos to the buffer, "+
        "bypassing normal key handling, until the escape "+
        "key is pressed.");


interactive("quote-mode-disable",
    "Disable quote-mode.",
    function (I) {
        quote_mode.disable(I.buffer);
        I.buffer.set_input_mode();
    });


provide("quote");
