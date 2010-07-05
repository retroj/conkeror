/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2010 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

define_coroutine_hook("before_quit_hook", RUN_HOOK_UNTIL_FAILURE);
define_hook("quit_hook");

function quit () {
    var res = yield before_quit_hook.run();
    if (res) {
        quit_hook.run();
        var appStartup = Cc["@mozilla.org/toolkit/app-startup;1"]
            .getService(Ci.nsIAppStartup);
        appStartup.quit(appStartup.eAttemptQuit);
    }
}
interactive("quit",
    "Quit Conkeror",
    quit);


function show_conkeror_version (window) {
    var xulrunner_version = Cc['@mozilla.org/xre/app-info;1']
        .getService(Ci.nsIXULAppInfo)
        .platformVersion;
    window.minibuffer.message("Conkeror "+conkeror.version+
                              " (XULRunner "+xulrunner_version+
                              ", "+get_os()+")");
}
interactive("conkeror-version",
    "Show version information for Conkeror.",
    function (I) { show_conkeror_version(I.window); });
interactive("version",
    "Show version information for Conkeror.",
    "conkeror-version");

/* FIXME: maybe this should be supported for non-browser buffers */
function scroll_horiz_complete (buffer, n) {
    var w = buffer.focused_frame;
    w.scrollTo (n > 0 ? w.scrollMaxX : 0, w.scrollY);
}
interactive("scroll-beginning-of-line",
    "Scroll the current frame all the way to the left.",
    function (I) { scroll_horiz_complete(I.buffer, -1); });

interactive("scroll-end-of-line",
    "Scroll the current frame all the way to the right.",
    function (I) { scroll_horiz_complete(I.buffer, 1); });

interactive("scroll-top-left",
    "Scroll the current frame all the way to the top left",
     function (I) { I.buffer.do_command("cmd_scrollTop");
                    scroll_horiz_complete(I.buffer, -1); });


function delete_window (window) {
    window.window.close();
}
interactive("delete-window",
    "Delete the current window.",
    function (I) { delete_window(I.window); });

interactive("jsconsole",
    "Open the JavaScript console.",
    "find-url-new-buffer",
    $browser_object = "chrome://global/content/console.xul");


function paste_x_primary_selection (field) {
    modify_region(field, function (str) read_from_x_primary_selection());
}
interactive("paste-x-primary-selection",
    "Insert the contents of the X primary selection into the selected field or "+
    "minibuffer. Deactivates the region if it is active, and leaves the point "+
    "after the inserted text.",
    function (I) call_on_focused_field(I, paste_x_primary_selection, true));


function open_line (field) {
    modify_region(field, function() ["\n", 0]);
}
interactive("open-line",
    "If there is an active region, replace is with a newline, otherwise just "+
    "insert a newline. In both cases leave point before the inserted newline.",
    function (I) call_on_focused_field(I, open_line, true));


interactive("insert-parentheses",
    "Insert a pair of parentheses, or surround the currently selected text "+
    "with a pair of parentheses.",
    function (I) {
        call_on_focused_field(I, function (field) {
            modify_region(field,
                          function (str) {
                              return ["("+str+")", (str ? str.length+2 : 1)];
                          });
        }, true);
    });


function transpose_chars (field) {
    var value = field.value;
    var caret = field.selectionStart; // Caret position.
    var length = value.length;

    // If we have less than two character in the field or if we are at the
    // beginning of the field, do nothing.
    if (length < 2 || caret == 0)
        return;

    // If we are at the end of the field, switch places on the two last
    // characters. TODO: This should happen at the end of every line, not only
    // at the end of the field.
    if (caret == length)
        caret--;

    // Do the transposing.
    field.value = switch_subarrays(value, caret - 1, caret, caret, caret + 1);

    // Increment the caret position. If this is not done, the caret is left at
    // the end of the field as a result of the replacing of contents.
    field.selectionStart = caret + 1;
    field.selectionEnd = caret + 1;
}
interactive("transpose-chars",
    "Interchange characters around point, moving forward one character.",
    function (I) call_on_focused_field(I, transpose_chars, true));


