/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

var conkeror = Components.classes['@conkeror.mozdev.org/application;1'].getService ().wrappedJSObject;

var last_keydown_event = null;


function handle_keydown(e) {
    e.preventDefault();
    e.stopPropagation();

    last_keydown_event = e;
}

function handle_keypress(e) {
    e.preventDefault();
    e.stopPropagation();

    // Ignore this keypress if we don't have a keycode
    if (!last_keydown_event)
        return;

    // Ignore this keypress if other modifiers are down
    if (e.altKey  || e.ctrlKey || e.metaKey)
        return;

    // Ignore this keypress if we don't have a charcode
    if (!e.charCode)
        return;

    // Ignore space
    if (e.charCode == " ".charCodeAt(0))
        return;

    var shift = e.shiftKey;

    var keycode = last_keydown_event.keyCode;
    var charcode = e.charCode;

    add_mapping(keycode, shift, charcode, true);
}

var unshifted_keycode_to_charcode = [];
var shifted_keycode_to_charcode = [];

var count = 0;

function add_mapping(keycode, shift, charcode, single) {
    var table = shift ? shifted_keycode_to_charcode : unshifted_keycode_to_charcode;

    var obj = table[keycode];
    if (obj != null)
        obj.element.parentNode.removeChild(obj.element);
    else
        ++count;
    var g = new conkeror.dom_generator(document, conkeror.XUL_NS);
    var list = document.getElementById("mapping_list");
    var item = g.element("listitem");
    g.element("listcell", item, "label", keycode);
    var keycode_name = conkeror.keycode_to_vk_name[keycode] || "";
    g.element("listcell", item, "label", keycode_name);
    g.element("listcell", item, "label", shift ? "true" : "false");
    g.element("listcell", item, "label", charcode);
    g.element("listcell", item, "label", String.fromCharCode(charcode));
    list.appendChild(item);
    table[keycode] = {charcode: charcode, element: item};
    if (single) {
        list.ensureElementIsVisible(item);
        message("Added mapping: "  + keycode + ((keycode_name.length > 0)? " (" + keycode_name + ")" : "") +
                " -> " + charcode + " ('" + String.fromCharCode(charcode) + "')");
        update_count();
    }
}

function update_count() {
    document.getElementById("count").value = "Count: " + count;
}

function clear() {
    count = 0;
    var tables = [unshifted_keycode_to_charcode, shifted_keycode_to_charcode];
    for each (let table in tables) {
        for each (let x in table) {
            x.element.parentNode.removeChild(x.element);
        }
    }
    unshifted_keycode_to_charcode = [];
    shifted_keycode_to_charcode = [];
    update_count();
    message("Cleared mappings.");
}

function load_tables(tables) {
    let [unshifted_table, shifted_table] = tables;
    clear();
    for (let x in unshifted_table) {
        let y = unshifted_table[x];
        if (y != null)
            add_mapping(x, false, y);
    }
    for (let x in shifted_table) {
        let y = shifted_table[x];
        if (y != null)
            add_mapping(x, true, y);
    }
    update_count();
}

function load(use_defaults) {
    let tables = conkeror.get_charcode_mapping_table_from_preferences();
    if (tables != null) {
        load_tables(tables);
        message("Loaded mappings.");
    } else {
        if (use_defaults) {
            reset();
            message("No mapping table stored in preferences.  The default mapping table was loaded.");
        }
        else
            message("Error: No mapping table stored in preferences.");
    }
}

function save() {
    var unshifted_table = unshifted_keycode_to_charcode.map(function (x) x.charcode);
    var shifted_table = shifted_keycode_to_charcode.map(function (x) x.charcode);

    var str = [unshifted_table, shifted_table].toSource();
    conkeror.user_pref("conkeror.charCodeMappingTable", str);
    message("Saved mappings.  Restart Conkeror for the new mapping table to take effect.");
}

function reset() {
    let tables = conkeror.get_default_keycode_to_charcode_tables();
    load_tables(tables);
    message("Loaded default mapping table.");
}

function clear_preference() {
    try {
        conkeror.clear_pref("conkeror.charCodeMappingTable");
        message("Cleared preference.  Restart Conkeror for the default table to take effect.");
    } catch (e) {
        message("Preference was already not set.");
    }
}

function message(msg) {
    document.getElementById("message").value = msg;
}

function init() {
    window.addEventListener("keydown", handle_keydown, true);
    window.addEventListener("keypress", handle_keypress, true);

    load(true);
}
