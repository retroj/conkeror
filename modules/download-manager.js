/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("special-buffer.js");
require("mime-type-override.js");
require("minibuffer-read-mime-type.js");

var download_manager_service = Cc["@mozilla.org/download-manager;1"].getService(Ci.nsIDownloadManager);
//var download_manager_ui = Cc["@mozilla.org/download-manager-ui;1"].getService(Ci.nsIDownloadManagerUI);
var download_manager_builtin_ui = Components.classesByID["{7dfdf0d1-aff6-4a34-bad1-d0fe74601642}"]
    .getService(Ci.nsIDownloadManagerUI);

/* This implements nsIHelperAppLauncherDialog interface. */
function download_helper()
{}
download_helper.prototype = {
    QueryInterface: generate_QI(Ci.nsIHelperAppLauncherDialog, Ci.nsIWebProgressListener2),

    handle_show: function () {
        var action_chosen = false;

        var can_view_internally = this.frame != null &&
                can_override_mime_type_for_uri(this.launcher.source);
        try {
            this.panel = create_info_panel(this.window, "download-panel",
                                           [["downloading", "Downloading:", this.launcher.source.spec],
                                            ["mime-type", "Mime type:", this.launcher.MIMEInfo.MIMEType]]);
            var action = yield this.window.minibuffer.read_single_character_option(
                $prompt = "Action to perform: (s: save; o: open; O: open URL; c: copy URL; " +
                    (can_view_internally ? "i: view internally; t: view as text)" : ")"),
                $options = (can_view_internally ? ["s", "o", "O", "c", "i", "t"] : ["s", "o", "O", "c"]));

            if (action == "s") {
                var suggested_path = suggest_save_path_from_file_name(this.launcher.suggestedFileName, this.buffer);
                var file = yield this.window.minibuffer.read_file_check_overwrite(
                    $prompt = "Save to file:",
                    $initial_value = suggested_path,
                    $select);
                register_download(this.buffer, this.launcher.source);
                this.launcher.saveToDisk(file, false);
                action_chosen = true;

            } else if (action == "o") {
                var cwd = this.buffer ? this.buffer.cwd : default_directory.path;
                var mime_type = this.launcher.MIMEInfo.MIMEType;
                var suggested_action = get_external_handler_for_mime_type(mime_type);
                var command = yield this.window.minibuffer.read_shell_command(
                    $initial_value = suggested_action,
                    $cwd = cwd);
                var file = get_temporary_file(this.launcher.suggestedFileName);
                var info = register_download(this.buffer, this.launcher.source);
                info.temporary_status = DOWNLOAD_TEMPORARY_FOR_COMMAND;
                info.set_shell_command(command, cwd);
                this.launcher.saveToDisk(file, false);
                action_chosen = true;
            } else if (action == "O") {
                action_chosen = true;
                this.abort(); // abort download
                let mime_type = this.launcher.MIMEInfo.MIMEType;
                let cwd = this.buffer ? this.buffer.cwd : this.window.buffers.current.cwd;
                let cmd = yield this.window.minibuffer.read_shell_command(
                    $cwd = cwd,
                    $initial_value = get_external_handler_for_mime_type(mime_type));
                shell_command_with_argument_blind(cmd, this.launcher.source.spec, $cwd = cwd);
            } else if (action == "c") {
                action_chosen = true;
                this.abort(); // abort download
                let uri = this.launcher.source.spec;
                writeToClipboard(uri);
                this.window.minibuffer.message("Copied: " + uri);
            } else /* if (action == "i" || action == "t") */ {
                let mime_type;
                if (action == "t")
                    mime_type = "text/plain";
                else {
                    let suggested_type = this.launcher.MIMEInfo.MIMEType;
                    if (gecko_viewable_mime_type_list.indexOf(suggested_type) == -1)
                        suggested_type = "text/plain";
                    mime_type = yield this.window.minibuffer.read_gecko_viewable_mime_type(
                        $prompt = "View internally as",
                        $initial_value = suggested_type,
                        $select);
                }
                action_chosen = true;
                this.abort(); // abort before reloading

                override_mime_type_for_next_load(this.launcher.source, mime_type);
                this.frame.location = this.launcher.source.spec; // reload
            }
        } catch (e) {
            handle_interactive_error(this.window, e);
        } finally {
            if (!action_chosen)
                this.abort();
            this.cleanup();
        }
    },

    show : function (launcher, context, reason) {
        this.launcher = launcher;

        // Get associated buffer; if that fails (hopefully not), just get any window
        var buffer = null;
        var window = null;
        var frame = null;
        try {
            frame = context.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal);
            window = get_window_from_frame(frame.top);
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

        this.frame = frame;
        this.window = window;
        this.buffer = buffer;

        co_call(this.handle_show());
    },

    abort : function () {
        const NS_BINDING_ABORTED = 0x804b0002;
        this.launcher.cancel(NS_BINDING_ABORTED);
    },

    cleanup : function () {
        if (this.panel)
            this.panel.destroy();
        this.panel = null;
        this.launcher = null;
        this.window = null;
        this.buffer = null;
        this.frame = null;
    },

    promptForSaveToFile : function(launcher, context, default_file, suggested_file_extension) {
        return null;
    }
};


