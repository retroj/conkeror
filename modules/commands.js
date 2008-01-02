/***** BEGIN LICENSE BLOCK *****
Version: MPL 1.1/GPL 2.0/LGPL 2.1

The contents of this file are subject to the Mozilla Public License Version
1.1 (the "License"); you may not use this file except in compliance with
the License. You may obtain a copy of the License at
http://www.mozilla.org/MPL/

Software distributed under the License is distributed on an "AS IS" basis,
WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
for the specific language governing rights and limitations under the
License.

The Initial Developer of the Original Code is Shawn Betts.
Portions created by the Initial Developer are Copyright (C) 2004,2005
by the Initial Developer. All Rights Reserved.

Alternatively, the contents of this file may be used under the terms of
either the GNU General Public License Version 2 or later (the "GPL"), or
the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
in which case the provisions of the GPL or the LGPL are applicable instead
of those above. If you wish to allow use of your version of this file only
under the terms of either the GPL or the LGPL, and not to allow others to
use your version of this file under the terms of the MPL, indicate your
decision by deleting the provisions above and replace them with the notice
and other provisions required by the GPL or the LGPL. If you do not delete
the provisions above, a recipient may use your version of this file under
the terms of any one of the MPL, the GPL or the LGPL.
***** END LICENSE BLOCK *****/

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
             show_conkeror_version, I.current_window);

/* FIXME: maybe this should be supported for non-browser buffers */
function scrollHorizComplete (buffer, n)
{
    var w = buffer.focused_frame;
    w.scrollTo (n > 0 ? w.scrollMaxX : 0, w.scrollY);
}
interactive("beginning-of-line",
            "Scroll the current window all the way to the left.",
            scrollHorizComplete, I.current_buffer, -1);

interactive("end-of-line",
            "Scroll the current frame all the way to the right.",
            scrollHorizComplete, I.current_buffer, 1);

interactive("make-window",
            "Make a new window.",
            make_window,
            I.bind(buffer_creator, content_buffer,
                   $load = I.bind(function(){return homepage;}),
                   $configuration = I.buffer_configuration));

function delete_window (window)
{
    window.window.close();
}
interactive("delete-window",
            "Delete the current window.",
            delete_window, I.current_window);

interactive("jsconsole",
            "Open the JavaScript console.",
            open_in_browser,
            I.current_buffer, I.browse_target("jsconsole"),
            "chrome://global/content/console.xul");
default_browse_targets["jsconsole"] = "find-url";

// Copy the contents of the X11 clipboard to ours. This is a cheap
// hack because it seems impossible to just always yank from the X11
// clipboard. So you have to manually pull it.
function yankToClipboard (window)
{
    var str = readFromClipboard();
    var clipid = Components.interfaces.nsIClipboard;
    const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
        .getService(Components.interfaces.nsIClipboardHelper);
    gClipboardHelper.copyString(str);
    window.message("Pulled '" + str + "'");
}
interactive("yank-to-clipboard", yankToClipboard, I.current_window);

function meta_x (window, prefix, command)
{
    call_interactively({window: window, prefix_argument: prefix}, command);
}
interactive("execute-extended-command",
            "Execute a Conkeror command specified in the minibuffer.",
            meta_x,
            I.current_window, I.P,
            I.C($prompt = I.bind(function (prefix) {
                        var prompt = "";
                        if (prefix == null)
                            prompt = "";
                        else if (typeof prefix == "object")
                            prompt = prefix[0] == 4 ? "C-u " : prefix[0] + " ";
                        else
                            prompt = prefix + " ";
                        return prompt + "M-x";
                    }, I.P)));


/// built in commands
// see: http://www.xulplanet.com/tutorials/xultu/commandupdate.html

