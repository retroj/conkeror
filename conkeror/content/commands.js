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


function quit ()
{
    conkeror.run_hooks (conkeror.quit_hook);
    var appStartup = Components.classes["@mozilla.org/toolkit/app-startup;1"]
        .getService(Components.interfaces.nsIAppStartup);
    appStartup.quit(appStartup.eAttemptQuit);
}
interactive("quit", quit, []);


function show_conkeror_version ()
{
    this.message (conkeror.version);
}
interactive ("conkeror-version", show_conkeror_version, []);


function unfocus()
{
    if (this.document.commandDispatcher.focusedElement)
        this.document.commandDispatcher.focusedElement.blur();
    else if (this.document.commandDispatcher.focusedWindow)
    {
        // null op
    }
    else
        this.window.content.focus();
}
interactive("unfocus", unfocus, []);


function goBack(prefix)
{
    if (this.getWebNavigation().canGoBack) {
        var hist = this.getWebNavigation().sessionHistory;
        var idx = hist.index - prefix;
        if (idx < 0) idx = 0;
        this.getWebNavigation().gotoIndex(idx);
    }
}
interactive("go-back", goBack, ["p"]);


function goForward(prefix)
{
    if (this.getWebNavigation().canGoForward) {
        var hist = this.getWebNavigation().sessionHistory;
        var idx = hist.index + prefix;
        if (idx >= hist.count) idx = hist.count-1;
        this.getWebNavigation().gotoIndex(idx);
    }
}
interactive("go-forward", goForward, ["p"]);


function stopLoading()
{
    this.getWebNavigation().stop (Components.interfaces.nsIWebNavigation.STOP_NETWORK);
}
interactive("stop-loading", stopLoading, []);
interactive("keyboard-quit", stopLoading, []);


function reload ()
{
    return this.getBrowser().webNavigation.reload (Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE);
}
interactive("revert-buffer", reload, []);


var notification_timer = null; // XXX: this should be a window variable.

function next_frameset_frame (prefix) {
    function notify (x, y, text) {
        var notification = this.document.getElementById ("frameset-notification");
        var notification_label = this.document.getElementById ("frameset-notification-label");
        notification_label.value = text;
        notification.showPopup (this.document.getElementById ("content"),
                                x, y, "popup");
        this.clearTimeout (notification_timer);
        notification_timer = this.setTimeout (
            function () { notification.hidePopup (); },
            1000);
    }

    function find_frames_r (doc) {
        var frames = [];
        var fr = doc.getElementsByTagName ("FRAME");
        if (fr.length == 0) { return []; }
        for (var i = 0; i < fr.length; i++) {
            frames.push (fr[i]);
            frames = frames.concat (find_frames_r (fr[i].contentDocument));
        }
        return frames;
    }

    var frames = find_frames_r (this.window.content.document);
    if (frames.length == 0)
    {
        this.message ("no other frameset frame");
        return;
    }

    var w = this.document.commandDispatcher.focusedWindow;

    var next = 0;

    for (var i = 0; i < frames.length; i++) {
        if (w.document == frames[i].contentDocument) {
            next = (i + prefix) % frames.length;
            // the % operator is actually remainder in javascript, so we have
            // to watch for negative results.
            if (next < 0)
                next += frames.length;
            break;
        }
    }
    frames[next].scrollIntoView (false);
    frames[next].contentWindow.focus();

    var box = frames[next].ownerDocument.getBoxObjectFor (frames[next]);

    notify.call (this, box.screenX, box.screenY,
                 "frameset frame "+next);
}
interactive("next-frameset-frame", next_frameset_frame, ['p']);