var unmanaged_download_info_list = [];
var id_to_download_info = {};

// Import these constants for convenience
const DOWNLOAD_NOTSTARTED = Ci.nsIDownloadManager.DOWNLOAD_NOTSTARTED;
const DOWNLOAD_DOWNLOADING = Ci.nsIDownloadManager.DOWNLOAD_DOWNLOADING;
const DOWNLOAD_FINISHED = Ci.nsIDownloadManager.DOWNLOAD_FINISHED;
const DOWNLOAD_FAILED = Ci.nsIDownloadManager.DOWNLOAD_FAILED;
const DOWNLOAD_CANCELED = Ci.nsIDownloadManager.DOWNLOAD_CANCELED;
const DOWNLOAD_PAUSED = Ci.nsIDownloadManager.DOWNLOAD_PAUSED;
const DOWNLOAD_QUEUED = Ci.nsIDownloadManager.DOWNLOAD_QUEUED;
const DOWNLOAD_BLOCKED = Ci.nsIDownloadManager.DOWNLOAD_BLOCKED;
const DOWNLOAD_SCANNING = Ci.nsIDownloadManager.DOWNLOAD_SCANNING;


const DOWNLOAD_NOT_TEMPORARY = 0;
const DOWNLOAD_TEMPORARY_FOR_ACTION = 1;
const DOWNLOAD_TEMPORARY_FOR_COMMAND = 2;