interactive("execute-extended-command",
    "Call a command specified in the minibuffer.",
    function (I) {
        var prefix = I.P;
        var boc = I.browser_object;
        var prompt = "M-x";
        if (I.key_sequence)
            prompt = I.key_sequence.join(" ");
        if (boc)
            prompt += ' ['+boc.name+']';
        if (prefix !== null && prefix !== undefined) {
            if (typeof prefix == "object")
                prompt += prefix[0] == 4 ? " C-u" : " "+prefix[0];
            else
                prompt += " "+prefix;
        }
        var command = yield I.minibuffer.read_command($prompt = prompt);
        call_after_timeout(function () {
            input_handle_command.call(I.window, new command_event(command));
        }, 0);
    },
    $prefix = true);


/// built in commands
// see: http://www.xulplanet.com/tutorials/xultu/commandupdate.html

// Performs a command on a browser buffer content area


define_builtin_commands(
    "",
    function (I, command) {
        call_builtin_command(I.window, command);
    },
    false
);

define_builtin_commands(
    "caret-",
    function (I, command) {
        var buffer = I.buffer;
        try {
            buffer.do_command(command);
        } catch (e) {
            /* Ignore exceptions */
        }
    },
    'caret');

function get_link_text () {
    var e = document.commandDispatcher.focusedElement;
    if (e && e.getAttribute("href")) {
        return e.getAttribute("href");
    }
    return null;
}


/*
function copy_email_address (loc)
{
    // Copy the comma-separated list of email addresses only.
    // There are other ways of embedding email addresses in a mailto:
    // link, but such complex parsing is beyond us.
    var qmark = loc.indexOf( "?" );
    var addresses;

    if ( qmark > 7 ) {                   // 7 == length of "mailto:"
        addresses = loc.substring( 7, qmark );
    } else {
        addresses = loc.substr( 7 );
    }

    //XXX: the original code, which we got from firefox, unescapes the string
    //     using the current character set.  To do this in conkeror, we
    //     *should* use an interactive method that gives us the character set,
    //     rather than fetching it by side-effect.

    //     // Let's try to unescape it using a character set
    //     // in case the address is not ASCII.
    //     try {
    //         var characterSet = this.target.ownerDocument.characterSet;
    //         const textToSubURI = Components.classes["@mozilla.org/intl/texttosuburi;1"]
    //             .getService(Components.interfaces.nsITextToSubURI);
    //         addresses = textToSubURI.unEscapeURIForUI(characterSet, addresses);
    //     }
    //     catch(ex) {
    //         // Do nothing.
    //     }

    writeToClipboard(addresses);
    message("Copied '" + addresses + "'");
}
interactive("copy-email-address", copy_email_address, ['focused_link_url']);
*/

/* FIXME: fix this command */
/*
interactive("source",
            "Load a JavaScript file.",
            function (fo) { load_rc (fo.path); }, [['f', function (a) { return "Source File: "; }, null, "source"]]);
*/
function reinit (window) {
    var path;
    try {
        path = load_rc();
        window.minibuffer.message("Loaded: " + path);
    } catch (e) {
        window.minibuffer.message("Failed to load: "+path);
    }
}

interactive("reinit",
            "Reload the Conkeror rc file.",
            function (I) { reinit(I.window); });

interactive("help-page", "Open the Conkeror help page.",
            "find-url-new-buffer",
            $browser_object = "chrome://conkeror-help/content/help.html");

interactive("tutorial", "Open the Conkeror tutorial.",
            "find-url-new-buffer",
            $browser_object = "chrome://conkeror-help/content/tutorial.html");

function univ_arg_to_number (prefix, default_value) {
    if (prefix == null) {
        if (default_value == null)
            return 1;
        else
            return default_value;
    }
    if (typeof prefix == "object")
        return prefix[0];
    return prefix;
}

function eval_expression (window, s) {
    // eval in the global scope.

    // In addition, the following variables are available:
    // var window;
    var buffer = window.buffers.current;
    var result = eval(s);
    if (result !== undefined) {
        window.minibuffer.message(String(result));
    }
}
interactive("eval-expression",
    "Evaluate JavaScript statements.",
    function (I) {
        eval_expression(
            I.window,
            (yield I.minibuffer.read($prompt = "Eval:",
                                     $history = "eval-expression",
                                     $completer = javascript_completer(I.buffer))));
    });

