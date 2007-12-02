
function close_frameset_notification_popup(frame)
{
    if (frame.frameset_notification_timer)
    {
        frame.clearTimeout (frame.frameset_notification_timer);
        frame.frameset_notification_timer = null;
        frame.frameset_notification_popup.hidePopup();
    }
}

function frameset_initialize_frame(frame) {
    var p = frame.popups.create();
    p.setAttribute("id", "frameset-notification");
    p.addEventListener("popuphidden", function () {
            frame.clearTimeout (frame.frameset_notification_timer);
            frame.frameset_notification_timer = null;
        }, true /* capture */, false /* don't allow untrusted */);
    frame.frameset_notification_popup = p;
    var desc = create_XUL(frame, "label");
    desc.setAttribute("id", "frameset-notification-label");
    p.appendChild(desc);
    frame.frameset_notification_label = desc;
}

add_hook("frame_initialize_hook", frameset_initialize_frame);

add_hook("select_buffer_hook", function (buffer) { close_frameset_notification_popup(buffer.frame); });

/* USER PREFERENCE */
var frameset_notify_timeout = 1000;

function frameset_notify (frame, x, y, text) {
    frame.frameset_notification_label.setAttribute("value", text);
    frame.popups.show_absolute(frame.frameset_notification_popup, x, y);
    frame.frameset_notification_timer = frame.setTimeout (
        function () {
            frame.frameset_notification_timer = null;
            frame.frameset_notification_popup.hidePopup();
        }, frameset_notify_timeout);
}

function frameset_find_frames_r (doc, types) {
    var frames = [];
    for (var j = 0; j < types.length; j++) {
        var fr = doc.getElementsByTagName (types[j]);
        for (var i = 0; i < fr.length; i++) {
            frames.push (fr[i]);
            frames = frames.concat (frameset_find_frames_r (fr[i].contentDocument, types));
        }
    }
    return frames;
}


function next_frameset_frame (frame, prefix) {
    var frames = frameset_find_frames_r (frame.buffers.current.content_document, ["FRAME"]);
    if (frames.length == 0)
    {
        frame.minibuffer.message ("no other frameset frame");
        return;
    }

    var w = frame.buffers.current.focused_window();

    var next = 0;

    for (var i = 0; i < frames.length; i++) {
        if (w.document == frames[i].contentDocument) {
            next = (i + prefix) % frames.length;
            // the % operator is actually remainder in javascript, so we have
            // to watch for negative results.
            if (next < 0)
                next += frames.length;
            break;
        }
    }
    frames[next].scrollIntoView (false);
    frames[next].contentWindow.focus();

    var box = frames[next].ownerDocument.getBoxObjectFor (frames[next]);

    frameset_notify (frame, box.screenX, box.screenY,
                          "frameset frame "+next);
}
interactive("next-frameset-frame", next_frameset_frame, I.current_frame, I.p);



function next_iframe (frame, prefix) {
    var frames = frame.buffers.current.content_document.getElementsByTagName ("IFRAME");
    if (frames.length == 0)
    {
        frame.minibuffer.message ("no other iframe");
        return;
    }

    var current = frame.buffers.current.focused_window();

    var pnext = 0;

    for (var i = 0; i < frames.length; i++) {
        if (current.document == frames[i].contentDocument) {
            pnext = (i + prefix) % frames.length;
            // the % operator is actually remainder in javascript, so we have
            // to watch for negative results.
            if (pnext < 0)
                pnext += frames.length;
            break;
        }
    }

    var next = pnext;
    frames[next].contentWindow.focus();

    while (frame.buffers.content.focused_window() == current)
    {
        next = (next + (prefix < 0 ? -1 : 1)) % frames.length;
        if (next < 0)
            next += frames.length;

        if (next == pnext) {
            frame.minibuffer.message ("no other iframe visible");
            return;
        }

        frames[next].contentWindow.focus();
    }

    var box = frame.buffers.current.content_document.getBoxObjectFor (frames[next]);
    frames[next].scrollIntoView (false);

    frameset_notify (frame, box.screenX, box.screenY,
                          "iframe "+next);
}
interactive("next-iframe", next_iframe, I.current_frame, I.p);


function frameset_focus_top (b) {
    b.content_window.focus();
    var box = b.frame.buffers.container.boxObject;
    frameset_notify (b.frame, box.screenX, box.screenY, "frameset top");
}
interactive("frameset-focus-top", frameset_focus_top, I.current_buffer(browser_buffer));


function frameset_focus_up (b) {
    var parent = b.focused_window().parent;
    parent.focus();
    frameset_notify (b.frame, parent.screenX, parent.screenY, "frameset up");
}
interactive("frameset-focus-up", frameset_focus_up, I.current_buffer(browser_buffer));