function download_info(source_buffer, mozilla_info) {
    this.source_buffer = source_buffer;
    if (mozilla_info != null)
        this.attach(mozilla_info);
}
download_info.prototype = {
    attach : function (mozilla_info) {
        this.mozilla_info = mozilla_info;
        id_to_download_info[mozilla_info.id] = this;
        download_added_hook.run(this);
    },

    shell_command : null,

    shell_command_cwd : null,

    temporary_status : DOWNLOAD_NOT_TEMPORARY,

    action_description : null,

    set_shell_command : function (str, cwd) {
        this.shell_command = str;
        this.shell_command_cwd = cwd;
        if (this.mozilla_info)
            download_shell_command_change_hook.run(this);
    },

    /**
     * None of the following members may be used until attach is called
     */

    // Reflectors to properties of nsIDownload
    get state () { return this.mozilla_info.state; },
    get target_file () { return this.mozilla_info.targetFile; },
    get amount_transferred () { return this.mozilla_info.amountTransferred; },
    get percent_complete () { return this.mozilla_info.percentComplete; },
    get size () {
        var s = this.mozilla_info.size;
        /* nsIDownload.size is a PRUint64, and will have value
         * LL_MAXUINT (2^64 - 1) to indicate an unknown size.  Because
         * JavaScript only has a double numerical type, this value
         * cannot be represented exactly, so 2^36 is used instead as the cutoff. */
        if (s < 68719476736 /* 2^36 */)
            return s;
        return -1;
    },
    get source () { return this.mozilla_info.source; },
    get start_time () { return this.mozilla_info.startTime; },
    get speed () { return this.mozilla_info.speed; },
    get MIME_info () { return this.mozilla_info.MIMEInfo; },
    get MIME_type () {
        if (this.MIME_info)
            return this.MIME_info.MIMEType;
        return null;
    },
    get id () { return this.mozilla_info.id; },
    get referrer () { return this.mozilla_info.referrer; },

    throw_if_removed : function () {
        if (this.removed)
            throw interactive_error("Download has already been removed from the download manager.");
    },

    throw_state_error : function () {
        switch (this.state) {
        case DOWNLOAD_DOWNLOADING:
            throw interactive_error("Download is already in progress.");
        case DOWNLOAD_FINISHED:
            throw interactive_error("Download has already completed.");
        case DOWNLOAD_FAILED:
            throw interactive_error("Download has already failed.");
        case DOWNLOAD_CANCELED:
            throw interactive_error("Download has already been canceled.");
        case DOWNLOAD_PAUSED:
            throw interactive_error("Download has already been paused.");
        case DOWNLOAD_QUEUED:
            throw interactive_error("Download is queued.");
        default:
            throw new Error("Download has unexpected state: " + this.state);
        }
    },

    // Download manager operations
    cancel : function ()  {
        this.throw_if_removed();
        switch (this.state) {
        case DOWNLOAD_DOWNLOADING:
        case DOWNLOAD_PAUSED:
        case DOWNLOAD_QUEUED:
            try {
                download_manager_service.cancelDownload(this.id);
            } catch (e) {
                throw interactive_error("Download cannot be canceled.");
            }
            break;
        default:
            this.throw_state_error();
        }
    },

    retry : function () {
        this.throw_if_removed();
        switch (this.state) {
        case DOWNLOAD_CANCELED:
        case DOWNLOAD_FAILED:
            try {
                download_manager_service.retryDownload(this.id);
            } catch (e) {
                throw interactive_error("Download cannot be retried.");
            }
            break;
        default:
            this.throw_state_error();
        }
    },

    resume : function () {
        this.throw_if_removed();
        switch (this.state) {
        case DOWNLOAD_PAUSED:
            try {
                download_manager_service.resumeDownload(this.id);
            } catch (e) {
                throw interactive_error("Download cannot be resumed.");
            }
            break;
        default:
            this.throw_state_error();
        }
    },

    pause : function () {
        this.throw_if_removed();
        switch (this.state) {
        case DOWNLOAD_DOWNLOADING:
        case DOWNLOAD_QUEUED:
            try {
                download_manager_service.pauseDownload(this.id);
            } catch (e) {
                throw interactive_error("Download cannot be paused.");
            }
            break;
        default:
            this.throw_state_error();
        }
    },

    remove : function () {
        this.throw_if_removed();
        switch (this.state) {
        case DOWNLOAD_FAILED:
        case DOWNLOAD_CANCELED:
        case DOWNLOAD_FINISHED:
            try {
                download_manager_service.removeDownload(this.id);
            } catch (e) {
                throw interactive_error("Download cannot be removed.");
            }
            break;
        default:
            throw interactive_error("Download is still in progress.");
        }
    },

    delete_target : function () {
        if (this.state != DOWNLOAD_FINISHED)
            throw interactive_error("Download has not finished.");
        try {
            this.target_file.remove(false);
        } catch (e) {
            if (result in e) {
                switch (e) {
                case Cr.NS_ERROR_FILE_TARGET_DOES_NOT_EXIST:
                    throw interactive_error("File has already been deleted.");
                case Cr.NS_ERROR_FILE_ACCESS_DENIED:
                    throw interactive_error("Access denied");
                case Cr.NS_ERROR_FILE_DIR_NOT_EMPTY:
                    throw interactive_error("Failed to delete file.");
                }
            }
            throw e;
        }
    }
};

var define_download_local_hook = simple_local_hook_definer();

// FIXME: add more parameters
function register_download(buffer, source_uri) {
    var info = new download_info(buffer);
    info.registered_time_stamp = Date.now();
    info.registered_source_uri = source_uri;
    unmanaged_download_info_list.push(info);
    return info;
}

function match_registered_download(mozilla_info) {
    let list = unmanaged_download_info_list;
    let t = Date.now();
    for (let i = 0; i < list.length; ++i) {
        let x = list[i];
        if (x.registered_source_uri == mozilla_info.source) {
            list.splice(i, 1);
            return x;
        }
        if (t - x.registered_time_stamp > download_info_max_queue_delay) {
            list.splice(i, 1);
            --i;
            continue;
        }
    }
    return null;
}

