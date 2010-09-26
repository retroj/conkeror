/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 * (C) Copyright 2008-2010 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

define_buffer_mode('quote_next_mode',
    $display_name = 'QUOTE-NEXT',
    $enable = function (buffer) {
        buffer.override_keymaps([quote_next_keymap]);
    },
    $disable = function (buffer) {
        buffer.override_keymaps();
    },
    $doc = "This mode sends the next key combo to the buffer, bypassing "+
        "normal key handling.  It disengages after one key combo.");

interactive("quote-next-mode-disable",
    "Disable quote-next-mode.",
    function (I) {
        quote_next_mode(I.buffer, false);
        I.buffer.set_input_mode();
    });


define_buffer_mode('quote_mode',
    $display_name = 'QUOTE',
    $enable = function (buffer) {
        buffer.override_keymaps([quote_keymap]);
    },
    $disable = function (buffer) {
        buffer.override_keymaps();
    },
    $doc = "This mode sends all key combos to the buffer, "+
        "bypassing normal key handling, until the escape "+
        "key is pressed.");


interactive("quote-mode-disable",
    "Disable quote-mode.",
    function (I) {
        quote_mode(I.buffer, false);
        I.buffer.set_input_mode();
    });


provide("quote");
