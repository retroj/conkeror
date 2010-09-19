/**
 * (C) Copyright 2008 Nicholas Zigarovich
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

define_variable("clicks_in_new_buffer_button", 1,
                "Which mouse button should open links in a new buffer. " +
                "0 = left, 1 = middle, 2 = right. Default is 1.");

define_variable("clicks_in_new_buffer_target", OPEN_NEW_BUFFER,
                "How to open links in a new buffer, in the foreground or " +
                "the background. Set to one the constants OPEN_NEW_BUFFER " +
                "or OPEN_NEW_BUFFER_BACKGROUND. Default is OPEN_NEW_BUFFER.");

// Should mouse click event propagation be stopped?
var clicks_in_new_buffer_ev_stop_prop = true;

function find_tag_in_parents (tag, element) {
    // FIXME If tag names will always be upper-case, toLowerCase() can
    //       be eliminated. Also not sure that p will ever be null.
    tag = tag.toLowerCase();
    for (let p = element.parentNode;
         p != null && p.tagName.toLowerCase() != "html";
         p = p.parentNode)
    {
        if (p.tagName.toLowerCase() == tag)
            return p;
    }
    return null;
}

function open_link_in_new_buffer (event) {
    if (event.button != clicks_in_new_buffer_button)
        return;
    let element = event.target;
    let anchor = null;
    if (element instanceof Ci.nsIDOMHTMLAnchorElement ||
        element instanceof Ci.nsIDOMHTMLAreaElement)
    {
        anchor = element;
    } else
        anchor = find_tag_in_parents("a", element);
    if (anchor == null)
        return;
    event.preventDefault();
    if (clicks_in_new_buffer_ev_stop_prop)
        event.stopPropagation();
    let spec = load_spec(anchor);
    let window = this.ownerDocument.defaultView;
    let buffer = window.buffers.current;
    create_buffer(window,
                  buffer_creator(content_buffer, $load = spec),
                  clicks_in_new_buffer_target);
}

function clicks_in_new_buffer_add_listener (buffer) {
    buffer.browser.addEventListener("click",
                                    open_link_in_new_buffer,
                                    true);
}

function clicks_in_new_buffer_remove_listener (buffer) {
    buffer.browser.removeEventListener("click",
                                       open_link_in_new_buffer,
                                       true);
}

function clicks_in_new_buffer_mode_enable () {
    add_hook("create_buffer_hook",
             clicks_in_new_buffer_add_listener);
    for_each_buffer(clicks_in_new_buffer_add_listener);
}

function clicks_in_new_buffer_mode_disable () {
    remove_hook("create_buffer_hook",
                clicks_in_new_buffer_add_listener);
    for_each_buffer(clicks_in_new_buffer_remove_listener);
}

define_global_mode("clicks_in_new_buffer_mode",
                   clicks_in_new_buffer_mode_enable,
                   clicks_in_new_buffer_mode_disable);

clicks_in_new_buffer_mode(true);

provide("clicks-in-new-buffer");