function show_extension_manager () {
    return conkeror.window_watcher.openWindow(
        null,
        "chrome://mozapps/content/extensions/extensions.xul?type=extensions",
        "ExtensionsWindow",
        "resizable=yes,dialog=no",
        null);
}
interactive("extensions",
    "Open the extensions manager in a new window.",
    show_extension_manager);

function print_buffer (buffer) {
    buffer.top_frame.print();
}

interactive("print-buffer",
    "Print the currently loaded page.",
    function (I) { print_buffer(I.buffer); });

function view_partial_source (window, charset, selection) {
    if (charset)
        charset = "charset=" + charset;
    window.window.openDialog("chrome://global/content/viewPartialSource.xul",
                             "_blank", "scrollbars,resizable,chrome,dialog=no",
                             null, charset, selection, 'selection');
}
//interactive ('view-partial-source', view_partial_source, I.current_window, I.content_charset, I.content_selection);


function  view_mathml_source (window, charset, target) {
    if (charset)
        charset = "charset=" + charset;
    window.window.openDialog("chrome://global/content/viewPartialSource.xul",
                             "_blank", "scrollbars,resizable,chrome,dialog=no",
                             null, charset, target, 'mathml');
}


function send_key_as_event (window, element, combo) {
    var split = unformat_key_combo(combo);
    var event = window.document.createEvent("KeyboardEvent");
    event.initKeyEvent(
        "keypress",
        true,
        true,
        null,
        split.ctrlKey,
        split.altKey,
        split.shiftKey,
        split.metaKey,
        split.keyCode,
        split.charCode);
    if (element) {
        return element.dispatchEvent(event);
    } else {
        return window.dispatchEvent(event);
    }
}


function ensure_content_focused (buffer) {
    var foc = buffer.focused_frame_or_null;
    if (!foc)
        buffer.top_frame.focus();
}
interactive("ensure-content-focused", "Ensure that the content document has focus.",
    function (I) { ensure_content_focused(I.buffer); });


function network_set_online_status (status) {
    const io_service = Cc["@mozilla.org/network/io-service;1"]
        .getService(Ci.nsIIOService2);
    status = !status;
    io_service.manageOfflineStatus = false;
    io_service.offline = status;
}
interactive("network-go-online", "Work online.",
    function (I) { network_set_online_status(true); });

interactive("network-go-offline", "Work offline.",
    function (I) { network_set_online_status(false); });


interactive("submit-form",
    "Submit the form to which the focused element belongs.",
    function (I) {
        var el = I.buffer.focused_element.parentNode;
        while (el && el.tagName != "FORM")
            el = el.parentNode;
        if (el) {
            var inputs = el.getElementsByTagName("input");
            for (var i = 0, ilen = inputs.length; i < ilen; i++) {
                if (inputs[i].getAttribute("type") == "submit")
                    return browser_object_follow(I.buffer, FOLLOW_DEFAULT,
                                                 inputs[i]);
            }
            el.submit();
        }
    });


/*
 * Browser Object Commands
 */
interactive("follow", null,
    alternates(follow, follow_new_buffer, follow_new_window),
    $browser_object = browser_object_links);

interactive("follow-top", null,
    alternates(follow_current_buffer, follow_current_frame),
    $browser_object = browser_object_frames,
    $prompt = "Follow");

interactive("follow-new-buffer",
    "Follow a link in a new buffer",
    alternates(follow_new_buffer, follow_new_window),
    $browser_object = browser_object_links,
    $prompt = "Follow");

interactive("follow-new-buffer-background",
    "Follow a link in a new buffer in the background",
    alternates(follow_new_buffer_background, follow_new_window),
    $browser_object = browser_object_links,
    $prompt = "Follow");

interactive("follow-new-window",
    "Follow a link in a new window",
    follow_new_window,
    $browser_object = browser_object_links,
    $prompt = "Follow");

interactive("find-url", "Open a URL in the current buffer",
    alternates(follow_current_buffer, follow_new_buffer, follow_new_window),
    $browser_object = browser_object_url);

interactive("find-url-new-buffer",
    "Open a URL in a new buffer",
    alternates(follow_new_buffer, follow_new_window),
    $browser_object = browser_object_url,
    $prompt = "Find url");

