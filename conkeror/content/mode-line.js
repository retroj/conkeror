

function showModeline()
{
    var modeline = this.getBrowser().modeLine;
    modeline.hidden = ! conkeror.mode_line_enabled;
}

function update_mode_line ()
{
    var url = this.getWebNavigation().currentURI;
    var docshell = this.document.getElementById("content").webNavigation;
    var modeline = this.getBrowser().modeLine;
    var time = new Date();
    var hours = time.getHours();
    var mins = time.getMinutes();
    var win = this.document.commandDispatcher.focusedWindow;
    var x = win.scrollMaxX == 0 ? 100 : Math.round(win.scrollX / win.scrollMaxX * 100);
    var y = win.scrollMaxY == 0 ? 100 : Math.round(win.scrollY / win.scrollMaxY * 100);
    var val = "";
    if (url) {
        val += url.spec;
    }
    val += "    " + (hours<10 ? "0" + hours:hours)
	+ ":" + (mins<10 ?"0" +mins:mins);
    val += "    (" + x + "," + y + ")";
    modeline.value = val;
    showModeline.call (this);
}


conkeror.add_hook(conkeror.location_changed_hook, update_mode_line);
conkeror.add_hook(conkeror.make_frame_after_hook, update_mode_line);
conkeror.add_hook(conkeror.select_buffer_hook,    update_mode_line);