function next_iframe (prefix) {
    function notify (x, y, text) {
        var notification = this.document.getElementById ("frameset-notification");
        var notification_label = this.document.getElementById ("frameset-notification-label");
        notification_label.value = text;
        notification.showPopup (this.document.getElementById ("content"),
                                x, y, "popup");
        this.clearTimeout (notification_timer);
        notification_timer = this.setTimeout (
            function () { notification.hidePopup (); },
            1000);
    }

    var frames = this.window.content.document.getElementsByTagName ("IFRAME");
    if (frames.length == 0)
    {
        this.message ("no other iframe");
        return;
    }

    var current = this.document.commandDispatcher.focusedWindow;

    var pnext = 0;

    for (var i = 0; i < frames.length; i++) {
        if (current.document == frames[i].contentDocument) {
            pnext = (i + prefix) % frames.length;
            // the % operator is actually remainder in javascript, so we have
            // to watch for negative results.
            if (pnext < 0)
                pnext += frames.length;
            break;
        }
    }

    var next = pnext;
    frames[next].contentWindow.focus();

    while (this.document.commandDispatcher.focusedWindow == current)
    {
        next = (next + (prefix < 0 ? -1 : 1)) % frames.length;
        if (next < 0)
            next += frames.length;

        if (next == pnext) {
            this.message ("no other iframe visible");
            return;
        }

        frames[next].contentWindow.focus();
    }

    var box = this.window.content.document.getBoxObjectFor (frames[next]);
    frames[next].scrollIntoView (false);

    notify.call (this, box.screenX, box.screenY,
                 "iframe "+next);
}
interactive("next-iframe", next_iframe, ['p']);


function scrollHorizComplete(n)
{
    var w = this.document.commandDispatcher.focusedWindow;
    w.scrollTo (n > 0 ? w.scrollMaxX : 0, w.scrollY);
}
interactive("beginning-of-line", scrollHorizComplete, [['value', -1]]);
interactive("end-of-line", scrollHorizComplete, [['value', 1]]);


function make_frame_command ()
{
    make_frame (homepage);
}
interactive("make-frame-command", make_frame_command, []);


function delete_frame()
{
    this.window.close();
}
interactive("delete-frame", delete_frame, []);


// XXX: move open_url_in_prompt to utils.js?
function open_url_in_prompt(prefix, str)
{
    if (str == null)
        str = "Find URL";
    if (prefix == 1) {
        return str + ":";
    } else if (prefix <= 4) {
        return str + " in new buffer:";
    } else {
        return str + " in new frame:";
    }
}

function open_url_in (prefix, url)
{
    if (prefix == 1) {
        // Open in current buffer
        this.getWebNavigation()
            .loadURI (url, Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null);
        return this.getBrowser();
    } else if (prefix <= 4) {
        // Open in new buffer
        return find_url_new_buffer (url); // XXX: this will get the
                                          // active frame, not
                                          // necessarily the frame
                                          // from which the command
                                          // was run.
    } else {
        // Open in new frame
      make_frame(url);
      return 1;
    }
}

interactive("follow-image", open_url_in, ['p', 'image_url']);

interactive("open-url", open_url_in,
            ['p',
             ['url_or_webjump',
              function (args) { return open_url_in_prompt (args[0]); },// prompt
              null, // initval
              "url", // history
              function (args) {
                  var templs =[];
                  for (var x in gWebJumpLocations)
                      templs.push([x,x]);
                  return templs; }]]); // completions

interactive("find-url-other-frame", open_url_in,
            [['value', 16],
             ['url_or_webjump',
              function (args) { return open_url_in_prompt (args[0]); },// prompt
              null, // initval
              "url", // history
              function (args) {
                  var templs =[];
                  for (var x in gWebJumpLocations)
                      templs.push([x,x]);
                  return templs; }]]);

interactive("find-alternate-url", open_url_in,
            ['p',
             ['url_or_webjump',
              function (args) { return open_url_in_prompt (args[0]); },// prompt
              function (args) { return this.getWebNavigation().currentURI.spec; }, // initval
              "url", // history
              function (args) {
                  var templs =[];
                  for (var x in gWebJumpLocations)
                      templs.push([x,x]);
                  return templs; }]]);

interactive("find-url", open_url_in,
            [['value', 4],
             ['url_or_webjump',
              function (args) { return open_url_in_prompt (args[0]); },// prompt
              null, // initval
              "url", // history
              function (args) {
                  var templs =[];
                  for (var x in gWebJumpLocations)
                      templs.push([x,x]);
                  return templs; }]]);