// Performs a command on a browser buffer content area
function goDoCommand (buffer, command)
{
    try {
        buffer.do_command(command);
    } catch (e) {
        dumpln("buffer: " + buffer + ", " + buffer.window);
        buffer.window.minibuffer.message ("goDoCommand ("+command+"): "+e);
    }
}
interactive("cmd_beginLine", goDoCommand, I.current_buffer, 'cmd_beginLine');
interactive("cmd_copy", goDoCommand, I.current_buffer, 'cmd_copy');
interactive("cmd_copyOrDelete", goDoCommand, I.current_buffer, 'cmd_copyOrDelete');
interactive("cmd_cut", goDoCommand, I.current_buffer, 'cmd_cut');
interactive("cmd_cutOrDelete", goDoCommand, I.current_buffer, 'cmd_cutOrDelete');
interactive("cmd_deleteToBeginningOfLine", goDoCommand, I.current_buffer, 'cmd_deleteToBeginningOfLine');
interactive("cmd_deleteToEndOfLine", goDoCommand, I.current_buffer, 'cmd_deleteToEndOfLine');
interactive("cmd_endLine", goDoCommand, I.current_buffer, 'cmd_endLine');
interactive("cmd_moveTop", goDoCommand, I.current_buffer, 'cmd_moveTop');
interactive("cmd_moveBottom", goDoCommand, I.current_buffer, 'cmd_moveBottom');
interactive("cmd_selectAll", goDoCommand, I.current_buffer, 'cmd_selectAll');
interactive("cmd_selectBeginLine", goDoCommand, I.current_buffer, 'cmd_selectBeginLine');
interactive("cmd_selectBottom", goDoCommand, I.current_buffer, 'cmd_selectBottom');
interactive("cmd_selectEndLine", goDoCommand, I.current_buffer, 'cmd_selectEndLine');
interactive("cmd_selectTop", goDoCommand, I.current_buffer, 'cmd_selectTop');
interactive("cmd_scrollBeginLine", goDoCommand, I.current_buffer, 'cmd_scrollBeginLine');
interactive("cmd_scrollEndLine", goDoCommand, I.current_buffer, 'cmd_scrollEndLine');
interactive("cmd_scrollTop", goDoCommand, I.current_buffer, 'cmd_scrollTop');
interactive("cmd_scrollBottom", goDoCommand, I.current_buffer, 'cmd_scrollBottom');


function doCommandNTimes (buffer, n, cmd)
{
    for(i=0;i<n;i++)
        goDoCommand (buffer, cmd);
}
interactive("cmd_charNext", doCommandNTimes, I.current_buffer, I.p, 'cmd_charNext');
interactive("cmd_charPrevious", doCommandNTimes, I.current_buffer, I.p, 'cmd_charPrevious');
interactive("cmd_deleteCharBackward", doCommandNTimes, I.current_buffer, I.p, 'cmd_deleteCharBackward');
interactive("cmd_deleteCharForward", doCommandNTimes, I.current_buffer, I.p, 'cmd_deleteCharForward');
interactive("cmd_deleteWordBackward", doCommandNTimes, I.current_buffer, I.p, 'cmd_deleteWordBackward');
interactive("cmd_deleteWordForward", doCommandNTimes, I.current_buffer, I.p, 'cmd_deleteWordForward');
interactive("cmd_lineNext", doCommandNTimes, I.current_buffer, I.p, 'cmd_lineNext');
interactive("cmd_linePrevious", doCommandNTimes, I.current_buffer, I.p, 'cmd_linePrevious');
interactive("cmd_movePageDown", doCommandNTimes, I.current_buffer, I.p, 'cmd_movePageDown');
interactive("cmd_movePageUp", doCommandNTimes, I.current_buffer, I.p, 'cmd_movePageUp');
interactive("cmd_redo", doCommandNTimes, I.current_buffer, I.p, 'cmd_redo');
interactive("cmd_selectCharNext", doCommandNTimes, I.current_buffer, I.p, 'cmd_selectCharNext');
interactive("cmd_selectCharPrevious", doCommandNTimes, I.current_buffer, I.p, 'cmd_selectCharPrevious');
interactive("cmd_selectLineNext", doCommandNTimes, I.current_buffer, I.p, 'cmd_selectLineNext');
interactive("cmd_selectLinePrevious", doCommandNTimes, I.current_buffer, I.p, 'cmd_selectLinePrevious');
interactive("cmd_selectPageDown", doCommandNTimes, I.current_buffer, I.p, 'cmd_selectPageDown');
interactive("cmd_selectPageUp", doCommandNTimes, I.current_buffer, I.p, 'cmd_selectPageUp');
interactive("cmd_selectWordNext", doCommandNTimes, I.current_buffer, I.p, 'cmd_selectWordNext');
interactive("cmd_selectWordPrevious", doCommandNTimes, I.current_buffer, I.p, 'cmd_selectWordPrevious');
interactive("cmd_undo", doCommandNTimes, I.current_buffer, I.p, 'cmd_undo');
interactive("cmd_wordNext", doCommandNTimes, I.current_buffer, I.p, 'cmd_wordNext');
interactive("cmd_wordPrevious", doCommandNTimes, I.current_buffer, I.p, 'cmd_wordPrevious');
interactive("cmd_scrollPageUp", doCommandNTimes, I.current_buffer, I.p, 'cmd_scrollPageUp');
interactive("cmd_scrollPageDown", doCommandNTimes, I.current_buffer, I.p, 'cmd_scrollPageDown');
interactive("cmd_scrollLineUp", doCommandNTimes, I.current_buffer, I.p, 'cmd_scrollLineUp');
interactive("cmd_scrollLineDown", doCommandNTimes, I.current_buffer, I.p, 'cmd_scrollLineDown');
interactive("cmd_scrollLeft", doCommandNTimes, I.current_buffer, I.p, 'cmd_scrollLeft');
interactive("cmd_scrollRight", doCommandNTimes, I.current_buffer, I.p, 'cmd_scrollRight');
interactive("cmd_paste", doCommandNTimes, I.current_buffer, I.p, 'cmd_paste');

