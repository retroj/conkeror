/**
 * (C) Copyright 2008 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

// key_event_props: what properties of keyboard events do we care about?
var key_event_props = [
    'timeStamp', 'type', 'charCode', 'keyCode', 'altKey',
    'ctrlKey', 'shiftKey', 'metaKey', 'eventPhase',
    'isChar', 'which'];


function dumpln (line) {
    dump(line + "\n");
}

function key_event_handler (event) {
    dumpln([event[k].toString().pad(' ',11)
            for each (k in key_event_props)].join(''));
}


function str_pad (chr, len) {
    var s = this.toString();
    while (len - s.length > 0) {
        s += chr;
    }
    return s;
}

String.prototype.pad = str_pad;

dumpln([k.pad(' ',11) for each (k in key_event_props)].join(''));