interactive("follow-link", open_url_in,
            [['value', 1], 'focused_link_url']);

interactive("follow-link-in-new-buffer", open_url_in,
            [['value', 4], 'focused_link_url']);

interactive("open-frameset-frame-in-current-buffer", open_url_in,
            [["value", 1],"current_frameset_frame_url"]);

interactive("open-frameset-frame-in-new-buffer", open_url_in,
            [["value", 4],"current_frameset_frame_url"]);

interactive("open-frameset-frame-in-new-frame", open_url_in,
            [["value", 16],"current_frameset_frame_url"]);

interactive("jsconsole", open_url_in,
            ["p", ["value", "chrome://global/content/console.xul"]]);


function switch_to_buffer (buffer)
{
    this.getBrowser().setCurrentBrowser(buffer);
}
interactive("switch-to-buffer", switch_to_buffer,
            [["b", function (a) { return "Switch to buffer: "; },
              function (a) { return this.getBrowser().lastBrowser().webNavigation.currentURI.spec; } ]]);


function kill_buffer (buffer)
{
    this.getBrowser().killBrowser(buffer);
}
interactive("kill-buffer", kill_buffer, [["b", function (a) { return "Kill buffer: "; }]]);


function copy_location (s)
{
    writeToClipboard (s);
    this.message ("Copied '"+s+"'");
}
interactive("copy-current-url", copy_location, ['current_url']);
interactive("copy-link-location", copy_location, ['focused_link_url']);
interactive("copy-image-location", copy_location, ['image_url']);
interactive("copy-frameset-frame-location", copy_location, ['current_frameset_frame_url']);


// Copy the contents of the X11 clipboard to ours. This is a cheap
// hack because it seems impossible to just always yank from the X11
// clipboard. So you have to manually pull it.
function yankToClipboard()
{
    var str = readFromClipboard();
    var clipid = Components.interfaces.nsIClipboard;
    const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
        .getService(Components.interfaces.nsIClipboardHelper);
    gClipboardHelper.copyString(str);
    this.message("Pulled '" + str + "'");
}
interactive("yank-to-clipboard", yankToClipboard, []);


function isearch_forward()
{
  var window = this;
    if (window.isearch_active) {
        if (window.gFindState.length == 1) {
            window.minibuffer.input.value = window.gLastSearch;
            find(window, window.gLastSearch, true, lastFindState(window)["point"]);
        } else {
          find(window, lastFindState(window)["search-str"], true, lastFindState(window)["range"]);
        }
        resumeFindState(window, lastFindState(window));
    } else {
        focusFindBar(window);
        window.readFromMiniBuffer('I-Search:');
    }
}
interactive("isearch-forward", isearch_forward, []);


function isearch_backward()
{

  var window = this;
    if (window.isearch_active) {
        if (window.gFindState.length == 1) {
            window.minibuffer.input.value = window.gLastSearch;
            find(window, window.gLastSearch, false, lastFindState(window)["point"]);
        } else {
          find(window, lastFindState(window)["search-str"], false, lastFindState(window)["range"]);
        }
        resumeFindState(window, lastFindState(window));
    } else {
        focusFindBarBW(window);
        window.readFromMiniBuffer('I-Search backward:');
    }
}
interactive("isearch-backward", isearch_backward, []);


function isearch_backspace ()
{
  var window = this;
    if (window.gFindState.length > 1) {
        var state = window.gFindState.pop();
        resumeFindState(window, lastFindState(window));
    }
}
interactive("isearch-backspace", isearch_backspace, []);


function isearch_abort ()
{
  var window = this;
    closeFindBar(window);
    window.gWin.scrollTo(window.gFindState[0]["screenx"], window.gFindState[0]["screeny"]);
    clearSelection(window);
    clearHighlight(window);
}
interactive("isearch-abort", isearch_abort, []);


