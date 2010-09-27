/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 * (C) Copyright 2009-2010 John Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

require("mime-type-override.js");

define_mime_type_table("content_handlers", {},
    "A mime type table mapping mime types to content handlers. This table "+
    "will be checked for a match when a navigation event causes Conkeror "+
    "to encounter a mime type which is not supported by Mozilla.  If no "+
    "appropriate content handler is found in this table, the user will "+
    "be prompted to choose from among common actions.");

/**
 * content_handler_context is a datatype for storing contextual information
 * that can be used by content handlers, such as window, buffer, frame, and
 * the download launcher object.  It will also contain an abort method to
 * abort the download.  Download helper actions are passed an object of this
 * type.
 */
function content_handler_context (launcher, context) {
    this.launcher = launcher;
    try {
        this.frame = context.QueryInterface(Ci.nsIInterfaceRequestor)
            .getInterface(Ci.nsIDOMWindowInternal);
        this.window = get_window_from_frame(this.frame);
        this.buffer = get_buffer_from_frame(this.frame);
    } catch (e) {
        this.window = get_recent_conkeror_window();
        if (this.window) {
            this.buffer = this.window.buffers.current;
            this.frame = this.buffer.focused_frame; //doesn't necessarily exist for all buffer types
        }
    }
}
content_handler_context.prototype = {
    constructor: content_handler_context,
    launcher: null,
    window: null,
    buffer: null,
    frame: null,
    abort: function () {
        const NS_BINDING_ABORTED = 0x804b0002;
        this.launcher.cancel(NS_BINDING_ABORTED);
    }
};


/**
 * The content_handler_* functions below are all things that conkeror
 * is able to do when Mozilla has invoked download_helper because of an
 * attempt to navigate to a document of an unsupported mime type.
 */
function content_handler_save (ctx) {
    var suggested_path = suggest_save_path_from_file_name(
        ctx.launcher.suggestedFileName, ctx.buffer);
    var file = yield ctx.window.minibuffer.read_file_check_overwrite(
        $prompt = "Save to file:",
        $initial_value = suggested_path,
        $select);
    register_download(ctx.buffer, ctx.launcher.source);
    ctx.launcher.saveToDisk(file, false);
}

function content_handler_save_in (path, inhibit_prompt) {
    path = make_file(path);
    return function (ctx) {
        var file;
        var suggested_path = path.clone();
        suggested_path.append(ctx.launcher.suggestedFileName);
        if (inhibit_prompt)
            file = suggested_path;
        else {
            file = yield ctx.window.minibuffer.read_file_check_overwrite(
                $prompt = "Save to file:",
                $initial_value = suggested_path.path,
                $select);
        }
        register_download(ctx.buffer, ctx.launcher.source);
        ctx.launcher.saveToDisk(file, false);
    };
}

function content_handler_open (ctx) {
    var cwd = with_current_buffer(ctx.buffer, function (I) I.local.cwd);
    var mime_type = ctx.launcher.MIMEInfo.MIMEType;
    var suggested_action = external_content_handlers.get(mime_type);
    var command = yield ctx.window.minibuffer.read_shell_command(
        $initial_value = suggested_action,
        $cwd = cwd);
    var file = get_temporary_file(ctx.launcher.suggestedFileName);
    var info = register_download(ctx.buffer, ctx.launcher.source);
    info.temporary_status = DOWNLOAD_TEMPORARY_FOR_COMMAND;
    info.set_shell_command(command, cwd);
    ctx.launcher.saveToDisk(file, false);
}

function content_handler_open_default_viewer (ctx) {
    var cwd = with_current_buffer(ctx.buffer, function (I) I.local.cwd);
    var mime_type = ctx.launcher.MIMEInfo.MIMEType;
    var command = external_content_handlers.get(mime_type);
    if (command == null)
        command = yield ctx.window.minibuffer.read_shell_command(
            $initial_value = command,
            $cwd = cwd);
    var file = get_temporary_file(ctx.launcher.suggestedFileName);
    var info = register_download(ctx.buffer, ctx.launcher.source);
    info.temporary_status = DOWNLOAD_TEMPORARY_FOR_COMMAND;
    info.set_shell_command(command, cwd);
    ctx.launcher.saveToDisk(file, false);
}

