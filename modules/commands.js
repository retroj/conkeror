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

require("browser_buffer.js");

define_hook("quit_hook");

function quit ()
{
    quit_hook.run();
    var appStartup = Components.classes["@mozilla.org/toolkit/app-startup;1"]
        .getService(Components.interfaces.nsIAppStartup);
    appStartup.quit(appStartup.eAttemptQuit);
}
interactive("quit", quit);


function show_conkeror_version (frame)
{
    frame.minibuffer.message (conkeror.version);
}
interactive ("conkeror-version", show_conkeror_version, I.current_frame);


function unfocus (frame)
{
    if (frame.document.commandDispatcher.focusedElement)
        frame.document.commandDispatcher.focusedElement.blur();
    else if (frame.document.commandDispatcher.focusedWindow)
    {
        // null op
    }
    else
        frame.window.content.focus();
}
interactive("unfocus", unfocus, I.current_frame);


function go_back (frame, prefix)
{
    var b = frame.buffers.current;
    // Should be checking if type of buffer is browser_buffer
    if (b.web_navigation.canGoBack)
    {
        var hist = b.web_navigation.sessionHistory;
        var idx = hist.index - prefix;
        if (idx < 0)
            idx = 0;
        b.web_navigation.gotoIndex(idx);
    }
}
interactive("go-back", go_back, I.current_frame, I.p);


function go_forward (frame, prefix)
{
    var b = frame.buffers.current;
    // Should be checking if type of buffer is browser_buffer
    if (b.web_navigation.canGoForward)
    {
        var hist = b.web_navigation.sessionHistory;
        var idx = hist.index + prefix;
        if (idx >= hist.count) idx = hist.count-1;
        b.web_navigation.gotoIndex(idx);
    }
}
interactive("go-forward", go_forward, I.current_frame, I.p);


function stop_loading (frame)
{
    var b = frame.buffers.current;
    // Should be checking if type of buffer is browser_buffer
    b.web_navigation.stop (Components.interfaces.nsIWebNavigation.STOP_NETWORK);
}
interactive("stop-loading", stop_loading, I.current_frame);
interactive("keyboard-quit", stop_loading, I.current_frame);


function reload (frame)
{
    var b = frame.buffers.current;
    if (b instanceof browser_buffer)
    {
        b.web_navigation.reload(Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE);
    }
}
interactive("revert-buffer", reload, I.current_frame);


function scrollHorizComplete (frame, n)
{
    var w = frame.buffers.current.focused_window();
    w.scrollTo (n > 0 ? w.scrollMaxX : 0, w.scrollY);
}
interactive("beginning-of-line", scrollHorizComplete, I.current_frame, -1);
interactive("end-of-line", scrollHorizComplete, I.current_frame, 1);


interactive("make-frame-command", make_frame, I.bind(function(){return homepage;}));

function delete_frame (frame)
{
    frame.window.close();
}
interactive("delete-frame", delete_frame, I.current_frame);


function open_url_in (frame, prefix, url)
{
    var b = frame.buffers.current;
    if (prefix == 1 && b.is_browser_buffer) {
        // Open in current buffer
        // FIXME: check to ensure that current buffer is a browser_buffer
        frame.buffers.current.load_URI(url);
    } else if (prefix <= 4) {
        // Open in new buffer
        var buffer = new browser_buffer(frame);
        buffer.load_URI(url);
        frame.buffers.current = buffer;
    } else {
        // Open in new frame
      make_frame(url);
    }
}

interactive("follow-image", open_url_in, ['current_frame', 'p', 'image_url']);

interactive("open-url", open_url_in,
            I.current_frame, I.p,
            I.url_or_webjump($prompt = I.bind(open_url_in_prompt, I.p)));

interactive("find-url-other-frame", open_url_in,
            I.current_frame, 16,
            I.url_or_webjump($prompt = open_url_in_prompt(16)));

interactive("find-alternate-url", open_url_in,
            I.current_frame, I.p,
            I.url_or_webjump($prompt = I.bind(open_url_in_prompt, I.p),
                             $initial_value = I.current_url));

interactive("find-url", open_url_in,
            I.current_frame, 4,
            I.url_or_webjump($prompt = open_url_in_prompt(4)));

interactive("follow-link", open_url_in,
            I.current_frame, 1, I.focused_link_url);

