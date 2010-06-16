/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 * (C) Copyright 2008-2009 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

function caret_modality (buffer, elem) {
    buffer.keymaps.push(caret_keymap);
}

define_buffer_mode('caret_mode',
    $display_name = 'CARET',
    $enable = function (buffer) {
        buffer.browser.setAttribute('showcaret', 'true');
        var sc = buffer.focused_selection_controller;
        sc.setCaretEnabled(true);
        buffer.top_frame.focus();
        buffer.modalities.push(caret_modality);
        buffer.set_input_mode();
    },
    $disable = function (buffer) {
        buffer.browser.setAttribute('showcaret', 'false');
        var sc = buffer.focused_selection_controller;
        sc.setCaretEnabled(false);
        buffer.browser.focus();
        var i = buffer.modalities.indexOf(caret_modality);
        if (i > -1)
            buffer.modalities.splice(i, 1);
        buffer.set_input_mode();
    });

function caret_mode_enable (buffer) {
    caret_mode(buffer, true);
}

watch_pref('accessibility.browsewithcaret',
           function caret_toggle_all_buffers () {
               if (get_pref('accessibility.browsewithcaret')) {
                   for_each_buffer(function (buffer) {
                       caret_mode(buffer, true);
                   });
                   add_hook('create_buffer_hook', caret_mode_enable);
               } else {
                   for_each_buffer(function (buffer) {
                       caret_mode(buffer, false);
                   });
                   remove_hook('create_buffer_hook', caret_mode_enable);
               }
           });

provide("caret");
