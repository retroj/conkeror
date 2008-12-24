/**
 * (C) Copyright 2008 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
// const KeyEvent = Components.interfaces.nsIDOMKeyEvent;

/* Generate vk name table  */
var keycode_to_vk_name = [];
var vk_name_to_keycode = {};
var name;
var code;
var prefix;
{
    prefix = "DOM_VK_";
    for (i in KeyEvent)
    {
        /* Check if this is a key binding */
        if (i.substr(0, prefix.length) == prefix)
        {
            name = i.substr(prefix.length).toLowerCase();
            code = KeyEvent[i];
            keycode_to_vk_name[code] = name;
            vk_name_to_keycode[name] = code;
        }
    }
}

// key_event_props: what properties of keyboard events do we care about?
var key_event_props = [
    'type', 'charCode', 'keyCode', 'altKey',
    'ctrlKey', 'shiftKey', 'metaKey',
    'isChar', 'which'];

function quit () {
    var appStartup = Components.classes["@mozilla.org/toolkit/app-startup;1"]
        .getService(Components.interfaces.nsIAppStartup);
    appStartup.quit(appStartup.eAttemptQuit);
}

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
    var row = document.createElementNS(XUL_NS,"listitem");

    function addcell (text) {
        var cap = document.createElementNS(XUL_NS,"listcell");
        cap.setAttribute("label", text);
        row.appendChild(cap);
    }

    var k;
    for each (k in key_event_props) { addcell(event[k]); }
    var combo = '';
    if (event.type == 'keypress' &&
        (event.charCode || event.keyCode))
    {
        if (event.ctrlKey) combo += 'C-';
        if (event.metaKey || event.altKey) combo += 'M-';
        if (event.keyCode &&
            event.charCode == 0 &&
            event.shiftKey)
        {
            combo += 'S-';
        }
        if (event.charCode) {
            if (event.charCode == 32) {
                combo += 'space';
            } else {
                combo += String.fromCharCode(event.charCode);
            }
        } else if (event.keyCode) {
            combo += keycode_to_vk_name[event.keyCode];
        }

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
    var head = document.createElementNS(XUL_NS,"listhead");
    var coldef = document.createElementNS(XUL_NS,"listcols");

    function addcol (name) {
        var t,u;
        t = document.createElementNS(XUL_NS,"listheader");
        t.setAttribute("label", name);
        u = document.createElementNS(XUL_NS,"listcol");
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