define_download_local_hook("download_added_hook");
define_download_local_hook("download_removed_hook");
define_download_local_hook("download_finished_hook");
define_download_local_hook("download_progress_change_hook");
define_download_local_hook("download_state_change_hook");
define_download_local_hook("download_shell_command_change_hook");

var download_info_max_queue_delay = 100;

var download_progress_listener = {
    QueryInterface: generate_QI(Ci.nsIDownloadProgressListener),

    onDownloadStateChange : function (state, download) {
        var info = null;
        /* FIXME: Determine if only new downloads will have this state
         * as their previous state. */

        dumpln("download state change: " + download.source.spec + ": " + state + ", " + download.state + ", " + download.id);

        if (state == DOWNLOAD_NOTSTARTED) {
            info = match_registered_download(download);
            if (info == null) {
                info = new download_info(null, download);
                dumpln("error: encountered unknown new download");
            } else {
                info.attach(download);
            }
        } else {
            info = id_to_download_info[download.id];
            if (info == null) {
                dumpln("Error: encountered unknown download");

            } else {
                info.mozilla_info = download;
                download_state_change_hook.run(info);
                if (info.state == DOWNLOAD_FINISHED) {
                    download_finished_hook.run(info);

                    if (info.shell_command != null) {
                        info.running_shell_command = true;
                        co_call(function () {
                            try {
                                yield shell_command_with_argument(info.shell_command,
                                                                  info.target_file.path,
                                                                  $cwd = info.shell_command_cwd);
                            } finally  {
                                if (info.temporary_status == DOWNLOAD_TEMPORARY_FOR_COMMAND)
                                    info.target_file.remove(false /* not recursive */);
                                info.running_shell_command = false;
                                download_shell_command_change_hook.run(info);
                            }
                        }());
                        download_shell_command_change_hook.run(info);
                    }
                }
            }
        }
    },

    onProgressChange : function (progress, request, cur_self_progress, max_self_progress,
                                 cur_total_progress, max_total_progress,
                                 download) {
        var info = id_to_download_info[download.id];
        if (info == null) {
            dumpln("error: encountered unknown download in progress change");
            return;
        }
        info.mozilla_info = download;
        download_progress_change_hook.run(info);
        //dumpln("download progress change: " + download.source.spec + ": " + cur_self_progress + "/" + max_self_progress + " "
        // + cur_total_progress + "/" + max_total_progress + ", " + download.state + ", " + download.id);
    },

    onSecurityChange : function (progress, request, state, download) {
    },

    onStateChange : function (progress, request, state_flags, status, download) {
    }
};

var download_observer = {
    observe : function(subject, topic, data) {
        switch(topic) {
        case "download-manager-remove-download":
            var ids = [];
            if (!subject) {
                // Remove all downloads
                for (let i in id_to_download_info)
                    ids.push(i);
            } else {
                let id = subject.QueryInterface(Ci.nsISupportsPRUint32);
                /* FIXME: determine if this should really be an error */
                if (!(id in id_to_download_info)) {
                    dumpln("Error: download-manager-remove-download event received for unknown download: " + id);
                } else
                    ids.push(id);
            }
            for each (let i in ids) {
                dumpln("deleting download: " + i);
                let d = id_to_download_info[i];
                d.removed = true;
                download_removed_hook.run(d);
                delete id_to_download_info[i];
            }
            break;
        }
    }
};
observer_service.addObserver(download_observer, "download-manager-remove-download", false);

download_manager_service.addListener(download_progress_listener);

function pretty_print_file_size(val) {
    const GIBI = 1073741824; /* 2^30 */
    const MEBI = 1048576; /* 2^20 */
    const KIBI = 1024; /* 2^10 */
    var suffix, div;
    if (val < KIBI) {
        div = 1;
        suffix = "B";
    }
    else if (val < MEBI) {
        suffix = "KiB";
        div = KIBI;
    } else if (val < GIBI) {
        suffix = "MiB";
        div = MEBI;
    } else {
        suffix = "GiB";
        div = GIBI;
    }
    val = val / div;
    var precision = 2;
    if (val > 10)
        precision = 1;
    if (val > 100)
        precision = 0;
    return [val.toFixed(precision), suffix];
}

