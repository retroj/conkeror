
var notification_timer = null; // XXX: this should be a window variable.

function frameset_notify (x, y, text) {
    var notification = this.document.getElementById ("frameset-notification");
    var notification_label = this.document.getElementById ("frameset-notification-label");
    notification_label.value = text;
    notification.showPopup (this.document.getElementById ("content"),
                            x, y, "popup");
    this.clearTimeout (notification_timer);
    notification_timer = this.setTimeout (
        function () { notification.hidePopup (); },
        1000);
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
    var frames = frameset_find_frames_r (frame.window.content.document, ["FRAME"]);
    if (frames.length == 0)
    {
        frame.minibuffer.message ("no other frameset frame");
        return;
    }

    var w = frame.document.commandDispatcher.focusedWindow;

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

    frameset_notify.call (frame, box.screenX, box.screenY,
                          "frameset frame "+next);
}
interactive("next-frameset-frame", next_frameset_frame, ['current_frame', 'p']);



function next_iframe (frame, prefix) {
    var frames = frame.content.document.getElementsByTagName ("IFRAME");
    if (frames.length == 0)
    {
        frame.minibuffer.message ("no other iframe");
        return;
    }

    var current = frame.document.commandDispatcher.focusedWindow;

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

    while (frame.document.commandDispatcher.focusedWindow == current)
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

    var box = frame.window.content.document.getBoxObjectFor (frames[next]);
    frames[next].scrollIntoView (false);

    frameset_notify.call (frame, box.screenX, box.screenY,
                          "iframe "+next);
}
interactive("next-iframe", next_iframe, ['current_frame', 'p']);


function frameset_focus_top (frame) {
    frame.top.content.focus();
    var box = frame.buffers.container.boxObject;
    frameset_notify.call (frame, box.screenX, box.screenY, "frameset top");
}
interactive("frameset-focus-top", frameset_focus_top, ['current_frame']);


function frameset_focus_up (frame) {
    var parent = frame.document.commandDispatcher.focusedWindow.parent;
    parent.focus();
    frameset_notify.call (frame, parent.screenX, parent.screenY, "frameset up");
}
interactive("frameset-focus-up", frameset_focus_up, ['current_frame']);