interactive("find-url-new-window", "Open a URL in a new window",
    follow_new_window,
    $browser_object = browser_object_url,
    $prompt = "Find url");

interactive("find-alternate-url", "Edit the current URL in the minibuffer",
    "find-url",
    $browser_object =
        define_browser_object_class("alternate-url", null,
            function (I, prompt) {
                check_buffer(I.buffer, content_buffer);
                var result = yield I.buffer.window.minibuffer.read_url(
                    $prompt = prompt,
                    $initial_value = I.buffer.display_uri_string);
                yield co_return(result);
            }),
    $prompt = "Find url");


interactive("up", "Go to the parent directory of the current URL",
    "find-url",
    $browser_object = browser_object_up_url);

interactive("home",
    "Go to the homepage in the current buffer.", "follow",
    $browser_object = function () { return homepage; });

interactive("make-window",
    "Make a new window with the homepage.",
    follow_new_window,
    $browser_object = function () { return homepage; });

interactive("focus", null,
    function (I) {
        var element = yield read_browser_object(I);
        browser_element_focus(I.buffer, element);
    },
    $browser_object = browser_object_frames);

interactive("save",
    "Save a browser object.",
    function (I) {
        var element = yield read_browser_object(I);
        var spec = load_spec(element);
        var panel;
        panel = create_info_panel(I.window, "download-panel",
                                  [["downloading",
                                    element_get_operation_label(element, "Saving"),
                                    load_spec_uri_string(spec)],
                                   ["mime-type", "Mime type:", load_spec_mime_type(spec)]]);
        try {
            var file = yield I.minibuffer.read_file_check_overwrite(
                $prompt = "Save as:",
                $initial_value = suggest_save_path_from_file_name(suggest_file_name(spec), I.buffer),
                $history = "save");
        } finally {
            panel.destroy();
        }
        save_uri(spec, file,
                 $buffer = I.buffer,
                 $use_cache = false);
    },
    $browser_object = browser_object_links);


interactive("copy", null,
    function (I) {
        var element = yield read_browser_object(I);
        browser_element_copy(I.buffer, element);
    },
    $browser_object = browser_object_links);

interactive("paste-url", "Open a URL from the clipboard in the current buffer.",
	    alternates(follow_current_buffer, follow_new_buffer, follow_new_window),
	    $browser_object = browser_object_paste_url);

interactive("paste-url-new-buffer", "Open a URL from the clipboard in a new buffer.",
	    alternates(follow_new_buffer, follow_new_window),
	    $browser_object = browser_object_paste_url);

interactive("paste-url-new-window", "Open a URL from the clipboard in a new window.",
	    follow_new_window,
	    $browser_object = browser_object_paste_url);

interactive("view-source",
            "Toggle between source and rendered views of a URL.",
            alternates(view_source, view_source_new_buffer, view_source_new_window),
            $browser_object = browser_object_frames);


interactive("shell-command-on-url",
    "Run a shell command on the url of a browser object.",
    function (I) {
        var cwd = I.local.cwd;
        var element = yield read_browser_object(I);
        var spec = load_spec(element);
        var uri = load_spec_uri_string(spec);
        var panel;
        panel = create_info_panel(I.window, "download-panel",
                                  [["downloading",
                                    element_get_operation_label(element, "Running on", "URI"),
                                    load_spec_uri_string(spec)],
                                   ["mime-type", "Mime type:", load_spec_mime_type(spec)]]);
        try {
            var cmd = yield I.minibuffer.read_shell_command(
                $cwd = cwd,
                $initial_value = load_spec_default_shell_command(spec));
        } finally {
            panel.destroy();
        }
        shell_command_with_argument_blind(cmd, uri, $cwd = cwd);
    },
    $browser_object = browser_object_url,
    $prompt = "Shell command");


