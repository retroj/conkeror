/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2008 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("content-buffer.js");

define_hook("quit_hook");

function quit ()
{
    quit_hook.run();
    var appStartup = Cc["@mozilla.org/toolkit/app-startup;1"]
        .getService(Ci.nsIAppStartup);
    appStartup.quit(appStartup.eAttemptQuit);
}
interactive("quit",
            "Quit Conkeror",
            quit);


function show_conkeror_version (window)
{
    window.minibuffer.message (conkeror.version);
}
interactive ("conkeror-version",
             "Show version information for Conkeror.",
             function (I) {show_conkeror_version(I.window);});

/* FIXME: maybe this should be supported for non-browser buffers */
function scroll_horiz_complete (buffer, n)
{
    var w = buffer.focused_frame;
    w.scrollTo (n > 0 ? w.scrollMaxX : 0, w.scrollY);
}
interactive("scroll-beginning-of-line",
            "Scroll the current frame all the way to the left.",
            function (I) {scroll_horiz_complete(I.buffer, -1);});

interactive("scroll-end-of-line",
            "Scroll the current frame all the way to the right.",
            function (I) {scroll_horiz_complete(I.buffer, 1);});

interactive("make-window",
            "Make a new window.",
            function (I) {
                make_window(buffer_creator(content_buffer,
                                           $load = homepage,
                                           $configuration = I.buffer.configuration));
            });

function delete_window (window)
{
    window.window.close();
}
interactive("delete-window",
            "Delete the current window.",
            function (I) {delete_window(I.window);});

interactive("jsconsole",
            "Open the JavaScript console.",
            "find-url-new-buffer",
            $browser_object = "chrome://global/content/console.xul");

/**
 * Given a callback func and an interactive context I, call func, passing either
 * a focused field, or the minibuffer's input element if the minibuffer is
 * active. Afterward, call `ensure_index_is_visible' on the field. See
 * `paste_x_primary_selection' and `open_line' for examples.
 */
function call_on_focused_field(I, func) {
  var m = I.window.minibuffer;
  var s = m.current_state;
  if (m._input_mode_enabled) {
    m._restore_normal_state();
    var e = m.input_element;
  } else var e = I.buffer.focused_element;
  func(e);
  ensure_index_is_visible (I.window, e, e.selectionStart);
  if (s && s.handle_input) s.handle_input(m);
}

/**
 * Replace the current region with modifier(selection). Deactivates region and
 * sets point to the end of the inserted text, unless keep_point is true, in
 * which case the point will be left at the beginning of the inserted text.
 */
function modify_region(field, modifier, keep_point) {
  var replacement =
    modifier(field.value.substring(field.selectionStart, field.selectionEnd+1));
  var point = field.selectionStart;
  field.value =
    field.value.substr(0, field.selectionStart) + replacement +
    field.value.substr(field.selectionEnd);
  if (!keep_point) point += replacement.length;
  field.setSelectionRange(point, point);
}

function paste_x_primary_selection (field) {
  modify_region(field, function(str) read_from_x_primary_selection());
}
interactive (
  "paste-x-primary-selection",
  "Insert the contents of the X primary selection into the selected field or " +
  "minibuffer. Deactivates the region if it is active, and leaves the point " +
  "after the inserted text.",
  function (I) call_on_focused_field(I, paste_x_primary_selection)
);

function open_line(field) {
  modify_region(field, function() "\n", true);
}
interactive(
  "open-line",
  "If there is an active region, replace is with a newline, otherwise just " +
  "insert a newline. In both cases leave point before the inserted newline.",
  function (I) call_on_focused_field(I, open_line)
);

function meta_x (window, prefix, command, browser_object_class)
{
    call_interactively({window: window,
                        prefix_argument: prefix,
                        _browser_object_class: browser_object_class}, command);
}
interactive("execute-extended-command",
            "Execute a Conkeror command specified in the minibuffer.",
            function (I) {
                var prefix = I.P;
                var boc = I._browser_object_class;
                var prompt = "";
                if (boc)
                    prompt += ' ['+boc+']';
                if (prefix !== null && prefix !== undefined) {
                    if (typeof prefix == "object")
                        prompt += prefix[0] == 4 ? " C-u" : " "+prefix[0];
                    else
                        prompt += " "+prefix;
                }
                meta_x(I.window, I.P,
                       (yield I.minibuffer.read_command(
                           $prompt = "M-x" + prompt)),
                       boc);
            });

/// built in commands
// see: http://www.xulplanet.com/tutorials/xultu/commandupdate.html

// Performs a command on a browser buffer content area