interactive("follow-link-in-new-buffer", open_url_in,
            I.current_frame, 4, I.focused_link_url);

interactive("open-frameset-frame-in-current-buffer", open_url_in,
            I.current_frame, 1, I.current_frameset_frame_url);

interactive("open-frameset-frame-in-new-buffer", open_url_in,
            I.current_frame, 4, I.current_frameset_frame_url);

interactive("open-frameset-frame-in-new-frame", open_url_in,
            I.current_frame, 16, I.current_frameset_frame_url);

interactive("jsconsole", open_url_in,
            I.current_frame, I.p, "chrome://global/content/console.xul");


function switch_to_buffer (frame, buffer)
{
    if (buffer && !buffer.dead)
        frame.buffers.current = buffer;
}
interactive("switch-to-buffer", switch_to_buffer,
            I.current_frame,
            I.b($prompt = "Switch to buffer:",
                $default = I.bind(function(frame) {
                        return frame.buffers.get_buffer((frame.buffers.selected_index + 1) % frame.buffers.count);
                    }, I.current_frame)));

function kill_buffer (frame, buffer)
{
    if (buffer)
        frame.buffers.kill_buffer(buffer);
}
interactive("kill-buffer", kill_buffer,
            I.current_frame,
            I.b($prompt = "Kill buffer:"));

function copy_location (frame, s)
{
    writeToClipboard (s);
    frame.minibuffer.message ("Copied '"+s+"'");
}
interactive("copy-current-url", copy_location, I.current_frame, I.current_url);
interactive("copy-link-location", copy_location, I.current_frame, I.focused_link_url);
interactive("copy-image-location", copy_location, I.current_frame, I.image_url);
interactive("copy-frameset-frame-location", copy_location, I.current_frame, I.current_frameset_frame_url);


// Copy the contents of the X11 clipboard to ours. This is a cheap
// hack because it seems impossible to just always yank from the X11
// clipboard. So you have to manually pull it.
function yankToClipboard (frame)
{
    var str = readFromClipboard();
    var clipid = Components.interfaces.nsIClipboard;
    const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
        .getService(Components.interfaces.nsIClipboardHelper);
    gClipboardHelper.copyString(str);
    frame.message("Pulled '" + str + "'");
}
interactive("yank-to-clipboard", yankToClipboard, I.current_frame);


function browser_next (frame)
{
    frame.nextBrowser();
}
interactive("buffer-next", browser_next, I.current_frame);


function browser_prev (frame)
{
    frame.prevBrowser();
}
interactive("buffer-previous", browser_prev, I.current_frame);


function meta_x (frame, prefix, command)
{
    call_interactively({frame: frame, prefix_argument: prefix}, command);
}
interactive("execute-extended-command", meta_x,
            I.current_frame, I.P,
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
        buffer.frame.minibuffer.message ("goDoCommand ("+command+"): "+e);
    }
}
interactive("cmd_beginLine", goDoCommand, I.current_buffer(browser_buffer), 'cmd_beginLine');
interactive("cmd_copy", goDoCommand, I.current_buffer(browser_buffer), 'cmd_copy');
interactive("cmd_copyOrDelete", goDoCommand, I.current_buffer(browser_buffer), 'cmd_copyOrDelete');
interactive("cmd_cut", goDoCommand, I.current_buffer(browser_buffer), 'cmd_cut');
interactive("cmd_cutOrDelete", goDoCommand, I.current_buffer(browser_buffer), 'cmd_cutOrDelete');
interactive("cmd_deleteToBeginningOfLine", goDoCommand, I.current_buffer(browser_buffer), 'cmd_deleteToBeginningOfLine');
interactive("cmd_deleteToEndOfLine", goDoCommand, I.current_buffer(browser_buffer), 'cmd_deleteToEndOfLine');
interactive("cmd_endLine", goDoCommand, I.current_buffer(browser_buffer), 'cmd_endLine');
interactive("cmd_moveTop", goDoCommand, I.current_buffer(browser_buffer), 'cmd_moveTop');
interactive("cmd_moveBottom", goDoCommand, I.current_buffer(browser_buffer), 'cmd_moveBottom');
interactive("cmd_selectAll", goDoCommand, I.current_buffer(browser_buffer), 'cmd_selectAll');
interactive("cmd_selectBeginLine", goDoCommand, I.current_buffer(browser_buffer), 'cmd_selectBeginLine');
interactive("cmd_selectBottom", goDoCommand, I.current_buffer(browser_buffer), 'cmd_selectBottom');
interactive("cmd_selectEndLine", goDoCommand, I.current_buffer(browser_buffer), 'cmd_selectEndLine');
interactive("cmd_selectTop", goDoCommand, I.current_buffer(browser_buffer), 'cmd_selectTop');
interactive("cmd_scrollBeginLine", goDoCommand, I.current_buffer(browser_buffer), 'cmd_scrollBeginLine');
interactive("cmd_scrollEndLine", goDoCommand, I.current_buffer(browser_buffer), 'cmd_scrollEndLine');
interactive("cmd_scrollTop", goDoCommand, I.current_buffer(browser_buffer), 'cmd_scrollTop');
interactive("cmd_scrollBottom", goDoCommand, I.current_buffer(browser_buffer), 'cmd_scrollBottom');


