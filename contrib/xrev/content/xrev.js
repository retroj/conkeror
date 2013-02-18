/**
 * (C) Copyright 2008-2009,2013 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
// const KeyEvent = Components.interfaces.nsIDOMKeyEvent;

/* Generate vk name table  */
var keycode_to_vk_name = [];
var vk_name_to_keycode = {};
{
    var prefix = "DOM_VK_";
    for (i in KeyEvent) {
        /* Check if this is a key binding */
        if (i.substr(0, prefix.length) == prefix) {
            var name = i.substr(prefix.length).toLowerCase();
            var code = KeyEvent[i];
            keycode_to_vk_name[code] = name;
            vk_name_to_keycode[name] = code;
        }
    }
}

var special_modifiers = {
    osKey: function (event) {
        return ("getModifierState" in event &&
                event.getModifierState("OS"));
    }
};

var column_names = {
    ctrlKey: "C",
    metaKey: "M",
    altKey: "A",
    osKey: "s",
    shiftKey: "S"
};

// key_event_props: what properties of keyboard events do we care about?
var key_event_props = [
    'type', 'charCode', 'keyCode', 'which', 'ctrlKey',
    'metaKey', 'altKey', 'osKey', 'shiftKey'];

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
    event.preventDefault();
    event.stopPropagation();

    var table = document.getElementById('event-table');
    var row = document.createElementNS(XUL_NS, "listitem");

    function get_field (k) {
        if (k in special_modifiers)
            var v = special_modifiers[k](event);
        else
            v = event[k];
        if (typeof v == "boolean")
            return (v ? (column_names[k] || true) : "");
        else
            return v;
    }

    function addcell (text) {
        var cap = document.createElementNS(XUL_NS, "listcell");
        cap.setAttribute("label", text);
        row.appendChild(cap);
    }

    for each (var k in key_event_props) {
        addcell(get_field(k));
    }
    var charname = '';
    if (event.type == 'keypress' &&
        (event.charCode || event.keyCode))
    {
        if (event.charCode) {
            if (event.charCode == 32)
                charname = 'space';
            else
                charname = String.fromCharCode(event.charCode);
        } else if (event.keyCode) {
            charname = keycode_to_vk_name[event.keyCode];
        }
    }
    addcell(charname);
    table.appendChild(row);
    table.ensureElementIsVisible(row);
    // text output
    dump([get_field(k).toString().pad(' ',11)
          for each (k in key_event_props)].join(''));
    dumpln(charname);
}
window.addEventListener("keydown", key_event_handler, true /* capture */);
window.addEventListener("keypress", key_event_handler, true /* capture */);


function onload_handler () {
    var headings = key_event_props.concat("name");
    var table = document.getElementById('event-table');
    var head = document.createElementNS(XUL_NS,"listhead");
    var coldef = document.createElementNS(XUL_NS,"listcols");

    function addcol (name) {
        var t = document.createElementNS(XUL_NS,"listheader");
        if (name in column_names)
            name = column_names[name];
        t.setAttribute("label", name);
        var u = document.createElementNS(XUL_NS,"listcol");
        u.setAttribute("flex", "1");
        head.appendChild(t);
        coldef.appendChild(u);
    }

    for each (var k in headings) {
        addcol(k);
    }
    table.appendChild(head);
    table.appendChild(coldef);
    // text output
    dumpln([k.pad(' ',11) for each (k in headings)].join(''));
}
