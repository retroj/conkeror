
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


function next_frameset_frame (prefix) {
    function find_frames_r (doc) {
        var frames = [];
        var fr = doc.getElementsByTagName ("FRAME");
        if (fr.length == 0) { return []; }
        for (var i = 0; i < fr.length; i++) {
            frames.push (fr[i]);
            frames = frames.concat (find_frames_r (fr[i].contentDocument));
        }
        return frames;
    }

    var frames = find_frames_r (this.window.content.document);
    if (frames.length == 0)
    {
        this.message ("no other frameset frame");
        return;
    }

    var w = this.document.commandDispatcher.focusedWindow;

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

    frameset_notify.call (this, box.screenX, box.screenY,
                          "frameset frame "+next);
}
interactive("next-frameset-frame", next_frameset_frame, ['p']);



function next_iframe (prefix) {
    var frames = this.window.content.document.getElementsByTagName ("IFRAME");
    if (frames.length == 0)
    {
        this.message ("no other iframe");
        return;
    }

    var current = this.document.commandDispatcher.focusedWindow;

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

    while (this.document.commandDispatcher.focusedWindow == current)
    {
        next = (next + (prefix < 0 ? -1 : 1)) % frames.length;
        if (next < 0)
            next += frames.length;

        if (next == pnext) {
            this.message ("no other iframe visible");
            return;
        }

        frames[next].contentWindow.focus();
    }

    var box = this.window.content.document.getBoxObjectFor (frames[next]);
    frames[next].scrollIntoView (false);

    frameset_notify.call (this, box.screenX, box.screenY,
                          "iframe "+next);
}
interactive("next-iframe", next_iframe, ['p']);


function frameset_focus_top () {
    this.top.content.focus();
    var box = this.getBrowser().boxObject;
    frameset_notify.call (this, box.screenX, box.screenY, "frameset top");
}
interactive("frameset-focus-top", frameset_focus_top, []);