function pretty_print_time(val) {
    val = Math.round(val);
    var seconds = val % 60;

    val = Math.floor(val / 60);

    var minutes = val % 60;

    var hours = Math.floor(val / 60);

    var parts = [];

    if (hours > 1)
        parts.push(hours + " hours");
    else if (hours == 1)
        parts.push("1 hour");

    if (minutes > 1)
        parts.push(minutes + " minutes");
    else if (minutes == 1)
        parts.push("1 minute");

    if (minutes <= 1 && hours == 0) {
        if (seconds != 1)
            parts.push(seconds + " seconds");
        else
            parts.push("1 second");
    }

    return parts.join(", ");
}

define_variable(
    "download_buffer_min_update_interval", 2000,
    "Minimum interval (in milliseconds) between updates in download progress buffers.\n" +
        "Lowering this interval will increase the promptness of the progress display at " +
        "the cost of using additional processor time.");

define_keywords("$info");
function download_buffer(window, element) {
    this.constructor_begin();
    keywords(arguments);
    special_buffer.call(this, window, element, forward_keywords(arguments));
    this.info = arguments.$info;
    this.configuration.cwd = this.info.mozilla_info.targetFile.parent.path;
    this.description = this.info.mozilla_info.source.spec;
    this.keymap = download_buffer_keymap;
    this.update_title();

    this.progress_change_handler_fn = method_caller(this, this.handle_progress_change);
    add_hook.call(this.info, "download_progress_change_hook", this.progress_change_handler_fn);
    add_hook.call(this.info, "download_state_change_hook", this.progress_change_handler_fn);
    this.command_change_handler_fn = method_caller(this, this.update_command_field);
    add_hook.call(this.info, "download_shell_command_change_hook", this.command_change_handler_fn);
    this.constructor_end();
}
download_buffer.prototype = {
    __proto__: special_buffer.prototype,

    handle_kill : function () {
        this.__proto__.handle_kill();
        remove_hook.call(this.info, "download_progress_change_hook", this.progress_change_handler_fn);
        remove_hook.call(this.info, "download_state_change_hook", this.progress_change_handler_fn);
        remove_hook.call(this.info, "download_shell_command_change_hook", this.command_change_handler_fn);

        // Remove all node references
        delete this.status_textnode;
        delete this.transferred_div_node;
        delete this.transferred_textnode;
        delete this.progress_container_node;
        delete this.progress_bar_node;
        delete this.time_textnode;
        delete this.command_div_node;
        delete this.command_label_textnode;
        delete this.command_textnode;
    },

    update_title : function () {
        // FIXME: do this properly
        var new_title;
        var info = this.info;
        var append_transfer_info = false;
        var append_speed_info = true;
        var label = null;
        switch(info.state) {
        case DOWNLOAD_DOWNLOADING:
            label = "Downloading";
            append_transfer_info = true;
            break;
        case DOWNLOAD_FINISHED:
            label = "Download complete";
            break;
        case DOWNLOAD_FAILED:
            label = "Download failed";
            append_transfer_info = true;
            append_speed_info = false;
            break;
        case DOWNLOAD_CANCELED:
            label = "Download canceled";
            append_transfer_info = true;
            append_speed_info = false;
            break;
        case DOWNLOAD_PAUSED:
            label = "Download paused";
            append_transfer_info = true;
            append_speed_info = false;
            break;
        case DOWNLOAD_QUEUED:
        default:
            label = "Download queued";
            break;
        }

        if (append_transfer_info) {
            if (append_speed_info)
                new_title = label + " at " + pretty_print_file_size(info.speed).join(" ") + "/s: ";
            else
                new_title = label + ": ";
            var trans = pretty_print_file_size(info.amount_transferred);
            if (info.size >= 0) {
                var total = pretty_print_file_size(info.size);
                if (trans[1] == total[1])
                    new_title += trans[0] + "/" + total[0] + " " + total[1];
                else
                    new_title += trans.join(" ") + "/" + total.join(" ");
            } else
                new_title += trans.join(" ");
            if (info.percent_complete >= 0)
                new_title += " (" + info.percent_complete + "%)";
        } else
            new_title = label;
        if (new_title != this.title) {
            this.title = new_title;
            return true;
        }
        return false;
    },

    handle_progress_change : function () {
        var cur_time = Date.now();
        if (this.last_update == null ||
            (cur_time - this.last_update) > download_buffer_min_update_interval ||
            this.info.state != this.previous_state) {

            if (this.update_title())
                buffer_title_change_hook.run(this);

            if (this.generated) {
                this.update_fields();
            }
            this.previous_status = this.info.status;
            this.last_update = cur_time;
        }
    },

    generate: function() {
        var d = this.document;
        var g = new dom_generator(d, XHTML_NS);

        /* Warning: If any additional node references are saved in
         * this function, appropriate code to delete the saved
         * properties must be added to handle_kill. */

        var info = this.info;

        d.body.setAttribute("class", "download-buffer");

        g.add_stylesheet("chrome://conkeror/content/downloads.css");

        var div;
        var label, value;

        div = g.element("div", d.body, "class", "download-info", "id", "download-source");
        label = g.element("div", div, "class", "download-label");
        this.status_textnode = g.text("", label);
        value = g.element("div", div, "class", "download-value");
        g.text(info.source.spec, value);

        div = g.element("div", d.body, "class", "download-info", "id", "download-target");
        label = g.element("div", div, "class", "download-label");
        var target_label;
        if (info.temporary_status != DOWNLOAD_NOT_TEMPORARY)
            target_label = "Temp. file:";
        else
            target_label = "Target:";
        g.text(target_label, label);
        value = g.element("div", div, "class", "download-value");
        g.text(info.target_file.path, value);

        div = g.element("div", d.body, "class", "download-info", "id", "download-mime-type");
        label = g.element("div", div, "class", "download-label");
        g.text("MIME type:", label);
        value = g.element("div", div, "class", "download-value");
        g.text(info.MIME_type || "unknown", value);

        this.transferred_div_node = div = g.element("div", d.body,
                                                    "class", "download-info",
                                                    "id", "download-transferred");
        label = g.element("div", div, "class", "download-label");
        g.text("Transferred:", label);
        value = g.element("div", div, "class", "download-value");
        this.transferred_textnode = g.text("", value);
        this.progress_container_node = value = g.element("div", div, "id", "download-progress-container");
        this.progress_bar_node = g.element("div", value, "id", "download-progress-bar");
        value = g.element("div", div, "class", "download-value", "id", "download-percent");
        this.percent_textnode = g.text("", value);

        div = g.element("div", d.body, "class", "download-info", "id", "download-time");
        label = g.element("div", div, "class", "download-label");
        g.text("Time:", label);
        value = g.element("div", div, "class", "download-value");
        this.time_textnode = g.text("", value);

        if (info.action_description != null) {
            div = g.element("div", d.body, "class", "download-info", "id", "download-action");
            label = g.element("div", div, "class", "download-label");
            g.text("Action:", label);
            value = g.element("div", div, "class", "download-value");
            g.text(info.action_description, value);
        }

        this.command_div_node = div = g.element("div", d.body, "class", "download-info", "id", "download-command");
        label = g.element("div", div, "class", "download-label");
        this.command_label_textnode = g.text("Run command:", label);
        value = g.element("div", div, "class", "download-value");
        this.command_textnode = g.text("", value);

        this.update_fields();

        this.update_command_field();
    },

    update_fields : function () {
        if (!this.generated)
            return;
        var info = this.info;
        var label = null;
        switch(info.state) {
        case DOWNLOAD_DOWNLOADING:
            label = "Downloading";
            break;
        case DOWNLOAD_FINISHED:
            label = "Completed";
            break;
        case DOWNLOAD_FAILED:
            label = "Failed";
            break;
        case DOWNLOAD_CANCELED:
            label = "Canceled";
            break;
        case DOWNLOAD_PAUSED:
            label = "Paused";
            break;
        case DOWNLOAD_QUEUED:
        default:
            label = "Queued";
            break;
        }
        this.status_textnode.nodeValue = label + ":";
        this.update_time_field();

        var tran_text = "";
        if (info.state == DOWNLOAD_FINISHED)
            tran_text = pretty_print_file_size(info.size).join(" ");
        else {
            var trans = pretty_print_file_size(info.amount_transferred);
            if (info.size >= 0) {
                var total = pretty_print_file_size(info.size);
                if (trans[1] == total[1])
                    tran_text += trans[0] + "/" + total[0] + " " + total[1];
                else
                    tran_text += trans.join(" ") + "/" + total.join(" ");
            } else
                tran_text += trans.join(" ");
        }
        this.transferred_textnode.nodeValue = tran_text;
        if (info.percent_complete >= 0) {
            this.progress_container_node.style.display = "";
            this.percent_textnode.nodeValue = info.percent_complete + "%";
            this.progress_bar_node.style.width = info.percent_complete + "%";
        } else {
            this.percent_textnode.nodeValue = "";
            this.progress_container_node.style.display = "none";
        }

        this.update_command_field();
    },

    update_time_field : function () {
        var info = this.info;
        var elapsed_text = pretty_print_time((Date.now() - info.start_time / 1000) / 1000) + " elapsed";
        var text = "";
        if (info.state == DOWNLOAD_DOWNLOADING) {
            text = pretty_print_file_size(info.speed).join(" ") + "/s, ";
        }
        if (info.state == DOWNLOAD_DOWNLOADING &&
            info.size >= 0 &&
            info.speed > 0) {
            let remaining = (info.size - info.amount_transferred) / info.speed;
            text += pretty_print_time(remaining) + " left (" + elapsed_text + ")";
        } else {
            text = elapsed_text;
        }
        this.time_textnode.nodeValue = text;
    },

    update_command_field : function () {
        if (!this.generated)
            return;
        if (this.info.shell_command != null) {
            this.command_div_node.style.display = "";
            var label;
            if (this.info.running_shell_command)
                label = "Running:";
            else if (this.info.state == DOWNLOAD_FINISHED)
                label = "Ran command:";
            else
                label = "Run command:";
            this.command_label_textnode.nodeValue = label;
            this.command_textnode.nodeValue = this.info.shell_command;
        } else {
            this.command_div_node.style.display = "none";
        }
    }
};