function isearch_add_character (event)
{
  var window = this;
    var str;
    str = lastFindState(window)["search-str"];
    str += String.fromCharCode(event.charCode);
    find(window, str, lastFindState(window)["direction"], lastFindState(window)["point"]);
    resumeFindState(window, lastFindState(window));
}
interactive("isearch-add-character", isearch_add_character, ["e"]);


function isearch_done ()
{
  var window = this;
    closeFindBar(window);
    window.gLastSearch = lastFindState(window)["search-str"];
    clearHighlight(window);
    focusLink(window);
}
interactive("isearch-done", isearch_done, []);


function browser_next()
{
    this.getBrowser().nextBrowser();
}
interactive("buffer-next", browser_next, []);


function browser_prev()
{
    this.getBrowser().prevBrowser();
}
interactive("buffer-previous", browser_prev, []);


function meta_x(prefix)
{
    // setup the prefix arg which will be reset in call_interactively
    gPrefixArg = prefix;
    var prompt = "";
    if (gPrefixArg == null)
        prompt = "";
    else if (typeof gPrefixArg == "object")
        prompt = gPrefixArg[0] == 4 ? "C-u " : gPrefixArg[0] + " ";
    else
        prompt = gPrefixArg + " ";

    var matches = [];
    for (i in conkeror.commands)
        matches.push([conkeror.commands[i][0],conkeror.commands[i][0]]);

    this.readFromMiniBuffer (prompt + "M-x", null, "commands", matches, false, null,
                             function(c) { call_interactively.call (this, c); }, this.abort);
}
interactive("execute-extended-command", meta_x, ["P"]);


/// built in commands
// see: http://www.xulplanet.com/tutorials/xultu/commandupdate.html
function goDoCommand (command)
{
    try {
      /* If only the top-level chrome window has focus, then these
         commands won't work.  Fix this problem by setting focus to
         the content window. */
      if (this.document.commandDispatcher.focusedWindow == this)
        this.content.focus();
        var controller = this.top.document.commandDispatcher.getControllerForCommand (command);
        if (controller && controller.isCommandEnabled (command))
            controller.doCommand (command);
    } catch (e) {
        this.message ("goDoCommand ("+command+"): "+e);
    }
}
interactive("cmd_beginLine", goDoCommand, [['value', 'cmd_beginLine']]);
interactive("cmd_copy", goDoCommand, [['value', 'cmd_copy']]);
interactive("cmd_copyOrDelete", goDoCommand, [['value', 'cmd_copyOrDelete']]);
interactive("cmd_cut", goDoCommand, [['value', 'cmd_cut']]);
interactive("cmd_cutOrDelete", goDoCommand, [['value', 'cmd_cutOrDelete']]);
interactive("cmd_deleteToBeginningOfLine", goDoCommand, [['value', 'cmd_deleteToBeginningOfLine']]);
interactive("cmd_deleteToEndOfLine", goDoCommand, [['value', 'cmd_deleteToEndOfLine']]);
interactive("cmd_endLine", goDoCommand, [['value', 'cmd_endLine']]);
interactive("cmd_moveTop", goDoCommand, [['value', 'cmd_moveTop']]);
interactive("cmd_moveBottom", goDoCommand, [['value', 'cmd_moveBottom']]);
interactive("cmd_selectAll", goDoCommand, [['value', 'cmd_selectAll']]);
interactive("cmd_selectBeginLine", goDoCommand, [['value', 'cmd_selectBeginLine']]);
interactive("cmd_selectBottom", goDoCommand, [['value', 'cmd_selectBottom']]);
interactive("cmd_selectEndLine", goDoCommand, [['value', 'cmd_selectEndLine']]);
interactive("cmd_selectTop", goDoCommand, [['value', 'cmd_selectTop']]);
interactive("cmd_scrollBeginLine", goDoCommand, [['value', 'cmd_scrollBeginLine']]);
interactive("cmd_scrollEndLine", goDoCommand, [['value', 'cmd_scrollEndLine']]);
function cmd_scrollTop() { set_mark_command.call (this); goDoCommand.call (this, "cmd_scrollTop"); }
interactive("cmd_scrollTop", cmd_scrollTop, []);
function cmd_scrollBottom() { set_mark_command.call (this); goDoCommand.call (this, "cmd_scrollBottom"); }
interactive("cmd_scrollBottom", cmd_scrollBottom, []);