/*
function describe_bindings (window, prefix)
{
    var new_window = open_url_in(window, prefix, "about:blank");
    new_window.setTimeout(genAllBindings, 0, new_window);
}
interactive("describe-bindings", describe_bindings, I.current_window, I.p);
*/

function get_link_text()
{
    var e = document.commandDispatcher.focusedElement;   
    if (e && e.getAttribute("href")) {
        return e.getAttribute("href");
    }
    return null;
}


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


interactive("source",
            "Load a JavaScript file.",
            function (fo) { load_rc (fo.path); }, [['f', function (a) { return "Source File: "; }, null, "source"]]);

function reinit (window, fn)
{
  try {
    load_rc (fn);
    window.message ("loaded \""+fn+"\"");
  } catch (e) {
    window.message ("failed to load \""+fn+"\"");
  }
}

interactive ("reinit",
             "Reload the Conkeror rc file.",
             reinit, I.current_window, I.pref("conkeror.rcfile"));

interactive("help-page",
            "Open the Conkeror help page.",
            open_in_browser,
            I.current_buffer,
            I.browse_target("open"),
            "chrome://conkeror/content/help.html");

interactive("help-with-tutorial",
            "Open the Conkeror tutorial.",
            open_in_browser,
            I.current_buffer,
            I.browse_target("open"),
            "chrome://conkeror/content/tutorial.html");


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

function eval_expression (window, s)
{
    eval.call(window, s);
}
interactive("eval-expression",
            "Evaluate JavaScript statements.",
            eval_expression,
            I.current_window, I.s($prompt = "Eval:", $history = "eval-expression"));


// our little hack. Add a big blank chunk to the bottom of the
// page
const scrolly_document_observer = {

    enabled : false,

    observe: function(subject, topic, url)
    {
        // We asume the focused window is the one loading. Not always
        // the case..tho pretty safe since conkeror is only one window.
        try {
            var win = document.commandDispatcher.focusedWindow;
            var doc;
            if (win) 
                doc = win.content.document;
            else
                doc = content.document;

            // Make sure we haven't already added the image
            if (!doc.__conkeror_scrolly_hack__) {
                doc.__conkeror_scrolly_hack__ = true;
                var spc = doc.createElement("img");
                spc.setAttribute("width", "1");
                spc.setAttribute("height", getBrowser().mCurrentBrowser.boxObject.height);
                spc.setAttribute("src", "chrome://conkeror/content/pixel.png");
                doc.lastChild.appendChild(spc);
            }
        } catch(e) {alert(e);}
    }
};

/*
function toggle_eod_space()
{
    var observerService = Components.classes["@mozilla.org/observer-service;1"]
        .getService(Components.interfaces.nsIObserverService);
    if (scrolly_document_observer.enabled) {
        observerService.removeObserver(scrolly_document_observer, "page-end-load", false);
        scrolly_document_observer.enabled = false;
    } else {
        observerService.addObserver(scrolly_document_observer, "page-end-load", false);
        scrolly_document_observer.enabled = true;
    }
}
interactive("toggle-eod-space", toggle_eod_space);
*/

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
            print_buffer, I.current_buffer(content_buffer));

function view_partial_source (window, charset, selection) {
    if (charset) { charset = "charset=" + charset; }
    window.window.openDialog("chrome://global/content/viewPartialSource.xul",
                            "_blank", "scrollbars,resizable,chrome,dialog=no",
                            null, charset, selection, 'selection');
}
interactive ('view-partial-source', view_partial_source, I.current_window, I.content_charset, I.content_selection);


function  view_mathml_source (window, charset, target) {
    if (charset) { charset = "charset=" + charset; }
    window.window.openDialog("chrome://global/content/viewPartialSource.xul",
                            "_blank", "scrollbars,resizable,chrome,dialog=no",
                            null, charset, target, 'mathml');
}
