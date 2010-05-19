/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

function open_dom_inspector () {
    make_chrome_window("chrome://inspector/content/");
}

function inspect_dom_document (document) {
    make_chrome_window("chrome://inspector/content/", document);
}

function inspect_dom_node (node) {
    make_chrome_window("chrome://inspector/content/", node);
}

function inspect_javascript_object (obj) {
    make_chrome_window("chrome://inspector/content/object.xul", obj);
}

interactive("inspector",
    "Open the DOM Inspector in a new window.",
    open_dom_inspector);

interactive("inspect-chrome",
    "Inspect the chrome document for the current Conkeror window.",
    function (I) { inspect_dom_document(I.window.document); });

interactive("inspect-page",
    "Inspect the current content document.",
    function (I) { inspect_dom_document(I.buffer.document); });

interactive("inspect-click",
    "Inspect the target of the next mouse click.",
    function (I) {
        var window = I.window;
        function handler (e) {
            e.preventDefault();
            e.stopPropagation();
            window.removeEventListener("click", arguments.callee, true);
            inspect_dom_node(e.target);
        }
        window.addEventListener("click", handler, true);
        I.minibuffer.message("Click in this window to select the DOM node to inspect.");
    });

provide("dom-inspector");