function doCommandNTimes(n,cmd)
{
    for(i=0;i<n;i++)
        goDoCommand.call (this, cmd);
}
interactive("cmd_charNext", doCommandNTimes, ["p", ['value', 'cmd_charNext']]);
interactive("cmd_charPrevious", doCommandNTimes, ["p", ['value', 'cmd_charPrevious']]);
interactive("cmd_deleteCharBackward", doCommandNTimes, ["p", ['value','cmd_deleteCharBackward']]);
interactive("cmd_deleteCharForward", doCommandNTimes, ["p", ['value', 'cmd_deleteCharForward']]);
interactive("cmd_deleteWordBackward", doCommandNTimes, ["p", ['value', 'cmd_deleteWordBackward']]);
interactive("cmd_deleteWordForward", doCommandNTimes, ["p", ['value', 'cmd_deleteWordForward']]);
interactive("cmd_lineNext", doCommandNTimes, ["p", ['value', 'cmd_lineNext']]);
interactive("cmd_linePrevious", doCommandNTimes, ["p", ['value', 'cmd_linePrevious']]);
interactive("cmd_movePageDown", doCommandNTimes, ["p", ['value', 'cmd_movePageDown']]);
interactive("cmd_movePageUp", doCommandNTimes, ["p", ['value', 'cmd_movePageUp']]);
interactive("cmd_redo", doCommandNTimes, ["p", ['value', 'cmd_redo']]);
interactive("cmd_selectCharNext", doCommandNTimes, ["p", ['value', 'cmd_selectCharNext']]);
interactive("cmd_selectCharPrevious", doCommandNTimes, ["p", ['value', 'cmd_selectCharPrevious']]);
interactive("cmd_selectLineNext", doCommandNTimes, ["p", ['value', 'cmd_selectLineNext']]);
interactive("cmd_selectLinePrevious", doCommandNTimes, ["p", ['value', 'cmd_selectLinePrevious']]);
interactive("cmd_selectPageDown", doCommandNTimes, ["p", ['value', 'cmd_selectPageDown']]);
interactive("cmd_selectPageUp", doCommandNTimes, ["p", ['value', 'cmd_selectPageUp']]);
interactive("cmd_selectWordNext", doCommandNTimes, ["p", ['value', 'cmd_selectWordNext']]);
interactive("cmd_selectWordPrevious", doCommandNTimes, ["p", ['value', 'cmd_selectWordPrevious']]);
interactive("cmd_undo", doCommandNTimes, ["p", ['value', 'cmd_undo']]);
interactive("cmd_wordNext", doCommandNTimes, ["p", ['value', 'cmd_wordNext']]);
interactive("cmd_wordPrevious", doCommandNTimes, ["p", ['value', 'cmd_wordPrevious']]);
interactive("cmd_scrollPageUp", doCommandNTimes, ["p", ['value', 'cmd_scrollPageUp']]);
interactive("cmd_scrollPageDown", doCommandNTimes, ["p", ['value', 'cmd_scrollPageDown']]);
interactive("cmd_scrollLineUp", doCommandNTimes, ["p", ['value', 'cmd_scrollLineUp']]);
interactive("cmd_scrollLineDown", doCommandNTimes, ["p", ['value', 'cmd_scrollLineDown']]);
interactive("cmd_scrollLeft", doCommandNTimes, ["p", ['value', 'cmd_scrollLeft']]);
interactive("cmd_scrollRight", doCommandNTimes, ["p", ['value', 'cmd_scrollRight']]);
interactive("cmd_paste", doCommandNTimes, ["p", ['value', 'cmd_paste']]);


//// web jump stuff

var gWebJumpLocations = [];
function add_webjump(key, loc)
{
    gWebJumpLocations[key] = loc;
}