function doCommandNTimes (buffer, n, cmd)
{
    for(i=0;i<n;i++)
        goDoCommand (buffer, cmd);
}
interactive("cmd_charNext", doCommandNTimes, I.current_buffer(browser_buffer), I.p, 'cmd_charNext');
interactive("cmd_charPrevious", doCommandNTimes, I.current_buffer(browser_buffer), I.p, 'cmd_charPrevious');
interactive("cmd_deleteCharBackward", doCommandNTimes, I.current_buffer(browser_buffer), I.p, 'cmd_deleteCharBackward');
interactive("cmd_deleteCharForward", doCommandNTimes, I.current_buffer(browser_buffer), I.p, 'cmd_deleteCharForward');
interactive("cmd_deleteWordBackward", doCommandNTimes, I.current_buffer(browser_buffer), I.p, 'cmd_deleteWordBackward');
interactive("cmd_deleteWordForward", doCommandNTimes, I.current_buffer(browser_buffer), I.p, 'cmd_deleteWordForward');
interactive("cmd_lineNext", doCommandNTimes, I.current_buffer(browser_buffer), I.p, 'cmd_lineNext');
interactive("cmd_linePrevious", doCommandNTimes, I.current_buffer(browser_buffer), I.p, 'cmd_linePrevious');
interactive("cmd_movePageDown", doCommandNTimes, I.current_buffer(browser_buffer), I.p, 'cmd_movePageDown');
interactive("cmd_movePageUp", doCommandNTimes, I.current_buffer(browser_buffer), I.p, 'cmd_movePageUp');
interactive("cmd_redo", doCommandNTimes, I.current_buffer(browser_buffer), I.p, 'cmd_redo');
interactive("cmd_selectCharNext", doCommandNTimes, I.current_buffer(browser_buffer), I.p, 'cmd_selectCharNext');
interactive("cmd_selectCharPrevious", doCommandNTimes, I.current_buffer(browser_buffer), I.p, 'cmd_selectCharPrevious');
interactive("cmd_selectLineNext", doCommandNTimes, I.current_buffer(browser_buffer), I.p, 'cmd_selectLineNext');
interactive("cmd_selectLinePrevious", doCommandNTimes, I.current_buffer(browser_buffer), I.p, 'cmd_selectLinePrevious');
interactive("cmd_selectPageDown", doCommandNTimes, I.current_buffer(browser_buffer), I.p, 'cmd_selectPageDown');
interactive("cmd_selectPageUp", doCommandNTimes, I.current_buffer(browser_buffer), I.p, 'cmd_selectPageUp');
interactive("cmd_selectWordNext", doCommandNTimes, I.current_buffer(browser_buffer), I.p, 'cmd_selectWordNext');
interactive("cmd_selectWordPrevious", doCommandNTimes, I.current_buffer(browser_buffer), I.p, 'cmd_selectWordPrevious');
interactive("cmd_undo", doCommandNTimes, I.current_buffer(browser_buffer), I.p, 'cmd_undo');
interactive("cmd_wordNext", doCommandNTimes, I.current_buffer(browser_buffer), I.p, 'cmd_wordNext');
interactive("cmd_wordPrevious", doCommandNTimes, I.current_buffer(browser_buffer), I.p, 'cmd_wordPrevious');
interactive("cmd_scrollPageUp", doCommandNTimes, I.current_buffer(browser_buffer), I.p, 'cmd_scrollPageUp');
interactive("cmd_scrollPageDown", doCommandNTimes, I.current_buffer(browser_buffer), I.p, 'cmd_scrollPageDown');
interactive("cmd_scrollLineUp", doCommandNTimes, I.current_buffer(browser_buffer), I.p, 'cmd_scrollLineUp');
interactive("cmd_scrollLineDown", doCommandNTimes, I.current_buffer(browser_buffer), I.p, 'cmd_scrollLineDown');
interactive("cmd_scrollLeft", doCommandNTimes, I.current_buffer(browser_buffer), I.p, 'cmd_scrollLeft');
interactive("cmd_scrollRight", doCommandNTimes, I.current_buffer(browser_buffer), I.p, 'cmd_scrollRight');
interactive("cmd_paste", doCommandNTimes, I.current_buffer(browser_buffer), I.p, 'cmd_paste');