function content_handler_open_url (ctx) {
    ctx.abort(); // abort download
    let mime_type = ctx.launcher.MIMEInfo.MIMEType;
    let cwd = with_current_buffer(ctx.buffer, function (I) I.local.cwd);
    let cmd = yield ctx.window.minibuffer.read_shell_command(
        $cwd = cwd,
        $initial_value = external_content_handlers.get(mime_type));
    shell_command_with_argument_blind(cmd, ctx.launcher.source.spec, $cwd = cwd);
}

function content_handler_copy_url (ctx) {
    ctx.abort(); // abort download
    let uri = ctx.launcher.source.spec;
    writeToClipboard(uri);
    ctx.window.minibuffer.message("Copied: " + uri);
}

function content_handler_view_internally (ctx) {
    var suggested_type = ctx.launcher.MIMEInfo.MIMEType;
    if (viewable_mime_type_list.indexOf(suggested_type) == -1)
        suggested_type = "text/plain";
    var mime_type = yield ctx.window.minibuffer.read_viewable_mime_type(
        $prompt = "View internally as",
        $initial_value = suggested_type,
        $select);
    ctx.abort(); // abort before reloading
    override_mime_type_for_next_load(ctx.launcher.source, mime_type);
    ctx.frame.location = ctx.launcher.source.spec; // reload
}

function content_handler_view_as_text (ctx) {
    ctx.abort(); // abort before reloading
    override_mime_type_for_next_load(ctx.launcher.source, "text/plain");
    ctx.frame.location = ctx.launcher.source.spec; // reload
}

function content_handler_prompt (ctx) {
    var action_chosen = false;
    var can_view_internally = ctx.frame != null &&
        can_override_mime_type_for_uri(ctx.launcher.source);
    var panel;
    try {
        panel = create_info_panel(ctx.window, "download-panel",
                                  [["downloading", "Downloading:", ctx.launcher.source.spec],
                                   ["mime-type", "Mime type:", ctx.launcher.MIMEInfo.MIMEType]]);
        var action = yield ctx.window.minibuffer.read_single_character_option(
            $prompt = "Action to perform: (s: save; o: open; O: open URL; c: copy URL; " +
                (can_view_internally ? "i: view internally; t: view as text)" : ")"),
            $options = (can_view_internally ? ["s", "o", "O", "c", "i", "t"] : ["s", "o", "O", "c"]));
        switch (action) {
        case "s":
            yield content_handler_save(ctx);
            action_chosen = true;
            break;
        case "o":
            yield content_handler_open(ctx);
            action_chosen = true;
            break;
        case "O":
            yield content_handler_open_url(ctx);
            action_chosen = true;
            break;
        case "c":
            yield content_handler_copy_url(ctx);
            action_chosen = true;
            break;
        case "i":
            yield content_handler_view_internally(ctx);
            action_chosen = true;
            break;
        case "t":
            yield content_handler_view_as_text(ctx);
            action_chosen = true;
            break;
        }
    } catch (e) {
        handle_interactive_error(ctx.window, e);
    } finally {
        if (! action_chosen)
            ctx.abort();
        if (panel)
            panel.destroy();
    }
}


/**
 * download_helper implements nsIHelperAppLauncherDialog.
 *
 * Sometimes, like when following a link, the content type of the document
 * cannot be displayed by Mozilla.  When this happens, Mozilla calls the
 * `show' method of our download_helper with a handle for the started
 * download and other contextual information.
 */
function download_helper () {}
download_helper.prototype = {
    constructor: download_helper,
    QueryInterface: generate_QI(Ci.nsIHelperAppLauncherDialog,
                                Ci.nsIWebProgressListener2),
    show: function (launcher, context, reason) {
        var ctx = new content_handler_context(launcher, context);
        if (! ctx.window) {
            ctx.abort(); //XXX: impolite; need better solution.
            return;
        }
        try {
            // is there anything in content_handlers for this object?
            var mime_type = launcher.MIMEInfo.MIMEType;
            var action = content_handlers.get(mime_type) ||
                content_handler_prompt;
            co_call(action(ctx));
        } catch (e) {
            handle_interactive_error(ctx.window, e);
        }
    },
    promptForSaveToFile: function (launcher, context, default_file, suggested_file_extension) {
        return null;
    }
};

provide("content-handler");