function add_delicious_webjumps (username)
{
    add_webjump("delicious", " http://del.icio.us/" + username);
    add_webjump("adelicious", "javascript:location.href='http://del.icio.us/" + username + "?v=2&url='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title);");
    add_webjump("sdelicious", " http://del.icio.us/search/?search=%s");
    add_webjump("sadelicious", " http://del.icio.us/search/all?search=%s");
}

// Some built in web jumps
function init_webjumps()
{
    add_webjump("conkerorwiki","http://dev.technomancy.us/conkeror/index.cgi/search?q=%s&wiki=on&changeset=on&ticket=on");
    add_webjump("google",     "http://www.google.com/search?q=%s");
    add_webjump("lucky",      "http://www.google.com/search?q=%s&btnI=I'm Feeling Lucky");
    add_webjump("maps",       "http://maps.google.com/?q=%s");
    add_webjump("scholar",    "http://scholar.google.com/scholar?q=%s");
    add_webjump("clusty",     "http://www.clusty.com/search?query=%s");
    add_webjump("wikipedia",  "http://en.wikipedia.org/wiki/Special:Search?search=%s");
    add_webjump("slang",      "http://www.urbandictionary.com/define.php?term=%s");
    add_webjump("dictionary", "http://dictionary.reference.com/search?q=%s");
    add_webjump("xulplanet",  "http://www.google.com/custom?q=%s&cof=S%3A"+
                "http%3A%2F%2Fwww.xulplanet.com%3BAH%3Aleft%3BLH%3A65%3BLC"+
                "%3A4682B4%3BL%3Ahttp%3A%2F%2Fwww.xulplanet.com%2Fimages%2F"+
                "xulplanet.png%3BALC%3Ablue%3BLW%3A215%3BAWFID%3A0979f384d5"+
                "181409%3B&domains=xulplanet.com&sitesearch=xulplanet.com&sa=Go");
    add_webjump("image",      "http://images.google.com/images?q=%s");
    add_webjump("bugzilla",   "https://bugzilla.mozilla.org/show_bug.cgi?id=%s");
    add_webjump("clhs",       "http://www.xach.com/clhs?q=%s");
    add_webjump("emacswiki",  "http://www.emacswiki.org/cgi-bin/wiki?search=%s");
    add_webjump("cliki",      "http://www.cliki.net/admin/search?words=%s");
    add_webjump("ratpoisonwiki", "http://ratpoison.elektrubadur.se/?search=%s");
    add_webjump("stumpwmwiki", "http://stumpwm.elektrubadur.se/?search=%s");
    add_webjump("savannah", "http://savannah.gnu.org/search/?words=%s&type_of_search=soft&Search=Search&exact=1");
    add_webjump("sourceforge", "http://sourceforge.net/search/?words=%s");
    add_webjump("freshmeat", "http://freshmeat.net/search/?q=%s");
    add_webjump("slashdot", "http://slashdot.org/search.pl?query=%s");
    add_webjump("kuro5hin", "http://www.kuro5hin.org/?op=search&string=%s");
    add_webjump("sheldonbrown",     "http://www.google.com/search?q=site:sheldonbrown.com %s");
}

function webjump_build_url(template, subs)
{
    var b = template.indexOf('%s');
    var a = b + 2;
    // Just return the same string if it doesn't contain a %s
    if (b == -1)
        return template;
    else
        return template.substr(0,b) + subs + template.substring(a);
}

function get_partial_match(hash, part)
{
    var matches = [];
    for (x in hash) {
        if (part == x.substr(0, part.length))
            matches.push(x);
    }
    if (matches.length == 1)
        return matches[0];
    else
        return null;
}

function getWebJump(value)
{
    try {
    var start = value.indexOf(' ');
    var jump;
    if (start == -1)
        jump = gWebJumpLocations[value];
    else
        jump = gWebJumpLocations[value.substr(0,start)];
    // Try to find a web jump match
    if (!jump) {
        var match = get_partial_match(gWebJumpLocations, value.substr(0,start));
        if (match)
            jump = gWebJumpLocations[match];
        else
            return null;
    }
    return webjump_build_url(jump, value.substring(start + 1));
    } catch(e) {alert(e); return null;}
}