interactive("shell-command-on-file",
    "Download a document to a temporary file and run a shell command on it.",
    function (I) {
        var cwd = I.local.cwd;
        var element = yield read_browser_object(I);
        var spec = load_spec(element);
        var uri = load_spec_uri_string(spec);
        var panel;
        panel = create_info_panel(I.window, "download-panel",
                                  [["downloading",
                                    element_get_operation_label(element, "Running on"),
                                    load_spec_uri_string(spec)],
                                   ["mime-type", "Mime type:", load_spec_mime_type(spec)]]);
        try {
            var cmd = yield I.minibuffer.read_shell_command(
                $cwd = cwd,
                $initial_value = load_spec_default_shell_command(spec));
        } finally {
            panel.destroy();
        }
        yield browser_element_shell_command(I.buffer, element, cmd, cwd);
    },
    $browser_object = browser_object_links,
    $prompt = "Shell command");


interactive("bookmark",
    "Create a bookmark.",
    function (I) {
        var element = yield read_browser_object(I);
        var spec = load_spec(element);
        var uri_string = load_spec_uri_string(spec);
        var panel;
        panel = create_info_panel(I.window, "bookmark-panel",
                                  [["bookmarking",
                                    element_get_operation_label(element, "Bookmarking"),
                                    uri_string]]);
        try {
            var title = yield I.minibuffer.read($prompt = "Bookmark with title:", $initial_value = load_spec_title(spec) || "");
        } finally {
            panel.destroy();
        }
        add_bookmark(uri_string, title);
        I.minibuffer.message("Added bookmark: " + uri_string + " - " + title);
    },
    $browser_object = browser_object_frames);


interactive("save-page",
    "Save a document, not including any embedded documents such as images "+
    "and css.",
    function (I) {
        check_buffer(I.buffer, content_buffer);
        var element = yield read_browser_object(I);
        var spec = load_spec(element);
        if (!load_spec_document(spec))
            throw interactive_error("Element is not associated with a document.");
        var suggested_path = suggest_save_path_from_file_name(suggest_file_name(spec), I.buffer);

        var panel;
        panel = create_info_panel(I.window, "download-panel",
                                  [["downloading",
                                    element_get_operation_label(element, "Saving"),
                                    load_spec_uri_string(spec)],
                                   ["mime-type", "Mime type:", load_spec_mime_type(spec)]]);

        try {
            var file = yield I.minibuffer.read_file_check_overwrite(
                $prompt = "Save page as:",
                $history = "save",
                $initial_value = suggested_path);
        } finally {
            panel.destroy();
        }

        save_uri(spec, file, $buffer = I.buffer);
    },
    $browser_object = browser_object_frames);


interactive("save-page-as-text",
    "Save a page as plain text.",
    function (I) {
        check_buffer(I.buffer, content_buffer);
        var element = yield read_browser_object(I);
        var spec = load_spec(element);
        var doc;
        if (!(doc = load_spec_document(spec)))
            throw interactive_error("Element is not associated with a document.");
        var suggested_path = suggest_save_path_from_file_name(suggest_file_name(spec, "txt"), I.buffer);

        var panel;
        panel = create_info_panel(I.window, "download-panel",
                                  [["downloading",
                                    element_get_operation_label(element, "Saving", "as text"),
                                    load_spec_uri_string(spec)],
                                   ["mime-type", "Mime type:", load_spec_mime_type(spec)]]);

        try {
            var file = yield I.minibuffer.read_file_check_overwrite(
                $prompt = "Save page as text:",
                $history = "save",
                $initial_value = suggested_path);
        } finally {
            panel.destroy();
        }

        save_document_as_text(doc, file, $buffer = I.buffer);
    },
    $browser_object = browser_object_frames);


interactive("save-page-complete",
    "Save a page and all supporting documents, including images, css, "+
    "and child frame documents.",
    function (I) {
        check_buffer(I.buffer, content_buffer);
        var element = yield read_browser_object(I);
        var spec = load_spec(element);
        var doc;
        if (!(doc = load_spec_document(spec)))
            throw interactive_error("Element is not associated with a document.");
        var suggested_path = suggest_save_path_from_file_name(suggest_file_name(spec), I.buffer);

        var panel;
        panel = create_info_panel(I.window, "download-panel",
                                  [["downloading",
                                    element_get_operation_label(element, "Saving complete"),
                                    load_spec_uri_string(spec)],
                                   ["mime-type", "Mime type:", load_spec_mime_type(spec)]]);

        try {
            var file = yield I.minibuffer.read_file_check_overwrite(
                $prompt = "Save page complete:",
                $history = "save",
                $initial_value = suggested_path);
            // FIXME: use proper read function
            var dir = yield I.minibuffer.read_file(
                $prompt = "Data Directory:",
                $history = "save",
                $initial_value = file.path + ".support");
        } finally {
            panel.destroy();
        }

        save_document_complete(doc, file, dir, $buffer = I.buffer);
    },
    $browser_object = browser_object_frames);


