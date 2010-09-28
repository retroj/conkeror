/**
 * (C) Copyright 2010 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

/*
This module manages formfill_keymap, the keymap for interacting with the
popup_autocomplete panel.

notes for future development:

http://mxr.mozilla.org/mozilla-central/source/xpfe/components/autocomplete/resources/content/autocomplete.xml
*/

in_module(null);

interactive("formfill-next",
    "Select next item in the formfill popup.",
    function (I) {
        var p = I.window.document.getElementById("popup_autocomplete");
        var reverse = false, page = false;
        p.selectBy(reverse, page);
    });

interactive("formfill-previous",
    "Select previous item in the formfill popup.",
    function (I) {
        var p = I.window.document.getElementById("popup_autocomplete");
        var reverse = true, page = false;
        p.selectBy(reverse, page);
    });

function formfill_modality (buffer) {
    buffer.keymaps.push(formfill_keymap);
}

function formfill_mode (arg, panel) {
    var buffer = panel.buffer;
    if (buffer) {
        var i = buffer.modalities.indexOf(formfill_modality);
        if (i > -1)
            buffer.modalities.splice(i, 1);
        delete panel.buffer;
    }
    if (arg) {
        buffer = panel.ownerDocument.defaultView.buffers.current;
        buffer.modalities.push(formfill_modality);
        panel.buffer = buffer;
    }
    buffer.set_input_mode();
}

provide("formfill");