function doWebJump(prefix, match, value)
{
    var url = getWebJump(value);
    open_url_in(prefix,url);
}

function web_jump(prefix)
{
    var templs =[];
    for (var x in gWebJumpLocations)
        templs.push([x,x]);
    readFromMiniBuffer (open_url_in_prompt(prefix, "Web Jump"), null, "webjump", templs, 
                        true, null, function(m,v) {doWebJump(prefix,m,v);});
}
interactive("web-jump", web_jump, ["p"]);


function get_url_or_webjump(input)
{
    var url = getWebJump(input);

    if (url) {
        return url;
    } else {
        return input;
    }
}

function describe_bindings()
{
    this.getWebNavigation().loadURI("about:blank", 
                               Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE,
                               null, null, null);
    // Oh man. this is SO gross.
    this.setTimeout(genAllBindings, 0, this);
}
interactive("describe-bindings", describe_bindings, []);


/// Hacky mark stuff
/// IDEA: Maybe this should be done with a selection?

function set_mark_command()
{
    var w = this.document.commandDispatcher.focusedWindow;
    if (!w)
        return;
    w.__conkeror__markX = w.scrollX;
    w.__conkeror__markY = w.scrollY;
    this.message("Mark set");
}
interactive("set-mark-command", set_mark_command, []);


function exchange_point_and_mark()
{
    try {
    var w = document.commandDispatcher.focusedWindow;
    if (!w)
        return;
    var x = w.__conkeror__markX || 0;
    var y = w.__conkeror__markY || 0;
    set_mark_command();
    w.scrollTo(x, y);
    } catch(e) {alert(e);}
}
interactive("exchange-point-and-mark", exchange_point_and_mark, []);


