/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 * (C) Copyright 2009 John Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

require("special-buffer.js");
require("mime-type-override.js");
require("minibuffer-read-mime-type.js");

var download_manager_service = Cc["@mozilla.org/download-manager;1"]
    .getService(Ci.nsIDownloadManager);

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

function download_info (source_buffer, mozilla_info, target_file) {
    this.source_buffer = source_buffer;
    this.target_file = target_file;
    if (mozilla_info != null)
        this.attach(mozilla_info);
}
download_info.prototype = {
    constructor: download_info,
    attach: function (mozilla_info) {
        if (!this.target_file)
            this.__defineGetter__("target_file", function () {
                    return this.mozilla_info.targetFile;
                });
        else if (this.target_file.path != mozilla_info.targetFile.path)
            throw interactive_error("Download target file unexpected.");
        this.mozilla_info = mozilla_info;
        id_to_download_info[mozilla_info.id] = this;
        download_added_hook.run(this);
    },

    target_file: null,

    shell_command: null,

    shell_command_cwd: null,

    temporary_status: DOWNLOAD_NOT_TEMPORARY,

    action_description: null,

    set_shell_command: function (str, cwd) {
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
    get display_name () { return this.mozilla_info.displayName; },
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

    target_file_text: function () {
        let target = this.target_file.path;
        let display = this.display_name;
        if (target.indexOf(display, target.length - display.length) == -1)
            target += " (" + display + ")";
        return target;
    },

    throw_if_removed: function () {
        if (this.removed)
            throw interactive_error("Download has already been removed from the download manager.");
    },

    throw_state_error: function () {
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
    cancel: function ()  {
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

    retry: function () {
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

    resume: function () {
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

    pause: function () {
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

    remove: function () {
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

    delete_target: function () {
        if (this.state != DOWNLOAD_FINISHED)
            throw interactive_error("Download has not finished.");
        try {
            this.target_file.remove(false);
        } catch (e) {
            if ("result" in e) {
                switch (e.result) {
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
function register_download (buffer, source_uri, target_file) {
    var info = new download_info(buffer, null, target_file);
    info.registered_time_stamp = Date.now();
    info.registered_source_uri = source_uri;
    unmanaged_download_info_list.push(info);
    return info;
}

function match_registered_download (mozilla_info) {
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

define_variable('delete_temporary_files_for_command', true,
    'If this is set to true, temporary files downloaded to run a command '+
    'on them will be deleted once the command completes. If not, the file '+
    'will stay around forever unless deleted outside the browser.');

var download_info_max_queue_delay = 100;

var download_progress_listener = {
    QueryInterface: generate_QI(Ci.nsIDownloadProgressListener),

    onDownloadStateChange: function (state, download) {
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
                            } catch (e) {
                                handle_interactive_error(info.source_buffer.window, e);
                            } finally  {
                                if (info.temporary_status == DOWNLOAD_TEMPORARY_FOR_COMMAND)
                                    if(delete_temporary_files_for_command) {
                                        info.target_file.remove(false /* not recursive */);
                                    }
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

    onProgressChange: function (progress, request, cur_self_progress, max_self_progress,
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

    onSecurityChange: function (progress, request, state, download) {
    },

    onStateChange: function (progress, request, state_flags, status, download) {
    }
};

var download_observer = {
    observe: function (subject, topic, data) {
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

define_variable("download_buffer_min_update_interval", 2000,
    "Minimum interval (in milliseconds) between updates in download progress buffers.\n" +
    "Lowering this interval will increase the promptness of the progress display at " +
    "the cost of using additional processor time.");

function download_buffer_modality (buffer, element) {
    buffer.keymaps.push(download_buffer_keymap);
}

define_keywords("$info");
function download_buffer (window) {
    this.constructor_begin();
    keywords(arguments);
    special_buffer.call(this, window, forward_keywords(arguments));
    this.info = arguments.$info;
    this.local.cwd = this.info.mozilla_info.targetFile.parent;
    this.description = this.info.mozilla_info.source.spec;
    this.update_title();

    this.progress_change_handler_fn = method_caller(this, this.handle_progress_change);
    add_hook.call(this.info, "download_progress_change_hook", this.progress_change_handler_fn);
    add_hook.call(this.info, "download_state_change_hook", this.progress_change_handler_fn);
    this.command_change_handler_fn = method_caller(this, this.update_command_field);
    add_hook.call(this.info, "download_shell_command_change_hook", this.command_change_handler_fn);
    this.modalities.push(download_buffer_modality);
    this.constructor_end();
}
download_buffer.prototype = {
    constructor: download_buffer,
    __proto__: special_buffer.prototype,

    destroy: function () {
        remove_hook.call(this.info, "download_progress_change_hook", this.progress_change_handler_fn);
        remove_hook.call(this.info, "download_state_change_hook", this.progress_change_handler_fn);
        remove_hook.call(this.info, "download_shell_command_change_hook", this.command_change_handler_fn);

        // Remove all node references
        delete this.status_textnode;
        delete this.target_file_node;
        delete this.transferred_div_node;
        delete this.transferred_textnode;
        delete this.progress_container_node;
        delete this.progress_bar_node;
        delete this.percent_textnode;
        delete this.time_textnode;
        delete this.command_div_node;
        delete this.command_label_textnode;
        delete this.command_textnode;

        special_buffer.prototype.destroy.call(this);
    },

    update_title: function () {
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

    handle_progress_change: function () {
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

    generate: function () {
        var d = this.document;
        var g = new dom_generator(d, XHTML_NS);

        /* Warning: If any additional node references are saved in
         * this function, appropriate code to delete the saved
         * properties must be added to destroy method. */

        var info = this.info;

        d.body.setAttribute("class", "download-buffer");

        g.add_stylesheet("chrome://conkeror-gui/content/downloads.css");

        var row, cell;
        var table = g.element("table", d.body);

        row = g.element("tr", table, "class", "download-info", "id", "download-source");
        cell = g.element("td", row, "class", "download-label");
        this.status_textnode = g.text("", cell);
        cell = g.element("td", row, "class", "download-value");
        g.text(info.source.spec, cell);

        row = g.element("tr", table, "class", "download-info", "id", "download-target");
        cell = g.element("td", row, "class", "download-label");
        var target_label;
        if (info.temporary_status != DOWNLOAD_NOT_TEMPORARY)
            target_label = "Temp. file:";
        else
            target_label = "Target:";
        g.text(target_label, cell);
        cell = g.element("td", row, "class", "download-value");
        this.target_file_node = g.text("", cell);

        row = g.element("tr", table, "class", "download-info", "id", "download-mime-type");
        cell = g.element("td", row, "class", "download-label");
        g.text("MIME type:", cell);
        cell = g.element("td", row, "class", "download-value");
        g.text(info.MIME_type || "unknown", cell);

        this.transferred_div_node = row =
            g.element("tr", table, "class", "download-info", "id", "download-transferred");
        cell = g.element("td", row, "class", "download-label");
        g.text("Transferred:", cell);
        cell = g.element("td", row, "class", "download-value");
        var sub_item = g.element("div", cell);
        this.transferred_textnode = g.text("", sub_item);
        sub_item = g.element("div", cell, "id", "download-percent");
        this.percent_textnode = g.text("", sub_item);
        this.progress_container_node = sub_item = g.element("div", cell, "id", "download-progress-container");
        this.progress_bar_node = g.element("div", sub_item, "id", "download-progress-bar");

        row = g.element("tr", table, "class", "download-info", "id", "download-time");
        cell = g.element("td", row, "class", "download-label");
        g.text("Time:", cell);
        cell = g.element("td", row, "class", "download-value");
        this.time_textnode = g.text("", cell);

        if (info.action_description != null) {
            row = g.element("tr", table, "class", "download-info", "id", "download-action");
            cell = g.element("div", row, "class", "download-label");
            g.text("Action:", cell);
            cell = g.element("div", row, "class", "download-value");
            g.text(info.action_description, cell);
        }

        this.command_div_node = row = g.element("tr", table, "class", "download-info", "id", "download-command");
        cell = g.element("td", row, "class", "download-label");
        this.command_label_textnode = g.text("Run command:", cell);
        cell = g.element("td", row, "class", "download-value");
        this.command_textnode = g.text("", cell);

        this.update_fields();
        this.update_command_field();
    },

    update_fields: function () {
        if (!this.generated)
            return;
        var info = this.info;
        var label = null;
        switch (info.state) {
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
        this.target_file_node.nodeValue = info.target_file_text();
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

    update_time_field: function () {
        var info = this.info;
        var elapsed_text = pretty_print_time((Date.now() - info.start_time / 1000) / 1000) + " elapsed";
        var text = "";
        if (info.state == DOWNLOAD_DOWNLOADING)
            text = pretty_print_file_size(info.speed).join(" ") + "/s, ";
        if (info.state == DOWNLOAD_DOWNLOADING &&
            info.size >= 0 &&
            info.speed > 0)
        {
            let remaining = (info.size - info.amount_transferred) / info.speed;
            text += pretty_print_time(remaining) + " left (" + elapsed_text + ")";
        } else
            text = elapsed_text;
        this.time_textnode.nodeValue = text;
    },

    update_command_field: function () {
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
        } else
            this.command_div_node.style.display = "none";
    }
};

function download_cancel (buffer) {
    check_buffer(buffer, download_buffer);
    var info = buffer.info;
    info.cancel();
    buffer.window.minibuffer.message("Download canceled");
}
interactive("download-cancel",
    "Cancel the current download.\n" +
    "The download can later be retried using the `download-retry' "+
    "command, but any data already transferred will be lost.",
    function (I) {
        let result = yield I.window.minibuffer.read_single_character_option(
            $prompt = "Cancel this download? (y/n)",
            $options = ["y", "n"]);
        if (result == "y")
            download_cancel(I.buffer);
    });

function download_retry (buffer) {
    check_buffer(buffer, download_buffer);
    var info = buffer.info;
    info.retry();
    buffer.window.minibuffer.message("Download retried");
}
interactive("download-retry",
    "Retry a failed or canceled download.\n" +
    "This command can be used to retry a download that failed or "+
    "was canceled using the `download-cancel' command.  The download "+
    "will begin from the start again.",
    function (I) { download_retry(I.buffer); });

function download_pause (buffer) {
    check_buffer(buffer, download_buffer);
    buffer.info.pause();
    buffer.window.minibuffer.message("Download paused");
}
interactive("download-pause",
    "Pause the current download.\n" +
    "The download can later be resumed using the `download-resume' command. "+
    "The data already transferred will not be lost.",
    function (I) { download_pause(I.buffer); });

function download_resume (buffer) {
    check_buffer(buffer, download_buffer);
    buffer.info.resume();
    buffer.window.minibuffer.message("Download resumed");
}
interactive("download-resume",
    "Resume the current download.\n" +
    "This command can be used to resume a download paused using the "+
    "`download-pause' command.",
    function (I) { download_resume(I.buffer); });

function download_remove (buffer) {
    check_buffer(buffer, download_buffer);
    buffer.info.remove();
    buffer.window.minibuffer.message("Download removed");
}
interactive("download-remove",
    "Remove the current download from the download manager.\n" +
    "This command can only be used on inactive (paused, canceled, "+
    "completed, or failed) downloads.",
    function (I) { download_remove(I.buffer); });

function download_retry_or_resume (buffer) {
    check_buffer(buffer, download_buffer);
    var info = buffer.info;
    if (info.state == DOWNLOAD_PAUSED)
        download_resume(buffer);
    else
        download_retry(buffer);
}
interactive("download-retry-or-resume",
    "Retry or resume the current download.\n" +
    "This command can be used to resume a download paused using the " +
    "`download-pause' command or canceled using the `download-cancel' "+
    "command.",
    function (I) { download_retry_or_resume(I.buffer); });

function download_pause_or_resume (buffer) {
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
    function (I) { download_pause_or_resume(I.buffer); });

function download_delete_target (buffer) {
    check_buffer(buffer, download_buffer);
    var info = buffer.info;
    info.delete_target();
    buffer.window.minibuffer.message("Deleted file: " + info.target_file.path);
}
interactive("download-delete-target",
    "Delete the target file of the current download.\n" +
    "This command can only be used if the download has finished successfully.",
    function (I) { download_delete_target(I.buffer); });

function download_shell_command (buffer, cwd, cmd) {
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
    "Run a shell command on the target file of the current download.\n"+
    "If the download is still in progress, the shell command will be queued "+
    "to run when the download finishes.",
    function (I) {
        var buffer = check_buffer(I.buffer, download_buffer);
        var cwd = buffer.info.shell_command_cwd || I.local.cwd;
        var cmd = yield I.minibuffer.read_shell_command(
            $cwd = cwd,
            $initial_value = buffer.info.shell_command ||
                external_content_handlers.get(buffer.info.MIME_type));
        download_shell_command(buffer, cwd, cmd);
    });

function download_manager_ui () {}
download_manager_ui.prototype = {
    constructor: download_manager_ui,
    QueryInterface: XPCOMUtils.generateQI([Ci.nsIDownloadManagerUI]),

    getAttention: function () {},
    show: function () {},
    visible: false
};


interactive("download-manager-show-builtin-ui",
    "Show the built-in (Firefox-style) download manager window.",
    function (I) {
        Components.classesByID["{7dfdf0d1-aff6-4a34-bad1-d0fe74601642}"]
            .getService(Ci.nsIDownloadManagerUI)
            .show(I.window);
    });


/*
 * Download-show
 */ 

define_variable("download_temporary_file_open_buffer_delay", 500,
    "Delay (in milliseconds) before a download buffer is opened for "+
    "temporary downloads.  If the download completes before this amount "+
    "of time, no download buffer will be opened.  This variable takes "+
    "effect only if `open_download_buffer_automatically' is in "+
    "`download_added_hook', which is the case by default.");

define_variable("download_buffer_automatic_open_target", OPEN_NEW_WINDOW,
    "Target(s) for download buffers created by "+
    "`open_download_buffer_automatically'.");

minibuffer_auto_complete_preferences.download = true;
minibuffer.prototype.read_download = function () {
    keywords(arguments,
             $prompt = "Download",
             $completer = all_word_completer(
                 $completions = function (visitor) {
                     var dls = download_manager_service.activeDownloads;
                     while (dls.hasMoreElements()) {
                         let dl = dls.getNext();
                         visitor(id_to_download_info[dl.id]);
                     }
                 },
                 $get_string = function (x) x.display_name,
                 $get_description = function (x) x.source.spec,
                 $get_value = function (x) x),
             $auto_complete = "download",
             $auto_complete_initial = true,
             $match_required = true);
    var result = yield this.read(forward_keywords(arguments));
    yield co_return(result);
};

function download_show (window, target, info) {
    if (! window)
        target = OPEN_NEW_WINDOW;
    create_buffer(window, buffer_creator(download_buffer, $info = info), target);
}

function download_show_new_window (I) {
    var info = yield I.minibuffer.read_download($prompt = "Show download:");
    download_show(I.window, OPEN_NEW_WINDOW, info);
}

function download_show_new_buffer (I) {
    var info = yield I.minibuffer.read_download($prompt = "Show download:");
    download_show(I.window, OPEN_NEW_BUFFER, info);
}

function download_show_new_buffer_background (I) {
    var info = yield I.minibuffer.read_download($prompt = "Show download:");
    download_show(I.window, OPEN_NEW_BUFFER_BACKGROUND, info);
}

function open_download_buffer_automatically (info) {
    var buf = info.source_buffer;
    var target = download_buffer_automatic_open_target;
    if (info.temporary_status == DOWNLOAD_NOT_TEMPORARY ||
        download_temporary_file_open_buffer_delay == 0)
    {
        download_show(buf.window, target, info);
    } else {
        var timer = null;
        function finish () {
            timer.cancel();
        }
        add_hook.call(info, "download_finished_hook", finish);
        timer = call_after_timeout(function () {
                remove_hook.call(info, "download_finished_hook", finish);
                download_show(buf.window, target, info);
            }, download_temporary_file_open_buffer_delay);
    }
}
add_hook("download_added_hook", open_download_buffer_automatically);

interactive("download-show",
    "Prompt for an ongoing download and open a download buffer showing "+
    "its progress.",
    alternates(download_show_new_buffer,
               download_show_new_window));

provide("download-manager");
