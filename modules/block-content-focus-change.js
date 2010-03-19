/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 * (C) Copyright 2008-2009 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

/**
 * block-content-focus-change-mode tries very hard to prevent
 * rude websites from changing the element focus via javascript.
 */

in_module(null);

define_variable("block_content_focus_change_duration", 20,
    "Duration (in milliseconds) during which an element is "+
    "allowed to gain focus following a mouse click or key press, "+
    "if `block_content_focus_change_mode' is enabled.");;

function block_content_focus_change_track_input () {
    var browser = this;
    browser.block_content_focus_change_timestamp = Date.now();
}

function block_content_focus_change_reset (buffer) {
    buffer.browser.block_content_focus_change_timestamp = null;
}

function block_content_focus_change_test (buffer, event) {
    return !(event.target instanceof Ci.nsIDOMHTMLAnchorElement) &&
        (buffer.browser.block_content_focus_change_timestamp == null ||
         (Date.now() - buffer.browser.block_content_focus_change_timestamp)
         > block_content_focus_change_duration);
}

function block_content_focus_change_buffer_setup (buffer) {
    if (! (buffer instanceof content_buffer) || buffer.dead)
        return;
    block_content_focus_change_reset(buffer);
    buffer.focusblocker = block_content_focus_change_test;
    buffer.browser.addEventListener("mousedown",
                                    block_content_focus_change_track_input,
                                    true);
    buffer.browser.addEventListener("keypress",
                                    block_content_focus_change_track_input,
                                    true);
}

function block_content_focus_change_buffer_teardown (buffer) {
    if (! (buffer instanceof content_buffer) || buffer.dead)
        return;
    delete buffer.browser.block_content_focus_change_timestamp;
    buffer.focusblocker = null;
    buffer.browser.removeEventListener("mousedown",
                                       block_content_focus_change_track_input,
                                       true);
    buffer.browser.removeEventListener("keypress",
                                       block_content_focus_change_track_input,
                                       true);
}

let (foo = browser_set_element_focus) {
    define_global_mode("block_content_focus_change_mode",
        function () { // enable
            for_each_buffer(function (buffer) {
                block_content_focus_change_buffer_setup(buffer);
            });
            add_hook("create_buffer_hook",
                     block_content_focus_change_buffer_setup);
            add_hook("content_buffer_started_loading_hook",
                     block_content_focus_change_reset);
            add_hook("content_buffer_location_change_hook",
                     block_content_focus_change_reset);
            // this is a really sick hack, but still preferable to
            // considered alternatives.
            conkeror.browser_set_element_focus =
                function (buffer, elem, prevent_scroll) {
                    buffer.browser.block_content_focus_change_timestamp = Date.now();
                    foo.call(this, buffer, elem, prevent_scroll);
                };
        },
        function () { // disable
            for_each_buffer(function (buffer) {
                block_content_focus_change_buffer_teardown(buffer);
            });
            remove_hook("create_buffer_hook",
                        block_content_focus_change_buffer_setup);
            remove_hook("content_buffer_started_loading_hook",
                        block_content_focus_change_reset);
            remove_hook("content_buffer_location_change_hook",
                        block_content_focus_change_reset);
            conkeror.browser_set_element_focus = foo;
        });
}

block_content_focus_change_mode(true);

provide("block-content-focus-change");