function get_link_text()
{
    var e = document.commandDispatcher.focusedElement;   
    if (e && e.getAttribute("href")) {
        return e.getAttribute("href");
    }
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

function reinit (fn)
{
  try {
    load_rc (fn);
    this.message ("loaded \""+fn+"\"");
  } catch (e) {
    this.message ("failed to load \""+fn+"\"");
  }
}

interactive ("reinit", reinit, [['pref', 'conkeror.rcfile']]);

function help_page ()
{
    this.getWebNavigation().loadURI ("chrome://conkeror/content/help.html", 
                                     Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE,
                                     null, null, null);
}
interactive("help-page", help_page, []);


function tutorial_page ()
{
    this.getWebNavigation().loadURI("chrome://conkeror/content/tutorial.html", 
                                    Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE,
                                    null, null, null);
}
interactive("help-with-tutorial", tutorial_page, []);


function redraw()
{
    message("FIXME: unimplemented");
}
interactive("redraw", redraw, []);


// universal argument code

function universal_digit(prefix)
{
    //XXX RetroJ: we should use an interactive code like "e" instead of
    //            gCommandLastEvent
    var ch = this.gCommandLastEvent.charCode;
    var digit = ch - 48;
    // Array means they typed only C-u's. Otherwise, add another digit
    // to our accumulating prefix arg.
    if (typeof prefix == "object") {
        if (prefix[0] < 0)
            this.gPrefixArg = 0 - digit;
        else
            this.gPrefixArg = digit;
    } else {
        this.gPrefixArg = prefix * 10 + digit;
    }
}
interactive("universal-digit", universal_digit,["P"]);


function universal_negate ()
{
    if (typeof gPrefixArg == "object")
        this.gPrefixArg[0] = 0 - this.gPrefixArg[0];
    else
        this.gPrefixArg = 0 - this.gPrefixArg;
}
interactive("universal-negate", universal_negate,[]);


function universal_argument()
{
    this.gPrefixArg = [4];
    /* this refers to the window */
    this.overlay_kmap = universal_kmap;
}
interactive("universal-argument", universal_argument,[]);


function universal_argument_more(prefix)
{
    if (typeof prefix == "object")
        this.gPrefixArg = [prefix[0] * 4];
    else {
        // terminate the prefix arg
        ///XXX: is this reachable?
        this.gPrefixArg = prefix;
        this.overlay_kmap = null;
    }
}
interactive("universal-argument-more", universal_argument_more,["P"]);


function univ_arg_to_number(prefix)
{
    try {
    if (prefix == null)
        return 1;
    if (typeof prefix == "object") 
        return prefix[0];
    else if (typeof prefix == "number")
        return prefix;

    } catch(e) {alert("univ: " + e); return null;}
}

function go_up (prefix)
{
    var loc = this.getWebNavigation().currentURI.spec;
    var up = loc.replace (/(.*\/)[^\/]+\/?$/, "$1");
    open_url_in.call (this, prefix, up);
}
interactive("go-up", go_up, ["p"]);


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
                                 function () { getBrowser().setCurrentBrowser (buffer); }, 
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


function text_reset() 
{
    try {
        this.getBrowser().markupDocumentViewer.textZoom = 1.0;
        // We need to update the floaters
        // numberedlinks_resize(window._content);
    } catch(e) { alert(e); }
}
interactive("text-reset", text_reset, []);


function text_reduce(prefix) 
{
    try {
        this.getBrowser().markupDocumentViewer.textZoom -= 0.25 * prefix;
        // We need to update the floaters
        // numberedlinks_resize(window._content);
    } catch(e) { alert(e); }
}
interactive("text-reduce", text_reduce, ["p"]);


function text_enlarge(prefix) 
{
    try {
        this.getBrowser().markupDocumentViewer.textZoom += 0.25 * prefix;
        // We need to update the floaters
        // numberedlinks_resize(window._content);
    } catch(e) { alert(e); }
}
interactive("text-enlarge", text_enlarge, ["p"]);


function eval_expression()
{
    this.readFromMiniBuffer ("Eval:", null, "eval-expression", null, null, null, eval);
}
interactive("eval-expression", eval_expression, []);


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
interactive("toggle-eod-space", toggle_eod_space, []);


// Enable Vi keybindings
function use_vi_keys()
{
    conkeror.initViKmaps();
}
interactive("use-vi-keys", use_vi_keys, []);


// Enable Emacs keybindings
function use_emacs_keys()
{
    conkeror.initKmaps();
}
interactive("use-emacs-keys", use_emacs_keys, []);


function mode_line_mode(arg)
{
    var win = document.commandDispatcher.focusedWindow;
    if (typeof arg == "number")
        gModeLineMode = (arg > 0)? true: false;
    else if (typeof arg == "object")
        gModeLineMode = !gModeLineMode;

    if (win) {
        updateModeline();
    }
}
interactive("mode-line-mode", mode_line_mode, ["P"]);

interactive("extensions", conkeror.show_extension_manager, []);

function print_buffer()
{
    this.window.content.print();
}
interactive("print-buffer", print_buffer, []);


function view_source (url_s)
{
    if (url_s.substring (0,12) != "view-source:") {
        try {
            var loadFlags = Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE;
            this.getWebNavigation().loadURI("view-source:"+url_s, loadFlags, null, null, null);
        } catch(e) { dumpln (e); }
    } else {
        this.message ("already viewing source");
    }
}
interactive("view-source", view_source, ['current_url']);


function view_partial_source (charset, selection) {
    if (charset) { charset = "charset=" + charset; }
    this.window.openDialog("chrome://global/content/viewPartialSource.xul",
                           "_blank", "scrollbars,resizable,chrome,dialog=no",
                           null, charset, selection, 'selection');
}
interactive ('view-partial-source', view_partial_source, ['content_charset', 'content_selection']);


function  view_mathml_source (charset, target) {
    if (charset) { charset = "charset=" + charset; }
    this.window.openDialog("chrome://global/content/viewPartialSource.xul",
                           "_blank", "scrollbars,resizable,chrome,dialog=no",
                           null, charset, target, 'mathml');
}
interactive ('view-mathml-source', view_mathml_source, ['content_charset', 'mathml_node']);