function describe_bindings (frame)
{
    frame.getWebNavigation().loadURI("about:blank",
                                     Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE,
                                     null, null, null);
    // Oh man. this is SO gross.
    frame.setTimeout(genAllBindings, 0, frame);
}
interactive("describe-bindings", describe_bindings, I.current_frame);


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


interactive("source", function (fo) { load_rc (fo.path); }, [['f', function (a) { return "Source File: "; }, null, "source"]]);

function reinit (frame, fn)
{
  try {
    load_rc (fn);
    frame.message ("loaded \""+fn+"\"");
  } catch (e) {
    frame.message ("failed to load \""+fn+"\"");
  }
}

interactive ("reinit", reinit, I.current_frame, I.pref("conkeror.rcfile"));

function help_page (frame, prefix)
{
    open_url_in(frame, prefix, "chrome://conkeror/content/help.html");
}
interactive("help-page", help_page, I.current_frame, I.p);


function tutorial_page (frame, prefix)
{
    open_url_in(frame, prefix, "chrome://conkeror/content/tutorial.html");
}
interactive("help-with-tutorial", tutorial_page, I.current_frame, I.p);

function univ_arg_to_number(prefix)
{
    try {
    if (prefix == null)
        return 1;
    if (typeof prefix == "object")
        return prefix[0];
    else if (typeof prefix == "number")
        return prefix;

    } catch(e) {alert("univ: " + e);}
    return null;
}

function go_up (b, prefix)
{
    var loc = b.display_URI_string;
    var up = loc.replace (/(.*\/)[^\/]+\/?$/, "$1");
    open_url_in (frame, prefix, up);
}
interactive("go-up", go_up, I.current_buffer(browser_buffer), I.p);


// XXX: this whole thing is really hacky.  what *should* happen is that
//      list-buffers would create a special buffer that would be a
//      chrome-level xul element, rather than some web page in a browser.
//      Note how the links use addEventListener instead of onclick, as a
//      normal link would.  I did not figure out how to use onclick because of
//      problems creating a closure around the buffer object.  (onclick's
//      value is a string, while addEventListener's is a function.)
//
//      Also we use an A element here even though we are not dealing with a
//      proper hyperlink, just to get the side-effect of numberedlinks.
//
function list_buffers () {
    function make_buffer_button (buffer)
    {
        var button = window.content.document.createElement ('a');
        button.setAttribute ('href', '#');
        button.setAttribute ('onmouseover', 'this.style.cursor = "pointer";');
        button.setAttribute ('onmouseout', 'this.style.cursor = "auto";');
        button.addEventListener ('click',
                                 function () { setCurrentBrowser (buffer); },
                                 false);
        var text = window.content.document.createTextNode (buffer.webNavigation.currentURI.spec);
        button.appendChild (text);
        return button;
    }

    var window = this;

    function list_all_buffers ()
    {
        var doc = window.content.document;
        var browsers = window.getBrowser().mBrowsers;

        var buffer_list = doc.createElement ('ul');
        var buffer_list_item = null;

        for (var i = 0; i < browsers.length; i++) {
            buffer_list_item = doc.createElement ('li');
            buffer_list_item.appendChild (make_buffer_button (browsers[i]));
            buffer_list.appendChild (buffer_list_item);
        }
        doc.body.appendChild (buffer_list);
    }

    window.getWebNavigation().loadURI("about:blank", 
                               Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE,
                               null, null, null);
    window.setTimeout(list_all_buffers, 0);
}
interactive("list-buffers", list_buffers, []);


