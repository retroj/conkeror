/**
 * (C) Copyright 2012 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("content-buffer.js");

define_keymap("duckduckgo_keymap", $display_name = "duckduckgo");
define_keymap("duckduckgo_anchor_keymap", $display_name = "duckduckgo-anchor");
define_keymap("duckduckgo_select_keymap", $display_name = "duckduckgo-select");

function duckduckgo_call_command (buffer, command) {
    var s = Components.utils.Sandbox(buffer.top_frame);
    s.window = buffer.top_frame.wrappedJSObject;
    s.document = buffer.document.wrappedJSObject;
    Components.utils.evalInSandbox("window."+command+"()", s);
}

function duckduckgo_command (command) {
    return function (I) {
        duckduckgo_call_command(I.buffer, command);
    };
}

// The bindings were found in <http://duckduckgo.com/d676.js>.  Each one
// corresponds to a call to 'new YAHOO.util.KeyListener(...)', from which
// the keycode and function name can be gotten.

interactive("duckduckgo-down",
    "Calls DuckDuckGo command.",
    duckduckgo_command("nkda"));

interactive("duckduckgo-up",
    "Calls DuckDuckGo command.",
    duckduckgo_command("nkua"));

interactive("duckduckgo-focus-search",
    "Calls DuckDuckGo command.",
    duckduckgo_command("nks"));

interactive("duckduckgo-related-topics",
    "Calls DuckDuckGo command.",
    duckduckgo_command("nkr"));

interactive("duckduckgo-main-results",
    "Calls DuckDuckGo command.",
    duckduckgo_command("nkm"));

interactive("duckduckgo-bang-dropdown",
    "Calls DuckDuckGo command.",
    duckduckgo_command("nkex"));

interactive("duckduckgo-domain-search",
    "Calls DuckDuckGo command.",
    duckduckgo_command("nkd"));

interactive("duckduckgo-follow-current",
    "Calls DuckDuckGo command.",
    alternates(duckduckgo_command("nke"),
               duckduckgo_command("nkn")));

define_key(duckduckgo_keymap, "j", "duckduckgo-down");
define_key(duckduckgo_keymap, "k", "duckduckgo-up");
define_key(duckduckgo_keymap, "down", "duckduckgo-down");
define_key(duckduckgo_keymap, "up", "duckduckgo-up");
define_key(duckduckgo_keymap, "r", "duckduckgo-related-topics");
define_key(duckduckgo_keymap, "m", "duckduckgo-main-results");
define_key(duckduckgo_keymap, "/", "duckduckgo-focus-search");
define_key(duckduckgo_keymap, "!", "duckduckgo-bang-dropdown");
define_key(duckduckgo_keymap, "d", "duckduckgo-domain-search");
define_key(duckduckgo_select_keymap, "return", "duckduckgo-follow-current");

define_keymaps_page_mode("duckduckgo-mode",
    build_url_regexp($domain = "duckduckgo"),
    { normal: duckduckgo_keymap,
      anchor: duckduckgo_anchor_keymap,
      select: duckduckgo_select_keymap },
    $display_name = "DuckDuckGo");

page_mode_activate(duckduckgo_mode);

provide("duckduckgo");