function download_cancel(buffer) {
    check_buffer(buffer, download_buffer);
    var info = buffer.info;
    info.cancel();
    buffer.window.minibuffer.message("Download canceled");
}
interactive("download-cancel",
            "Cancel the current download.\n" +
            "The download can later be retried using the `download-retry' command, but any " +
            "data already transferred will be lost.",
            function (I) {download_cancel(I.buffer);});

function download_retry(buffer) {
    check_buffer(buffer, download_buffer);
    var info = buffer.info;
    info.retry();
    buffer.window.minibuffer.message("Download retried");
}
interactive("download-retry",
            "Retry a failed or canceled download.\n" +
            "This command can be used to retry a download that failed or was cancled using " +
            "the `download-cancel' command.  The download will begin from the start again.",
            function (I) {download_retry(I.buffer);});

function download_pause(buffer) {
    check_buffer(buffer, download_buffer);
    buffer.info.pause();
    buffer.window.minibuffer.message("Download paused");
}
interactive("download-pause",
            "Pause the current download.\n" +
            "The download can later be resumed using the `download-resume' command.  The " +
            "data already transferred will not be lost.",
            function (I) {download_pause(I.buffer);});

function download_resume(buffer) {
    check_buffer(buffer, download_buffer);
    buffer.info.resume();
    buffer.window.minibuffer.message("Download resumed");
}
interactive("download-resume",
            "Resume the current download.\n" +
            "This command can be used to resume a download paused using the `download-pause' command.",
            function (I) {download_resume(I.buffer);});

