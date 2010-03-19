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

in_module(null);

define_variable("eye_guide_interval", 800,
    "Interval during which the eye guide is visible (in ms). "+
    "When 0, the eye guide will remain visible.");

define_variable("eye_guide_context_size", 50,
    "Context size in pixels for eye-guide-scroll-down and "+
    "eye-guide-scroll-up.");

interactive("eye-guide-scroll-down",
    "Alternative to scroll-page-down, displays a guide to help "+
    "your eyes follow the scroll.",
    function(I) {
        let win = I.buffer.focused_frame;
        let doc = I.buffer.document;
        let context = eye_guide_context_size;
        let old_y = win.scrollY;
        win.scrollBy(0, win.innerHeight - context);
        if (win.scrollY == old_y)
            return;
        if (win.scrollY - old_y < win.innerHeight - context)
            context = win.innerHeight - (win.scrollY - old_y);
        let guide = doc.getElementById("__conkeror_eye_guide");
        if (! guide) {
            guide = doc.createElementNS(XHTML_NS, "div");
            guide.id = "__conkeror_eye_guide";
            doc.documentElement.appendChild(guide);
        }
        guide.style.top = '0px';
        guide.style.height = context+'px';
        guide.style.display = "block";
        guide.className = "__conkeror_eye_guide_scroll_down";
        if (win.eye_guide_timer) {
            win.clearTimeout(win.eye_guide_timer);
            win.eye_guide_timer = null;
        }
        if (eye_guide_interval != 0)
            win.eye_guide_timer = win.setTimeout(
                function () {
                    guide.style.display = "none";
                },
                eye_guide_interval);
    });

interactive("eye-guide-scroll-up",
    "Alternative to scroll-page-up, displays a guide to help "+
    "your eyes follow the scroll.",
    function(I) {
        let win = I.buffer.focused_frame;
        let doc = I.buffer.document;
        let context = eye_guide_context_size;
        let old_y = win.scrollY;
        win.scrollBy(0, 0 - (win.innerHeight - context));
        if (win.scrollY == old_y)
            return;
        if (old_y - win.scrollY < win.innerHeight - context)
            context = win.innerHeight - old_y;
        let guide = doc.getElementById("__conkeror_eye_guide");
        if (! guide) {
            guide = doc.createElementNS(XHTML_NS, "div");
            guide.id = "__conkeror_eye_guide";
            doc.documentElement.appendChild(guide);
        }
        guide.style.top = (win.innerHeight - context) + "px";
        guide.style.height = context+'px';
        guide.style.display = "block";
        guide.className = "__conkeror_eye_guide_scroll_up";
        if (win.eye_guide_timer) {
            win.clearTimeout(win.eye_guide_timer);
            win.eye_guide_timer = null;
        }
        if (eye_guide_interval != 0)
            win.eye_guide_timer = win.setTimeout(
                function () {
                    guide.style.display = "none";
                },
                eye_guide_interval);
    });

provide("eye-guide");
