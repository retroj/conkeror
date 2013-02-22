/**
 * (C) Copyright 2009 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

/*
 * Example usage:
 *
 * require('eye-guide.js');
 * define_key(content_buffer_normal_keymap, "space", "eye-guide-scroll-down");
 * define_key(content_buffer_normal_keymap, "back_space", "eye-guide-scroll-up");
 *
 */

define_variable("eye_guide_interval", 800,
    "Interval during which the eye guide is visible (in ms). "+
    "When 0, the eye guide will remain visible.");

define_variable("eye_guide_context_size", 50,
    "Context size in pixels for eye-guide-scroll-down and "+
    "eye-guide-scroll-up.");

define_variable("eye_guide_highlight_new", false,
    "Highlight the new contents of the screen, instead of the old.");

define_variable("eye_guide_on_image_buffers", true,
    "Enable eye guide on image-only buffers.");

function eye_guide_scroll (buffer, scroll_down, hl_new, context, interval) {
    let win = buffer.focused_frame;
    let doc = win.document;
    let scroll_amount = win.innerHeight - context;
    let old_y = win.scrollY;
    win.scrollBy(0, scroll_down ? scroll_amount : -scroll_amount);
    if (win.scrollY == old_y)
        return;
    if (!eye_guide_on_image_buffers && doc instanceof Ci.nsIImageDocument) {
        return;
    }
    if (Math.abs(win.scrollY - old_y) < scroll_amount)
        context = win.innerHeight - (scroll_down ? win.scrollY - old_y : old_y);
    let guide = doc.getElementById("__conkeror_eye_guide");
    if (! guide) {
        guide = doc.createElementNS(XHTML_NS, "div");
        guide.id = "__conkeror_eye_guide";
        doc.documentElement.appendChild(guide);
    }
    if (hl_new) {
        guide.style.top = scroll_down ? context + "px" : "0px";
        guide.style.height = (win.innerHeight - context) + "px";
    } else {
        guide.style.top = scroll_down ? "0px"
            : (win.innerHeight - context) + "px";
        guide.style.height = context + "px";
    }
    guide.style.display = "block";
    guide.className =
        "__conkeror_eye_guide_scroll_" + (scroll_down ? "down" : "up");
    if (win.eye_guide_timer) {
        win.clearTimeout(win.eye_guide_timer);
        win.eye_guide_timer = null;
    }
    if (interval != 0) {
        win.eye_guide_timer = win.setTimeout(
            function () {
                guide.style.display = "none";
            },
            interval);
    }
}

interactive("eye-guide-scroll-down",
    "Alternative to scroll-page-down, displays a guide to help "+
    "your eyes follow the scroll.",
    function (I) {
        eye_guide_scroll(I.buffer, true, eye_guide_highlight_new,
                         eye_guide_context_size, eye_guide_interval);
    });

interactive("eye-guide-scroll-up",
    "Alternative to scroll-page-up, displays a guide to help "+
    "your eyes follow the scroll.",
    function (I) {
        eye_guide_scroll(I.buffer, false, eye_guide_highlight_new,
                         eye_guide_context_size, eye_guide_interval);
    });

provide("eye-guide");