define_builtin_commands(
    "",
    function (I, command) {
        var buffer = I.buffer;
        try {
            buffer.do_command(command);
        } catch (e) {
            /* Ignore exceptions */
        }
    },
    function (I) {
        I.buffer.mark_active = !I.buffer.mark_active;
    },
    function (I) I.buffer.mark_active,
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
    function (I) {
        I.buffer.mark_active = !I.buffer.mark_active;
    },
    function (I) I.buffer.mark_active,
    'caret');

function get_link_text()
{
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
function reinit (window, fn)
{
    try {
        load_rc (fn);
        window.minibuffer.message ("Loaded: " + fn);
    } catch (e) {
        window.minibuffer.message ("Failed to load: "+fn);
    }
}

interactive ("reinit",
             "Reload the Conkeror rc file.",
             function (I) {
                 reinit(I.window, get_pref("conkeror.rcfile"));
             });

interactive("help-page",
            "Open the Conkeror help page.",
            function (I) {
                open_in_browser(I.buffer, I.browse_target("find-url"),
                                "chrome://conkeror/content/help.html");
            });

interactive("help-with-tutorial",
            "Open the Conkeror tutorial.",
            function (I) {
                open_in_browser(I.buffer, I.browse_target("find-url"),
                                "chrome://conkeror/content/tutorial.html");
            });

function univ_arg_to_number(prefix, default_value)
{
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

function eval_expression(window, s)
{
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
    return conkeror.window_watcher.openWindow (
        null,
        "chrome://mozapps/content/extensions/extensions.xul?type=extensions",
        "ExtensionsWindow",
        "resizable=yes,dialog=no",
        null);
}
interactive("extensions",
            "Open the extensions manager in a new window.",
            show_extension_manager);

function print_buffer(buffer)
{
    buffer.top_frame.print();
}
interactive("print-buffer",
            "Print the currently loaded page.",
            function (I) {print_buffer(I.buffer);});

function view_partial_source (window, charset, selection) {
    if (charset) { charset = "charset=" + charset; }
    window.window.openDialog("chrome://global/content/viewPartialSource.xul",
                            "_blank", "scrollbars,resizable,chrome,dialog=no",
                            null, charset, selection, 'selection');
}
//interactive ('view-partial-source', view_partial_source, I.current_window, I.content_charset, I.content_selection);


function  view_mathml_source (window, charset, target) {
    if (charset) { charset = "charset=" + charset; }
    window.window.openDialog("chrome://global/content/viewPartialSource.xul",
                            "_blank", "scrollbars,resizable,chrome,dialog=no",
                            null, charset, target, 'mathml');
}


function send_key_as_event (window, element, key) {
    key = kbd (key)[0];
    var event = window.document.createEvent ("KeyboardEvent");
    event.initKeyEvent (
        "keypress",
        true,
        true,
        null,
        key.modifiers & MOD_CTRL, // ctrl
        key.modifiers & MOD_META, // alt
        key.modifiers & MOD_SHIFT, // shift
        key.modifiers & MOD_META, // meta
        key.keyCode,
        null);    // charcode
    // bit of a hack here.. we have to fake a keydown event for conkeror
    window.keyboard.last_key_down_event = copy_event (event);
    if (element) {
        return element.dispatchEvent (event);
    } else {
        return window.dispatchEvent (event);
    }
}
interactive (
    "send-ret",
    null,
    function (I) {
        send_key_as_event (I.window, I.buffer.focused_element, "return");
    });

function ensure_content_focused(buffer) {
    var foc = buffer.focused_frame_or_null;
    if (!foc)
        buffer.top_frame.focus();
}
interactive("ensure-content-focused", "Ensure that the content document has focus.",
            function (I) { ensure_content_focused(I.buffer); });

function network_set_online_status (status) {
    status = !status;
    io_service.manageOfflineStatus = false;
    io_service.offline = status;
}

interactive("network-go-online", "Work online.",
            function (I) {network_set_online_status (true);});
interactive("network-go-offline", "Work offline.",
            function (I) {network_set_online_status (false);});


/*
 * Browser Object Commands
 */
interactive("follow", null, follow,
            $browser_object = browser_object_links);

interactive("follow-top", null, follow_top,
            $browser_object = browser_object_frames);


interactive("find-url", "Open a URL in the current buffer", "follow",
            $browser_object = browser_object_url);
default_browse_targets["find-url"] = [OPEN_CURRENT_BUFFER, OPEN_NEW_BUFFER, OPEN_NEW_WINDOW];


interactive("find-url-new-buffer",
            "Open a URL in a new buffer",
            follow_new_buffer,
            $browser_object = browser_object_url);
default_browse_targets["find-url-new-buffer"] = [OPEN_NEW_BUFFER, OPEN_NEW_WINDOW];


interactive("find-url-new-window", "Open a URL in a new window",
            follow_new_window,
            $browser_object = browser_object_url);
default_browse_targets["find-url-new-window"] = [OPEN_NEW_WINDOW];


interactive("find-alternate-url", "Edit the current URL in the minibuffer", "follow",
            $browser_object =
                define_browser_object_class(
                    "alternate-url", null, null,
                    function (buf, prompt) {
                        check_buffer (buf, content_buffer);
                        var result = yield buf.window.minibuffer.read_url (
                            $prompt = prompt,
                            $initial_value = buf.display_URI_string);
                        yield co_return (result);
                    }));


interactive("go-up", "Go to the parent directory of the current URL", "follow",
            $browser_object =
                define_browser_object_class(
                    "up-url", null, null,
                    function (buf, prompt) {
                        check_buffer (buf, content_buffer);
                        var up = compute_url_up_path (buf.current_URI.spec);
                        return buf.current_URI.resolve (up);
                    }));
default_browse_targets["go-up"] = "find-url";


interactive("focus", null,
            function (I) {
                var element = yield I.read_browser_object("focus");
                browser_element_focus(I.buffer, element);
            },
            $browser_object = browser_object_frames);

interactive("save", null, function (I) {
    var element = yield I.read_browser_object("save", "Save");

    var spec = element_get_load_spec(element);
    if (spec == null)
        throw interactive_error("Element has no associated URI");

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
});


interactive("copy", null,
            function (I) {
                var element = yield I.read_browser_object("copy");
                browser_element_copy(I.buffer, element);
            },
            $browser_object = browser_object_links);

interactive("view-source", null,
            function (I) {
                var target = I.browse_target("follow");
                var element = yield I.read_browser_object("view-source", target);
                yield browser_element_view_source(I.buffer, target, element);
            },
            $browser_object = browser_object_frames);

interactive("shell-command-on-url", null, function (I) {
    var cwd = I.cwd;
    var element = yield I.read_browser_object("shell_command_url");
    var spec = element_get_load_spec(element);
    if (spec == null)
        throw interactive_error("Unable to obtain URI from element");

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
});


interactive("shell-command-on-file", null, function (I) {
    var cwd = I.cwd;
    var element = yield I.read_browser_object("shell_command");

    var spec = element_get_load_spec(element);
    if (spec == null)
        throw interactive_error("Unable to obtain URI from element");

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

    /* FIXME: specify cwd as well */
    yield browser_element_shell_command(I.buffer, element, cmd);
});

interactive("bookmark", null, function (I) {
    var element = yield I.read_browser_object("bookmark");
    var spec = element_get_load_spec(element);
    if (!spec)
        throw interactive_error("Element has no associated URI");
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
});

interactive("save-page", null, function (I) {
    check_buffer(I.buffer, content_buffer);
    var element = yield I.read_browser_object("save_page");
    var spec = element_get_load_spec(element);
    if (!spec || !load_spec_document(spec))
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
});

interactive("save-page-as-text", null, function (I) {
    check_buffer(I.buffer, content_buffer);
    var element = yield I.read_browser_object("save_page_as_text");
    var spec = element_get_load_spec(element);
    var doc;
    if (!spec || !(doc = load_spec_document(spec)))
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
});

interactive("save-page-complete", null, function (I) {
    check_buffer(I.buffer, content_buffer);
    var element = yield I.read_browser_object("save_page_complete");
    var spec = element_get_load_spec(element);
    var doc;
    if (!spec || !(doc = load_spec_document(spec)))
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
});

default_browse_targets["view-as-mime-type"] = [FOLLOW_CURRENT_FRAME, OPEN_CURRENT_BUFFER,
                                               OPEN_NEW_BUFFER, OPEN_NEW_WINDOW];
interactive("view-as-mime-type",
            "Display a browser object in the browser using the specified MIME type.",
            function (I) {
                var element = yield I.read_browser_object("view_as_mime_type");
                var spec = element_get_load_spec(element);

                var target = I.browse_target("view-as-mime-type");

                if (!spec)
                    throw interactive_error("Element is not associated with a URI");

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
                    if (gecko_viewable_mime_type_list.indexOf(suggested_type) == -1)
                        suggested_type = "text/plain";
                    mime_type = yield I.minibuffer.read_gecko_viewable_mime_type(
                        $prompt = "View internally as",
                        $initial_value = suggested_type,
                        $select);
                    override_mime_type_for_next_load(load_spec_uri(spec), mime_type);
                    browser_element_follow(I.buffer, target, spec);
                } finally {
                    panel.destroy();
                }
            });
