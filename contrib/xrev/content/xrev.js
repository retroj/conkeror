/**
 * (C) Copyright 2008 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

var XULNS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

// key_event_props: what properties of keyboard events do we care about?
var key_event_props = [
    'type', 'charCode', 'keyCode', 'altKey',
    'ctrlKey', 'shiftKey', 'metaKey', 'eventPhase',
    'isChar', 'which'];


function dumpln (line) {
    dump(line + "\n");
}

function str_pad (chr, len) {
    var s = this.toString();
    while (len - s.length > 0) {
        s += chr;
    }
    return s;
}
String.prototype.pad = str_pad;



function key_event_handler (event) {
    dumpln([event[k].toString().pad(' ',11)
            for each (k in key_event_props)].join(''));
    var table = document.getElementById('event-table');
    var row = document.createElementNS(XULNS,"listitem");
    var cap;
    var k;
    for each (k in key_event_props) {
        cap = document.createElementNS(XULNS,"listcell");
        cap.setAttribute("label", event[k]);
        row.appendChild(cap);
    }
    table.appendChild(row);
    table.ensureElementIsVisible(row);
}


function onload_handler () {
    dumpln([k.pad(' ',11) for each (k in key_event_props)].join(''));
    var table = document.getElementById('event-table');
    var head = document.createElementNS(XULNS,"listhead");
    var coldef = document.createElementNS(XULNS,"listcols");
    var t, u;
    for each (k in key_event_props) {
        t = document.createElementNS(XULNS,"listheader");
        t.setAttribute("label", k);
        u = document.createElementNS(XULNS,"listcol");
        u.setAttribute("flex", "1");
        head.appendChild(t);
        coldef.appendChild(u);
    }
    table.appendChild(head);
    table.appendChild(coldef);
}

