
/* This implements nsIHelperAppLauncherDialog interface. */
function download_helper()
{
}
download_helper.prototype = {
    QueryInterface: function (iid) {
        if (!iid.equals(Ci.nsIHelperAppLauncherDialog) &&
            !iid.equals(Ci.nsIWebProgressListener2) &&
            !iid.equals(Ci.nsISupports)) {
            throw Cr.NS_ERROR_NO_INTERFACE;
        }
        return this;
    },

    create_panel : function() {
        /* Show information panel above minibuffer */
        
        var g = new dom_generator(this.window.document, XUL_NS);

        var p = g.element("vbox", "class", "download-panel", "flex", "0");
        var grid = g.element("grid", p);
        var cols = g.element("columns", grid);
        g.element("column", cols, "flex", "0");
        g.element("column", cols, "flex", "1");

        var rows = g.element("rows", grid);
        var row;

        row = g.element("row", rows);
        g.element("label", row,
                  "value", "Downloading:",
                  "class", "downloading-label");
        g.element("label", row,
                  "value", this.launcher.source.spec,
                  "class", "downloading-url");

        row = g.element("row", rows);
        g.element("label", row, "value", "Mime type:", "class", "mime-type-label");
        g.element("label", row, "value", this.launcher.MIMEInfo.MIMEType,
                  "class", "mime-type");

        this.window.minibuffer.insert_before(p);
        this.panel = p;
    },

    show : function (launcher, context, reason) {
        this.launcher = launcher;

        // Get associated buffer; if that fails (hopefully not), just get any window
        var buffer = null;
        var window = null;
        try {
            var frame = context.QueryInterface(Ci.nsIWebProgress).DOMWindow.top;
            window = get_window_from_frame(frame);
            if (window)
                buffer = get_buffer_from_frame(window, frame);
        } catch (e) {
            window = get_recent_conkeror_window();

            if (window == null) {
                // FIXME: need to handle this case perhaps where no windows exist
                this.abort(); // for now, just cancel the download
                return;
            }
        }

        this.window = window;
        this.buffer = buffer;
        
        var obj = this;

        this.launcher.setWebProgressListener(this);

        var dir;
        // FIXME: this should be done by some function specified as a user preference
        if (buffer)
            dir = buffer.cwd;
        else
            dir = default_directory.path;
        dir = get_file(dir);
        dir.append(this.launcher.suggestedFileName);

        var suggested_path = dir.path;

        this.create_panel();

        function choose_action() {
            var s = new single_character_options_minibuffer_state(
                $prompt = "Action to perform: (save or open)",
                $options = ["s", "o"],
                $callback = function (x) {
                    obj.minibuffer_state = null;
                    if (x == "s")
                        read_save_path();
                    else
                        read_program();
                },
                $abort_callback = function () {
                    obj.minibuffer_state = null;
                    obj.abort();
                });
            obj.window.minibuffer.push_state(s);
            obj.minibuffer_state = s;
        }

        function read_program() {
            var mime_type = obj.launcher.MIMEInfo.MIMEType;
            var suggested_action = get_external_handler_for_mime_type(mime_type);
            obj.minibuffer_state = minibuffer_read_shell_command(
                obj.window.minibuffer, $prompt = "Shell command:",
                $initial_value = suggested_action,
                $abort_callback = function() {
                    obj.minibuffer_state = null;
                    obj.abort();
                },
                $callback = function (cmd) {
                    obj.minibuffer_state = null;
                    /* FIXME: This should be implemented using the download manager */
                    /* Just abort for now */
                    dumpln("chose command: " + cmd);
                    obj.abort();
                });
        }
        
        function check_overwrite(f) {
            var s = new yes_or_no_minibuffer_state(
                $prompt = "File " + f.path + " exists.  Overwrite?",
                $callback = function (overwrite) {
                    obj.minibuffer_state = null;
                    if (overwrite) {
                        obj.launcher.saveToDisk(f, false);
                        obj.cleanup();
                    } else {
                        suggested_path = f.path;
                        read_save_path();
                    }
                },
                $abort_callback = function() {
                    obj.minibuffer_state = null;
                    obj.abort();
                });
            obj.minibuffer_state = s;
            obj.window.minibuffer.push_state(s);
        }

        function read_save_path() {
            var f = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
            var s = obj.window.minibuffer.read(
                $prompt = "Save to file:",
                $initial_value = suggested_path,
                $history = "file",
                $validator = function (val, m) {
                    try {
                        f.initWithPath(val);
                        return true;
                    } catch (e) {
                        m.message("Invalid path: " + val);
                        return false;
                    }
                },
                $callback = function() {
                    obj.minibuffer_state = null;
                    if (f.exists())
                        check_overwrite(f);
                    else {
                        obj.launcher.saveToDisk(f, false);
                        obj.cleanup();
                    }
                },
                $abort_callback = function() {
                    obj.minibuffer_state = null;
                    obj.abort();
                });
            obj.minibuffer_state = s;
        }
        choose_action();
    },

    abort : function () {
        if (this.minibuffer_state) {
            this.window.minibuffer.remove_state(this.minibuffer_state);
            this.minibuffer_state = null;
        }
        const NS_BINDING_ABORTED = 0x804b0002;
        this.launcher.cancel(NS_BINDING_ABORTED);
        this.cleanup();
    },

    cleanup : function () {
        if (this.panel)
            this.panel.parentNode.removeChild(this.panel);
        this.panel = null;
        this.launcher = null;
        this.window = null;
        this.buffer = null;
    },

    promptForSaveToFile : function(launcher, context, default_file, suggested_file_extension) {
        return null;
    },

    // nsIWebProgressListener methods.
    // Look for error notifications and display alert to user.
    onStatusChange: function( aWebProgress, aRequest, aStatus, aMessage ) {
        if (aStatus != Cr.NS_OK ) {

            // FIXME: fix this message
            this.window.minibuffer.message("Save aborted: " + aMessage);
            this.abort();
        }
    },

    // Ignore onProgressChange, onProgressChange64, onStateChange,
    // onLocationChange, onSecurityChange, and onRefreshAttempted
    // notifications.
    onProgressChange: function() {},
    onProgressChange64: function() {},
    onStateChange: function() {},
    onLocationChange: function() {},
    onSecurityChange: function() {},
    onRefreshAttempted: function() { return true; }
};