function text_reset (b)
{
    b.markup_document_viewer.textZoom = 1.0;
    // We need to update the floaters
    // numberedlinks_resize(window._content);
}
interactive("text-reset", text_reset, I.current_buffer(browser_buffer));

function text_reduce (b, prefix)
{
    conkeror.myblah = b;
    b.markup_document_viewer.textZoom -= 0.25 * prefix;
    // We need to update the floaters
    // numberedlinks_resize(window._content);
}
interactive("text-reduce", text_reduce, I.current_buffer(browser_buffer), I.p);

function text_enlarge (b, prefix)
{
    b.markup_document_viewer.textZoom += 0.25 * prefix;
}
interactive("text-enlarge", text_enlarge, I.current_buffer(browser_buffer), I.p);

function eval_expression (frame, s)
{
    eval.call(frame, s);
}
interactive("eval-expression", eval_expression,
            I.current_frame, I.s($prompt = "Eval:", $history = "eval-expression"));


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

// Enable Vi keybindings
function use_vi_keys()
{
    conkeror.initViKmaps();
}
interactive("use-vi-keys", use_vi_keys);


// Enable Emacs keybindings
function use_emacs_keys()
{
    conkeror.initKmaps();
}
interactive("use-emacs-keys", use_emacs_keys);

function show_extension_manager () {
    return conkeror.window_watcher.openWindow (
        null,
        "chrome://mozapps/content/extensions/extensions.xul?type=extensions",
        "ExtensionsWindow",
        "resizable=yes,dialog=no",
        null);
}
interactive("extensions", show_extension_manager);


function print_buffer (frame)
{
    frame.window.content.print();
}
interactive("print-buffer", print_buffer, I.current_frame);


function view_source (frame, win)
{
    if (conkeror.view_source_external_editor || conkeror.view_source_function)
    {
        download_for_external_program
            (null, win.document, null,
             function (file, is_temp_file) {
                 if (conkeror.view_source_external_editor)
                 {
                     var editorFile = Components.classes["@mozilla.org/file/local;1"]
                         .createInstance(Components.interfaces.nsILocalFile);
                     editorFile.initWithPath(conkeror.view_source_external_editor);
                     var process = Components.classes['@mozilla.org/process/util;1']
                         .createInstance(Components.interfaces.nsIProcess);
                     process.init(editorFile);
                     process.run(false, [file.path], 1);
                 } else
                 {
                     conkeror.view_source_function(file, is_temp_file);
                 }
             });
        return;
    }
    var url_s = win.location.href;
    if (url_s.substring (0,12) != "view-source:") {
        try {
            frame.buffers.current.load_URI("view-source:"+url_s);
        } catch(e) { dumpln (e); }
    } else {
        frame.minibuffer.message ("already viewing source");
    }
}
interactive("view-source", view_source, I.current_frame, I.current_buffer_window);
interactive("frameset-view-source", view_source, I.current_frame, I.current_frameset_frame);


function view_partial_source (frame, charset, selection) {
    if (charset) { charset = "charset=" + charset; }
    frame.window.openDialog("chrome://global/content/viewPartialSource.xul",
                            "_blank", "scrollbars,resizable,chrome,dialog=no",
                            null, charset, selection, 'selection');
}
interactive ('view-partial-source', view_partial_source, I.current_frame, I.content_charset, I.content_selection);


function  view_mathml_source (frame, charset, target) {
    if (charset) { charset = "charset=" + charset; }
    frame.window.openDialog("chrome://global/content/viewPartialSource.xul",
                            "_blank", "scrollbars,resizable,chrome,dialog=no",
                            null, charset, target, 'mathml');
}
interactive ('view-mathml-source', view_mathml_source, I.current_frame, I.content_charset, I.mathml_node);


function show_charcode_mapping_tool()
{
    make_chrome_frame("chrome://conkeror/content/generate_mapping_table.html");
}

interactive ("charcode-mapping-tool", show_charcode_mapping_tool);