function download_remove(buffer) {
    check_buffer(buffer, download_buffer);
    buffer.info.remove();
    buffer.window.minibuffer.message("Download removed");
}
interactive("download-remove",
            "Remove the current download from the download manager.\n" +
            "This command can only be used on inactive (paused, canceled, completed, or failed) downloads.",
            function (I) {download_remove(I.buffer);});

function download_retry_or_resume(buffer) {
    check_buffer(buffer, download_buffer);
    var info = buffer.info;
    if (info.state == DOWNLOAD_PAUSED)
        download_resume(buffer);
    else
        download_retry(buffer);
}
interactive("download-retry-or-resume",
            "Retry or resume the current download.\n" +
            "This command can be used to resume a download paused using the `download-pause' " +
            "command or canceled using the `download-cancel' command.",
            function (I) {download_retry_or_resume(I.buffer);});

function download_pause_or_resume(buffer) {
    check_buffer(buffer, download_buffer);
    var info = buffer.info;
    if (info.state == DOWNLOAD_PAUSED)
        download_resume(buffer);
    else
        download_pause(buffer);
}
interactive("download-pause-or-resume",
            "Pause or resume the current download.\n" +
            "This command toggles the paused state of the current download.",
            function (I) {download_pause_or_resume(I.buffer);});