function view_as_mime_type (I, target) {
    I.target = target;
    var element = yield read_browser_object(I);
    var spec = load_spec(element);

    if (target == null)
        target = FOLLOW_CURRENT_FRAME;

    if (!can_override_mime_type_for_uri(load_spec_uri(spec)))
        throw interactive_error("Overriding the MIME type is not currently supported for non-HTTP URLs.");

    var panel;

    var mime_type = load_spec_mime_type(spec);
    panel = create_info_panel(I.window, "download-panel",
                              [["downloading",
                                element_get_operation_label(element, "View in browser"),
                                load_spec_uri_string(spec)],
                               ["mime-type", "Mime type:", load_spec_mime_type(spec)]]);


    try {
        let suggested_type = mime_type;
        if (viewable_mime_type_list.indexOf(suggested_type) == -1)
            suggested_type = "text/plain";
        mime_type = yield I.minibuffer.read_viewable_mime_type(
            $prompt = "View internally as",
            $initial_value = suggested_type,
            $select);
        override_mime_type_for_next_load(load_spec_uri(spec), mime_type);
        browser_object_follow(I.buffer, target, spec);
    } finally {
        panel.destroy();
    }
}

function view_as_mime_type_new_buffer (I) {
    yield view_as_mime_type(I, OPEN_NEW_BUFFER);
}

function view_as_mime_type_new_window (I) {
    yield view_as_mime_type(I, OPEN_NEW_WINDOW);
}

interactive("view-as-mime-type",
    "Display a browser object in the browser using the specified MIME type.",
    alternates(view_as_mime_type,
        view_as_mime_type_new_buffer,
        view_as_mime_type_new_window),
    $browser_object = browser_object_frames);


interactive("delete",
    "Delete a DOM node, given as a browser object.",
    function (I) {
        var elem = yield read_browser_object(I);
        elem.parentNode.removeChild(elem);
    },
    $browser_object = browser_object_dom_node);


interactive("charset-prefix",
    "A prefix command that prompts for a charset to use in a "+
    "subsequent navigation command.",
    function (I) {
        var ccman = Cc["@mozilla.org/charset-converter-manager;1"]
            .getService(Ci.nsICharsetConverterManager);
        var decoders = ccman.getDecoderList()
        var charsets = [];
        while (decoders.hasMore())
            charsets.push(decoders.getNext());
        I.forced_charset = yield I.minibuffer.read(
            $prompt = "Charset:",
            $completer = prefix_completer(
                $completions = charsets,
                $get_string = function (x) x.toLowerCase()),
            $match_required,
            $space_completes);
    },
    $prefix);


interactive("reload-with-charset",
    "Prompt for a charset, and reload the current page, forcing use "+
    "of that charset.",
    function (I) {
        var ccman = Cc["@mozilla.org/charset-converter-manager;1"]
            .getService(Ci.nsICharsetConverterManager);
        var decoders = ccman.getDecoderList()
        var charsets = [];
        while (decoders.hasMore())
            charsets.push(decoders.getNext());
        var forced_charset = yield I.minibuffer.read(
            $prompt = "Charset:",
            $completer = prefix_completer(
                $completions = charsets,
                $get_string = function (x) x.toLowerCase()),
            $match_required,
            $space_completes);
        reload(I.buffer, false, null, forced_charset);
    });


interactive("yank",
    "Paste the contents of the clipboard",
    function (I) {
        call_builtin_command(I.window, "cmd_paste", true);
    });

interactive("kill-region",
    "Kill (\"cut\") the selected text.",
    function (I) {
        call_builtin_command(I.window, "cmd_cut", true);
    });

interactive("kill-ring-save",
    "Save the region as if killed, but don't kill it.",
    function (I) {
        call_builtin_command(I.window, "cmd_copy", true);
    });

provide("commands");
