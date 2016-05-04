/**
 * (C) Copyright 2016 Ivy Foster
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

// Reference: https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent

define_variable (
    "click_handler", [],
    "An array of functions to run on click events. " +
    "The function will be passed two arguments: " +
    "the current window and the mouse event.\n" +
    "To create an event, set 'click_handler[n] = some_function;', " +
    "where n is the total value of the buttons pressed.\n" +
    "left = 1\n" + "right = 2\n" + "middle = 4\n" +
    "button4 = 8\n" + "button5 = 16\n\n" +
    "For instance, click_handler.3 would run when " +
    "left and right are pressed together.\n" +
    "For more information, see " +
    "<https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons>."
);

function handle_mouse_click (event) {
    var chord = 0;

    // Translate MouseEvent.button events into MouseEvent.buttons events.
    switch (event.button) {
    case 0:
        chord = 1;
        break;
    case 1:
        chord = 4;
        break;
    case 2:
        chord = 2;
        break;
    case 3:
        chord = 8;
        break;
    case 4:
        chord = 16;
        break;
    }

    chord += event.buttons;

    if (click_handler[chord]) {
        click_handler[chord](this.ownerDocument.defaultView, event);
    }
}

define_variable(
    "clicks_in_new_buffer_target", OPEN_NEW_BUFFER,
    "Destination for new buffers created by clicks. " +
    "Set to one the constants OPEN_NEW_BUFFER, " +
    "OPEN_NEW_BUFFER_BACKGROUND, or OPEN_NEW_WINDOW.\n" +
    "Default is OPEN_NEW_BUFFER."
);

function clicked_link_in_new_buffer (window, event) {
    let element = event.target;
    let anchor = null;
    if (element instanceof Ci.nsIDOMHTMLAnchorElement ||
        element instanceof Ci.nsIDOMHTMLAreaElement) {
        anchor = element;
    } else {
        for (let p = element.parentNode;
            p != null && p.tagName.toLowerCase() != "html";
            p = p.parentNode) {
            if (p.tagName.toLowerCase() == "a") {
                anchor = p;
                break;
            } else { return; }
        }
    }

    event.preventDefault();
    event.stopPropagation();
    let spec = load_spec(anchor);
    let buffer = window.buffers.current;
    create_buffer(window,
        buffer_creator(content_buffer,
            $opener = buffer,
            $load = spec),
        clicks_in_new_buffer_target);
}

function handle_click_add_listener(buffer) {
    buffer.browser.addEventListener("click", handle_mouse_click, true);
}

function handle_click_remove_listener(buffer) {
    buffer.browser.removeEventListener("click", handle_mouse_click, true);
}

function mouse_click_event_mode_enable() {
    add_hook("create_buffer_hook", handle_click_add_listener);
    for_each_buffer(handle_click_add_listener);
}

function mouse_click_event_mode_disable() {
    remove_hook("create_buffer_hook", handle_click_add_listener);
    for_each_buffer(handle_click_remove_listener);
}

define_global_mode("mouse_click_event_mode",
    mouse_click_event_mode_enable, mouse_click_event_mode_disable
);

mouse_click_event_mode(true);

provide("mouse");
