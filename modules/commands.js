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
            function (I) {
                open_in_browser(I.buffer,
                                I.browse_target("jsconsole"),
                                "chrome://global/content/console.xul");
            });
default_browse_targets["jsconsole"] = "find-url-new-buffer";


function paste_x_primary_selection (field) {
    var str = read_from_x_primary_selection ();
    var point = field.selectionEnd;
    field.value = field.value.substr (0, field.selectionStart) +
        str + field.value.substr (field.selectionEnd);
    point += str.length;
    field.setSelectionRange (point, point);
}
interactive (
    "paste-x-primary-selection",
    function (I) {
        var m = I.window.minibuffer;
        var s = m.current_state;
        if (m._input_mode_enabled) {
            m._restore_normal_state();
            var e = m.input_element;
        } else
            var e = I.buffer.focused_element;
        paste_x_primary_selection (e);
        ensure_index_is_visible (I.window, e, e.selectionStart);
        if (s && s.handle_input)
            s.handle_input(m);
    });


function meta_x (window, prefix, command)
{
    call_interactively({window: window, prefix_argument: prefix}, command);
}
interactive("execute-extended-command",
            "Execute a Conkeror command specified in the minibuffer.",
            function (I) {
                var prefix = I.P;
                var prompt = "";
                if (prefix == null)
                    prompt = "";
                else if (typeof prefix == "object")
                    prompt = prefix[0] == 4 ? "C-u " : prefix[0] + " ";
                else
                    prompt = prefix + " ";
                meta_x(I.window, I.P,
                       (yield I.minibuffer.read_command(
                           $prompt = "M-x" + prompt)));
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
    function (I) I.buffer.mark_active
);

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
