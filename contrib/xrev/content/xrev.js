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
    var table = document.getElementById('event-table');
    var row = document.createElementNS(XULNS,"listitem");

    function addcell (text) {
        var cap = document.createElementNS(XULNS,"listcell");
        cap.setAttribute("label", text);
        row.appendChild(cap);
    }

    var k;
    for each (k in key_event_props) { addcell(event[k]); }
    var combo = '';
    if (event.type == 'keypress' &&
        event.charCode)
    {
        if (event.ctrlKey) combo += 'C-';
        if (event.metaKey || event.altKey) combo += 'M-';
        combo += String.fromCharCode(event.charCode);
    }
    addcell(combo);
    table.appendChild(row);
    table.ensureElementIsVisible(row);
    // text output
    dump([event[k].toString().pad(' ',11)
          for each (k in key_event_props)].join(''));
    dumpln(combo);
}


function onload_handler () {
    var headings = key_event_props.concat("combo");
    var table = document.getElementById('event-table');
    var head = document.createElementNS(XULNS,"listhead");
    var coldef = document.createElementNS(XULNS,"listcols");

    function addcol (name) {
        var t,u;
        t = document.createElementNS(XULNS,"listheader");
        t.setAttribute("label", name);
        u = document.createElementNS(XULNS,"listcol");
        u.setAttribute("flex", "1");
        head.appendChild(t);
        coldef.appendChild(u);
    }

    var t, u;
    for each (k in headings) {
        addcol(k);
    }
    table.appendChild(head);
    table.appendChild(coldef);
    // text output
    dumpln([k.pad(' ',11) for each (k in headings)].join(''));
}