function download_delete_target(buffer) {
    check_buffer(buffer, download_buffer);
    var info = buffer.info;
    info.delete_target();
    buffer.window.minibuffer.message("Deleted file: " + info.target_file.path);
}
interactive("download-delete-target",
            "Delete the target file of the current download.\n"  +
            "This command can only be used if the download has finished successfully.",
            function (I) {download_delete_target(I.buffer);});

function download_shell_command(buffer, cwd, cmd) {
    check_buffer(buffer, download_buffer);
    var info = buffer.info;
    if (info.state == DOWNLOAD_FINISHED) {
        shell_command_with_argument_blind(cmd, info.target_file.path, $cwd = cwd);
        return;
    }
    if (info.state != DOWNLOAD_DOWNLOADING && info.state != DOWNLOAD_PAUSED && info.state != DOWNLOAD_QUEUED)
        info.throw_state_error();
    if (cmd == null || cmd.length == 0)
        info.set_shell_command(null, cwd);
    else
        info.set_shell_command(cmd, cwd);
    buffer.window.minibuffer.message("Queued shell command: " + cmd);
}
interactive("download-shell-command",
            "Run a shell command on the target file of the current download.\n" +
            "If the download is still in progress, the shell command will be queued " +
            "to run when the download finishes.",
            function (I) {
                var buffer = check_buffer(I.buffer, download_buffer);
                var cwd = buffer.info.shell_command_cwd || buffer.cwd;
                var cmd = yield I.minibuffer.read_shell_command(
                    $cwd = cwd,
                    $initial_value = buffer.info.shell_command ||
                        get_external_handler_for_mime_type(buffer.info.MIME_type));
                download_shell_command(buffer, cwd, cmd);
            });

function download_manager_ui()
{}
download_manager_ui.prototype = {
    QueryInterface : XPCOMUtils.generateQI([Ci.nsIDownloadManagerUI]),

    getAttention : function () {},
    show : function () {},
    visible : false
};


function download_manager_show_builtin_ui(window) {
    download_manager_builtin_ui.show(window);
}
interactive("download-manager-show-builtin-ui",
            "Show the built-in (Firefox-style) download manager user interface.",
            function (I) {download_manager_show_builtin_ui(I.window);});



define_variable("download_temporary_file_open_buffer_delay", 500,
                     "Delay (in milliseconds) before a download buffer is opened for temporary downloads.\n" +
                     "This variable takes effect only if `open_download_buffer_automatically' is in " +
                     "`download_added_hook', as it is by default.");


define_variable("download_buffer_automatic_open_target", OPEN_NEW_WINDOW,
                     "Target for download buffers created by the `open_download_buffer_automatically' function.\n" +
                     "This variable takes effect only if `open_download_buffer_auotmatically' is in " +
                     "`download_added_hook', as it is by default.");

function open_download_buffer_automatically(info) {
    var buf = info.source_buffer;
    var target = download_buffer_automatic_open_target;
    if (buf == null)
        target = OPEN_NEW_WINDOW;
    if (info.temporary_status == DOWNLOAD_NOT_TEMPORARY ||
        !(download_temporary_file_open_buffer_delay > 0))
        create_buffer(buf, buffer_creator(download_buffer, $info = info), target);
    else {
        var timer = null;
        function finish() {
            timer.cancel();
        }
        add_hook.call(info, "download_finished_hook", finish);
        timer = call_after_timeout(function () {
                remove_hook.call(info, "download_finished_hook", finish);
                create_buffer(buf, buffer_creator(download_buffer, $info = info), target);
            }, download_temporary_file_open_buffer_delay);
    }
}
add_hook("download_added_hook", open_download_buffer_automatically);
