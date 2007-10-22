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

var gBrowser = null;


function abs_point (node)
{
    var orig = node;
    var pt = {};
    try {
    pt.x = node.offsetLeft;
    pt.y = node.offsetTop;
    // find imagemap's coordinates
    if (node.tagName == "AREA") {
	var coords = node.getAttribute("coords").split(",");
	pt.x += Number(coords[0]);
	pt.y += Number(coords[1]);
    }

    node = node.offsetParent;
    // Sometimes this fails, so just return what we got.

	while (node.tagName != "BODY") {
	    pt.x += node.offsetLeft;
	    pt.y += node.offsetTop;
	    node = node.offsetParent;
	}
    } catch(e) {
// 	node = orig;
// 	while (node.tagName != "BODY") {
// 	    alert("okay: " + node + " " + node.tagName + " " + pt.x + " " + pt.y);
// 	    node = node.offsetParent;
// 	}
    }
    return pt;
}

function getAccessibility(node)
{
    // This is wrapped in a try-catch block because firefox fails when
    // retrieving a link's accessible.
    var acc_ret = Components.classes["@mozilla.org/accessibilityService;1"]
	.createInstance(Components.interfaces.nsIAccessibilityService);
    var foo = acc_ret.getAccessibleFor(node);
    return foo;
}

function getBrowser()
{
    if (gBrowser == null)
	gBrowser = document.getElementById("content");
    return gBrowser;
}

function getWebNavigation ()
{
  try {
//       alert(getBrowser().curbrow.firstChild.webNavigation);
      return getBrowser().webNavigation;
  } catch (e) {
      window.alert(e);
    return null;
  }    
}

function getMarkupDocumentViewer ()
{
  try {
      return getBrowser().markupDocumentViewer;
  } catch (e) {
      window.alert(e);
    return null;
  }    
}

// A function to setup reading input in the minibuffer
function read_from_minibuffer_internal (prompt)
{
//     var messageWindow = document.getElementById("message-bar");
    var label = document.getElementById("input-prompt");
    var output = document.getElementById("minibuffer-output");

    output.value = "";
    output.collapsed = true;
    label.collapsed = false;
    minibuffer.input.value = "";
    minibuffer.input.collapsed = false;

    minibuffer.focused_window = document.commandDispatcher.focusedWindow;
    minibuffer.focused_element = document.commandDispatcher.focusedElement;

    label.value = prompt;

    // If this isn't given a timeout it doesn't focus in ff1.5. I
    // don't know why.
//     setTimeout (function (){field.focus();}, 0);

    window.focus();
    minibuffer.input.focus();
//     document.commandDispatcher.focusedWindow = window;
//     document.commandDispatcher.focusedElement = field;
}

// Keeps track of history
var gHistory = [];
var minibuffer_history_max_items = 100;

function getHistory(id)
{
    if (gHistory[id] == null)
	gHistory[id] = [];

    return gHistory[id];
}

function initHistory(id)
{
    if (id != null) {
	minibuffer.history = getHistory(id);
	minibuffer.history_index = minibuffer.history.length;
    } else {
	minibuffer.history_index = null;
	minibuffer.history = null;
    }    
}

function addHistory(str)
{
    if (minibuffer.history != null) {
        if (minibuffer.history.length >= minibuffer_history_max_items)
            minibuffer.history.splice(0, 1);
        minibuffer.history.push(str);
    }
}

var minibuffer = {
input: null,

// The focus before we read from the minibuffer
focused_element: null,
focused_window: null,

// The callback setup to be called when readFromMiniBuffer is done
callback: null,
abort_callback: null,

// The completions for the user to choose
completions: [],

// The current completion
current_completion: null,
current_completions: null,

default_match: null,
allow_nonmatches: false,

// The current idx into the history
history_index: null,
// The arry we're using for history
history: null,

// hooks
oninput: function () { conkeror.call_interactively.call (this, "minibuffer-change"); },

// flag for backspace
do_not_complete: false,

// exit: a field corresponding to the interactive method `minibuffer_exit'.
// It is meant to be set by commands that call `exit_minibuffer', as a way to
// pass additional information to the command for which the minibuffer was
// being read, such as what keystroke caused exit_minibuffer to be called.
exit: null

};



function init_minibuffer () {
    minibuffer.input = document.getElementById("input-field");
}



// Cheap completion
function miniBufferCompleteStr(str, matches)
{
    var ret = [];
    for (var i=0; i<matches.length; i++)
	{
	    if (str.length == 0 || str == matches[i][0].substr(0, str.length)) {
		ret.push(matches[i]);
	    }
	}

    return ret;
}

// remove whitespace from the beginning and end
function removeWhiteSpace (str)
{
    var tmp = new String (str);
    return tmp.replace (/^\s+/, "").replace (/\s+$/, "");
}

function findCompleteMatch(matches, val)
{
    for (var i=0; i<matches.length; i++) {
	if (matches[i][0] == val)
	    return matches[i][1];
    }
    return null;
}

function setInputValue(str)
{
    minibuffer.input.value = str;
}

// Read a string from the minibuffer and call callBack with the string
// as an argument.
function readFromMiniBuffer(prompt, initVal, history, completions, allowNonMatches, defaultMatch, callBack, abortCallback)
{
    minibuffer.callback = callBack;
    minibuffer.abort_callback = abortCallback;
    minibuffer.completions = completions;
    minibuffer.current_completion = null;
    minibuffer.default_match = defaultMatch;
    minibuffer.allow_nonmatches = allowNonMatches;
    initHistory(history);
    ///// dumpln (dump_obj (minibuffer));
    read_from_minibuffer_internal (prompt);
    if (initVal) {
        setInputValue(initVal);
	if (initVal.length > 1) minibuffer.input.setSelectionRange(0, minibuffer.input.value.length);
    }
}

function setFocus(element) {
    Components.lookupMethod(element, "focus").call(element);
}

function closeInput(restoreFocus)
{
    try {
	var prompt = document.getElementById("input-prompt");
	var output = document.getElementById("minibuffer-output");
	if (minibuffer.focused_element && restoreFocus) {
	    try {
		// Focusing the element will scroll the window to the focused
		// element, but we want to restore focus without moving the
		// window. So scroll back after we've focused.
		var screenx = minibuffer.focused_window.scrollX;
		var screeny = minibuffer.focused_window.scrollY;
		setFocus(minibuffer.focused_element);
		minibuffer.focused_window.scrollTo(screenx,screeny);
	    } catch (e) {
		setFocus(minibuffer.focused_window);
	    }
	} else if (minibuffer.focused_window) {
	    content.focus();
// 	    setFocus(minibuffer.focused_window);
	} else {
	    // Last resort
	    content.focus();
	}

// 	if (clearInput)
	output.collapsed = false;
	prompt.collapsed = true;


	// alert ("message: " + output.value);

	// minibuffer.input.removeAttribute("flex");
	minibuffer.input.collapsed = true;
	//minibuffer.input.hidden = true;
	// minibuffer.input.value = "";
        minibuffer.input.onchange = "";
    } catch(e) { alert(e); }
}


// Enable/disable modeline
var gModeLineMode = true;

function showModeline()
{
    var modeline = getBrowser().modeLine;
    modeline.hidden = !gModeLineMode;
}

function updateModeline()
{
    var url = getWebNavigation().currentURI;
    var docshell = document.getElementById("content").webNavigation;
    var modeline = getBrowser().modeLine;
    var time = new Date();
    var hours = time.getHours();
    var mins = time.getMinutes();
    var win = document.commandDispatcher.focusedWindow;
    var x = win.scrollMaxX == 0 ? 100 : Math.round(win.scrollX / win.scrollMaxX * 100);
    var y = win.scrollMaxY == 0 ? 100 : Math.round(win.scrollY / win.scrollMaxY * 100);
    modeline.value = url.spec;
    modeline.value += "    " + (hours<10 ? "0" + hours:hours)
	+ ":" + (mins<10 ?"0" +mins:mins);
    modeline.value += "    (" + x + "," + y + ")";
    showModeline();
}


// clipboard

function readFromClipboard()
{
  var url;

  try {
    // Get clipboard.
    var clipboard = Components.classes["@mozilla.org/widget/clipboard;1"]
                              .getService(Components.interfaces.nsIClipboard);

    // Create tranferable that will transfer the text.
    var trans = Components.classes["@mozilla.org/widget/transferable;1"]
                          .createInstance(Components.interfaces.nsITransferable);

    trans.addDataFlavor("text/unicode");
    // If available, use selection clipboard, otherwise global one
    if (clipboard.supportsSelectionClipboard())
      clipboard.getData(trans, clipboard.kSelectionClipboard);
    else
      clipboard.getData(trans, clipboard.kGlobalClipboard);

    var data = {};
    var dataLen = {};
    trans.getTransferData("text/unicode", data, dataLen);

    if (data) {
      data = data.value.QueryInterface(Components.interfaces.nsISupportsString);
      url = data.data.substring(0, dataLen.value / 2);
    }
  } catch (ex) {
  }

  return url;
}


// Show the message in the minibuffer
function message (str)
{
    var minibuf = document.getElementById("minibuffer-output");
    minibuf.value = str;
}

function clearMessage() 
{
    message("");
}

// gKeySeq is a list of keys the user has pressed to execute a
// command. If the user waits this list will be printed at the bottom
// of the screen, just like Emacs.
var gKeySeq = [];

// If the user waits for an amount of time then conkeror will display
// the key sequence they've typed thus far and ever key
// thereafter. This keeps track of whether the timeout has occurred.
var gKeyTimeout = false;

// The event for the last command
var gCommandLastEvent = null;


function addKeyPressHelpTimeout() {
    setTimeout(function () {if (gKeySeq.length>0) {message(gKeySeq.join(" ")); gKeyTimeout = true; }}, 2500);
}

// function addKeyBinding(kmap, key, control, alt, keymap, command)
// {
//     var obj = {key: key, control: control, alt: alt};
//     if (command)
// 	obj.command = command;
//     else 
// 	obj.keymap = keymap;
//     kmap.push(obj);
// }

function formatMods(mods)
{
    return (mods&MOD_META ? "A-":"") 
	+ (mods&MOD_CTRL ? "C-":"") 
	+ (mods&MOD_SHIFT ? "S-":"");
}

function formatKey(key, mods)
{
    var s = key == 32 ? "SPC":String.fromCharCode(key);
    return formatMods(mods) + s;
}

function copyEvent(event)
{
    var ev = {};
    ev.keyCode = event.keyCode;
    ev.charCode = event.charCode;
    ev.ctrlKey = event.ctrlKey;
    ev.metaKey = event.metaKey;
    ev.altKey = event.altKey;
    ev.shiftKey = event.shiftKey;
    return ev;
}

function readKeyPress(event)
{
    try {
	// kmap contains the keys and commands we're looking for.
	var kmap = conkeror.current_kmap;
	var binding = null;
	var done = true;

	clearMessage();

	// Make a fake event
	gCommandLastEvent = copyEvent(event);

	// First check if there's an overlay kmap
	if (conkeror.overlay_kmap != null) {
	    binding = conkeror.getKeyBinding (conkeror.overlay_kmap, event);
            if (binding == null) {
                // disengage the universal keymap.
                conkeror.overlay_kmap = null;
                //alert (gPrefixArg);
            }
	}

        ///XXX: context can override overlay.  is this right?
        ///
        /// consider: you hit C-u, thus enabling an overlay map.  then you hit `1'.
        ///           There is a good case to be made that this character key should
        ///           go to the gui control, not the overlay map.
        ///           
        ///
        if (kmap == conkeror.top_kmap) {
            // If we are not in the middle of a key sequence, context keymaps
            // get a chance to take the key.
            // 
            // Try the predicate of each context keymap until we find one that
            // matches.
            //
//             if (document.commandDispatcher.focusedElement)
//                 dumpln (conkeror.dump_obj (document.commandDispatcher.focusedElement));
            for (var i = 0; i < conkeror.context_kmaps.length; i++) {
                if (conkeror.context_kmaps[i].predicate (document.commandDispatcher.focusedElement)) {
                    binding = conkeror.getKeyBinding (conkeror.context_kmaps[i], event);
                    //alert (window.dump_obj (binding));
                    break;
                }
            }
	}

	// Finally, top_kmap and friends get dibs.
	//
	if (binding == null) {
	    binding = conkeror.getKeyBinding (kmap, event);
	}

        // Should we stop this event from being processed by the gui?
        //
        // 1) we have a binding, and the binding's fallthrough property is not
        //    true.
        //
        // 2) we are in the middle of a key sequence, and we need to say that
        //    the key sequence given has no command.
        //
        if ((binding && ! binding.fallthrough) ||
            kmap != conkeror.top_kmap)
        {
            event.preventDefault();
            event.stopPropagation();
        }

	// Finally, process the binding.
	if (binding) {
	    if (binding.keymap) {
		conkeror.current_kmap = binding.keymap;
		if (!gKeyTimeout)
		    addKeyPressHelpTimeout();
		// We're going for another round
		done = false;
	    } else if (binding.command) {
                conkeror.call_interactively.call (window, binding.command);
	    }
	} else {
	    // No binding was found.  If this is the universal abort_key, then
	    // abort().
            if (conkeror.keyMatch (conkeror.abort_key, event))
                abort();
	}

	// Clean up if we're done
	if (done) {
	    gKeySeq = [];
	    conkeror.current_kmap = conkeror.top_kmap;
	}

    } catch(e){alert(e);}
}


function zip2(array1, array2)
{
    len = array1.length < array2.length ? array2.length:array1.length;
    acc = [];
    for(var i=0; i<len; i++)
	acc.push([array1[i],array2[i]]);
    return acc;
}


function abort()
{
    // Reset the prefix arg
    gPrefixArg = null;
    message("Quit");
}

// We don't care about helper apps or extensions or anything. Just put
// the bits where we're told.

function makeURL(aURL)
{
  var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                .getService(Components.interfaces.nsIIOService);
  return ioService.newURI(aURL, null, null);
}

function makeFileURL(aFile)
{
  var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                .getService(Components.interfaces.nsIIOService);
  return ioService.newFileURI(aFile);
}

function get_document_content_disposition (document_o)
{
    var content_disposition = null;
    try {
        content_disposition =
            document_o.defaultView
            .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
            .getInterface(Components.interfaces.nsIDOMWindowUtils)
            .getDocumentMetadata("content-disposition");
    } catch (e) { }
    return content_disposition;
}

// download_uri
//
// called by the command save-link.
// 
function download_uri (url_s, dest_s)
{
    var url_o = makeURL (url_s);
    var document_o = null;

    var dest_file_o = Components.classes["@mozilla.org/file/local;1"]
        .createInstance(Components.interfaces.nsILocalFile);
    dest_file_o.initWithPath(dest_s);
    var dest_data_dir_o = null;
    var referrer_o = null;//should there be a referrer?
    var content_type_s = null;
    var should_bypass_cache_p = true;//not sure...

    //we cannot save as text or as web-complete unless we are browsing the
    //document already.
    var save_as_text_p = false;
    var save_as_complete_p = false;

    download_uri_internal (
        url_o,
        document_o,
        dest_file_o,
        dest_data_dir_o,
        referrer_o,
        content_type_s,
        should_bypass_cache_p,
        save_as_text_p,
        save_as_complete_p
        );
}

/*
 * download_uri_internal
 *
 *  url_o           an nsIURI object of the page to be saved. required.
 *
 *  document_o      a document object of the page to be saved.
 *                  null if you want to save an URL that is not being
 *                  browsed, but in that case, you cannot save as text
 *                  or as `web-complete'.
 *
 *  dest_file_o     an nsILocalFile object for the destination file.
 *                  required.
 *
 *  dest_data_dir_o  an nsILocalFile object for the directory to hold
 *                   linked files when doing save-as-complete.  Otherwise
 *                   null.
 *
 *  referrer_o      nsIURI to pass as the referrer.  May be null.
 *
 *  content_type_s  a string content type of the document.  Required to
 *                  save as text or save as complete.  Should be provided
 *                  for save-page, but probably safe to pass null.  for URI's
 *                  not browsed yet (save-link) pass null.
 *
 *  should_bypass_cache_p   boolean tells whether to bypass cache data or not.
 *                          Usually pass true.
 *
 *  save_as_text_p  boolean tells whether to save as text.  mutually exclusive
 *                  with save_as_complete_p.  Only available when document_o is
 *                  supplied.
 *
 *  save_as_complete_p  boolean tells whether to save in complete mode.
 *                      mutually exclusive with save_as_text_p.  Only available
 *                      when document_o is supplied.  Requires dest_data_dir_o be
 *                      supplied.
 *
 */
function download_uri_internal (url_o, document_o,
                                dest_file_o, dest_data_dir_o, referrer_o,
                                content_type_s, should_bypass_cache_p,
                                save_as_text_p, save_as_complete_p)
{
    // We have no DOM, and can only save the URL as is.
    const SAVEMODE_FILEONLY      = 0x00;
    // We have a DOM and can save as complete.
    const SAVEMODE_COMPLETE_DOM  = 0x01;
    // We have a DOM which we can serialize as text.
    const SAVEMODE_COMPLETE_TEXT = 0x02;

    function GetSaveModeForContentType(aContentType)
    {
        var saveMode = SAVEMODE_FILEONLY;
        switch (aContentType) {
            case "text/html":
            case "application/xhtml+xml":
                saveMode |= SAVEMODE_COMPLETE_TEXT;
                // Fall through
            case "text/xml":
            case "application/xml":
                saveMode |= SAVEMODE_COMPLETE_DOM;
                break;
        }
        return saveMode;
    }

    //getPostData might be handy outside of download_uri_internal.
    //
    function getPostData()
    {
        try {
            var sessionHistory = getWebNavigation().sessionHistory;
            var entry = sessionHistory.getEntryAtIndex(sessionHistory.index, false);
            entry = entry.QueryInterface(Components.interfaces.nsISHEntry);
            return entry.postData;
        }
        catch (e) {
        }
        return null;
    }


    // to save the current page, pass in the url object of the current url, and the document object.

    // saveMode defaults to SAVEMODE_FILEONLY, meaning we have no DOM, so we can only save the file as-is.
    // SAVEMODE_COMPLETE_DOM means we can save as complete.
    // SAVEMODE_COMPLETE_TEXT means we have a DOM and we can serialize it as text.
    // text/html will have all these flags set, meaning it can be saved in all these ways.
    // text/xml will have just FILEONLY and COMPLETE_DOM.  We cannot serialize plain XML as text.

    var saveMode = GetSaveModeForContentType (content_type_s);

    // is_document_p is a flag that tells us a document object was passed
    // in, its content type was passed in, and this content type has a DOM.

    var is_document_p = document_o != null && saveMode != SAVEMODE_FILEONLY;

    // use_save_document_p is a flag that tells us that it is possible to save as
    // either COMPLETE or TEXT, and that saving as such was requested by the
    // caller.
    //
    // Therefore, it is ONLY possible to save in COMPLETE or TEXT
    // mode if we pass in a document object and its content type, and its
    // content type supports those save modes.
    //
    // Ergo, we can implement the Conkeror commands, save-page-as-text and
    // save-page-complete, but not corresponding commands for links.

    var use_save_document_p = is_document_p &&
        (((saveMode & SAVEMODE_COMPLETE_DOM) && !save_as_text_p && save_as_complete_p) ||
         ((saveMode & SAVEMODE_COMPLETE_TEXT) && save_as_text_p));

    if (save_as_text_p && !use_save_document_p)
        throw ("Cannot save this page as text.");

    if (save_as_complete_p && !use_save_document_p)
        throw ("Cannot save this page in complete mode.");

    // source may be a document object or an url object.

    var source = use_save_document_p ? document_o : url_o;

    // fileURL is an url object representing the output file.

    var fileURL = makeFileURL (dest_file_o);



    var persistArgs = {
        source: source,
        contentType: ((use_save_document_p && save_as_text_p) ?
                      "text/plain" : content_type_s),
        target: fileURL,
        postData: (is_document_p ? getPostData() : null), //ok (new)
        bypassCache: should_bypass_cache_p
    };

    const nsIWBP = Components.interfaces.nsIWebBrowserPersist;
    var persist = Components.classes["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"]
        .createInstance(nsIWBP);

    // Calculate persist flags.
    const flags = nsIWBP.PERSIST_FLAGS_REPLACE_EXISTING_FLAGS;
    if (should_bypass_cache_p)
        persist.persistFlags = flags | nsIWBP.PERSIST_FLAGS_BYPASS_CACHE;
    else
        persist.persistFlags = flags | nsIWBP.PERSIST_FLAGS_FROM_CACHE;

    // Let the WebBrowserPersist decide whether the incoming data is encoded
    // and whether it needs to go through a content converter e.g. to
    // decompress it.
    persist.persistFlags |= nsIWBP.PERSIST_FLAGS_AUTODETECT_APPLY_CONVERSION;

    // Create download and initiate it (below)
    //
    //XXX RetroJ:
    //  This transfer object is what produces the gui downloads display.  As a
    //  future project, we will use a nsIWebProgressListener internal to
    //  conkeror that does not involve annoying gui dialogs.
    //
    var tr = Components.classes["@mozilla.org/transfer;1"].createInstance(Components.interfaces.nsITransfer);

    if (use_save_document_p)
    {
        // Saving a Document, not a URI:
        var encodingFlags = 0;
        if (persistArgs.contentType == "text/plain")
        {
            encodingFlags |= nsIWBP.ENCODE_FLAGS_FORMATTED;
            encodingFlags |= nsIWBP.ENCODE_FLAGS_ABSOLUTE_LINKS;
            encodingFlags |= nsIWBP.ENCODE_FLAGS_NOFRAMES_CONTENT;
        } else {
            encodingFlags |= nsIWBP.ENCODE_FLAGS_BASIC_ENTITIES;
        }

        const kWrapColumn = 80;
        
        // this transfer object is the only place in this document-saving branch where url_o is needed.
        tr.init (url_o, persistArgs.target, "", null, null, null, persist);
        persist.progressListener = tr;
        //persist.progressListener = progress_listener;
        persist.saveDocument (persistArgs.source, persistArgs.target, dest_data_dir_o,
                              persistArgs.contentType, encodingFlags, kWrapColumn);
    } else {
        // Saving a URI:

        tr.init (source, persistArgs.target, "", null, null, null, persist);
        persist.progressListener = tr;
        //persist.progressListener = progress_listener;
        persist.saveURI (source, null, referrer_o, persistArgs.postData, null,
                         persistArgs.target);
    }
}



/**
 * Determine what the 'default' path is for operations like save-page.
 * Returns an nsILocalFile.
 * @param url_o nsIURI of the document being saved.
 * @param aDocument The document to be saved
 * @param aContentType The content type we're saving, if it could be
 *        determined by the caller.
 * @param aContentDisposition The content-disposition header for the object
 *        we're saving, if it could be determined by the caller.
 * @param dest_extension_s To override the extension of the destination file,
 *        pass the extension you want here.  Otherwise pass null.  This is
 *        used by save_page_as_text.
 */
function make_default_file_name_to_save_url (url_o, aDocument, aContentType, aContentDisposition, dest_extension_s)
{
     function getDefaultExtension(file_name_s, url_o, aContentType)
     {
         if (aContentType == "text/plain" || aContentType == "application/octet-stream" || url_o.scheme == "ftp")
             return "";   // temporary fix for bug 120327
 
         // First try the extension from the filename
         var url = Components.classes["@mozilla.org/network/standard-url;1"]
             .createInstance(Components.interfaces.nsIURL);
         url.filePath = file_name_s;
 
         var ext = url.fileExtension;
 
         // This mirrors some code in nsExternalHelperAppService::DoContent
         // Use the filename first and then the URI if that fails
   
         var mimeInfo = null;
         if (aContentType || ext) {
             try {
                 mimeInfo = Components.classes["@mozilla.org/mime;1"]
                     .getService(Components.interfaces.nsIMIMEService)
                     .getFromTypeAndExtension(aContentType, ext);
             }
             catch (e) {
             }
         }
 
         if (ext && mimeInfo && mimeInfo.extensionExists(ext))
             return ext;
   
         // Well, that failed.  Now try the extension from the URI
         var urlext;
         try {
             url = url_o.QueryInterface(Components.interfaces.nsIURL);
             urlext = url.fileExtension;
         } catch (e) {
         }
 
         if (urlext && mimeInfo && mimeInfo.extensionExists(urlext)) {
             return urlext;
         } else {
             try {
                 return mimeInfo.primaryExtension;
             }
             catch (e) {
                 // Fall back on the extensions in the filename and URI for lack
                 // of anything better.
                 return ext || urlext;
             }
         }
     }
 
 
     function getDefaultFileName(aDefaultFileName, aURI, aDocument,
                                 aContentDisposition)
     {
         function getCharsetforSave(aDocument)
         {
             if (aDocument)
                 return aDocument.characterSet;
 
             if (document.commandDispatcher.focusedWindow)
                 return document.commandDispatcher.focusedWindow.document.characterSet;
 
             return window.content.document.characterSet;
         }
 
         function validateFileName(aFileName)
         {
             var re = /[\/]+/g;
             if (navigator.appVersion.indexOf("Windows") != -1) {
                 re = /[\\\/\|]+/g;
                 aFileName = aFileName.replace(/[\"]+/g, "'");
                 aFileName = aFileName.replace(/[\*\:\?]+/g, " ");
                 aFileName = aFileName.replace(/[\<]+/g, "(");
                 aFileName = aFileName.replace(/[\>]+/g, ")");
             }
             else if (navigator.appVersion.indexOf("Macintosh") != -1)
                 re = /[\:\/]+/g;
   
             return aFileName.replace(re, "_");
         }
 
 
         // 1) look for a filename in the content-disposition header, if any
         if (aContentDisposition) {
             const mhp = Components.classes["@mozilla.org/network/mime-hdrparam;1"]
                 .getService(Components.interfaces.nsIMIMEHeaderParam);
             var dummy = { value: null };  // Need an out param...
             var charset = getCharsetforSave(aDocument);
 
             var fileName = null;
             try {
                 fileName = mhp.getParameter(aContentDisposition, "filename", charset,
                                             true, dummy);
             }
             catch (e) {
                 try {
                     fileName = mhp.getParameter(aContentDisposition, "name", charset, true,
                                                 dummy);
                 }
                 catch (e) {
                 }
             }
             if (fileName)
                 return fileName;
         }
 
         try {
             var url = aURI.QueryInterface(Components.interfaces.nsIURL);
             if (url.fileName != "") {
                 // 2) Use the actual file name, if present
                 var textToSubURI = Components.classes["@mozilla.org/intl/texttosuburi;1"]
                     .getService(Components.interfaces.nsITextToSubURI);
                 return validateFileName(textToSubURI.unEscapeURIForUI(url.originCharset || "UTF-8", url.fileName));
             }
         } catch (e) {
             // This is something like a data: and so forth URI... no filename here.
         }
 
         if (aDocument) {
             var docTitle = validateFileName(aDocument.title).replace(/^\s+|\s+$/g, "");
             if (docTitle) {
                 // 3) Use the document title
                 return docTitle;
             }
         }
 
         if (aDefaultFileName)
             // 4) Use the caller-provided name, if any
             return validateFileName(aDefaultFileName);
 
         // 5) If this is a directory, use the last directory name
         var path = aURI.path.match(/\/([^\/]+)\/$/);
         if (path && path.length > 1)
             return validateFileName(path[1]);
 
         try {
             if (aURI.host)
                 // 6) Use the host.
                 return aURI.host;
         } catch (e) {
             // Some files have no information at all, like Javascript generated pages
         }
         try {
             // 7) Use the default file name
             return getStringBundle().GetStringFromName("DefaultSaveFileName");
         } catch (e) {
             //in case localized string cannot be found
         }
         // 8) If all else fails, use "index"
         return "index";
     }
 
     // end of support functions.
     //
 
     var file_ext_s;
     var file_base_name_s;

    try {
        // Assuming nsiUri is valid, calling QueryInterface(...) on it will
        // populate extra object fields (eg filename and file extension).
        var url = url_o.QueryInterface(Components.interfaces.nsIURL);
        file_ext_s = url.fileExtension;
    } catch (e) { }

    // Get the default filename:
    var file_name_s = getDefaultFileName(null, url_o, aDocument, aContentDisposition);

    // If file_ext_s is still blank, and url_o is a web link (http or
    // https), make the extension `.html'.
    if (! file_ext_s && !aDocument && !aContentType && (/^http(s?)/i.test(url_o.scheme))) {
        file_ext_s = ".html";
        file_base_name_s = file_name_s;
    } else {
        file_ext_s = getDefaultExtension(file_name_s, url_o, aContentType);
        // related to temporary fix for bug 120327 in getDefaultExtension
        if (file_ext_s == "")
            file_ext_s = file_name_s.replace (/^.*?\.(?=[^.]*$)/, "");
        file_base_name_s = file_name_s.replace (/\.[^.]*$/, "");
    }

    if (dest_extension_s)
        file_ext_s = dest_extension_s;

    var file_name_o  = conkeror.default_directory.clone();
    file_name_o.append (file_base_name_s +'.'+ file_ext_s);
    return file_name_o;
}


function add_stringbundle (id, src)
{
    const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
    var stringbundleset = document.getElementById ("stringbundleset");
    var item = document.createElementNS (XUL_NS,"stringbundle");
    item.setAttribute ("id", id);
    item.setAttribute ("src", src);
    stringbundleset.appendChild (item);
    return item;
}






// var commandline_flags = {
//     'default': { doc: "This action is associated with stand-alone command-line arguments (those with no flag).",
//                  arg: 'URL',
//                  func: function (url) { dumpln (url); }
//     },

//     '-r': { doc: "Recycle active buffer for first url",
//             arg: false,
//             func: function () { dump ("I saw -r\n"); }
//     },

//     '-c': { doc: "Call interactive command",
//             arg: 'COMMAND',
//             func: function (command) { dump ("I saw -c with command, "+command+"\n"); }
//     }
// };


// function commandline_handler (cmdline) {
//     try {
//         var flag;
//         var expect = false;
//         var actions = [];
//         if (cmdline.length == 0) {
//             // FIXME: what should happen when a command line is remoted that
//             // has no arguments?  new frame?  request focus for active frame?
//             dumpln ("conkeror: command line remoted with no args.");
//         }
//         for (var i = 0; i < cmdline.length; i++) {
//             var arg = cmdline.getArgument (i);
//             if (expect == false && arg[0] == '-') {
//                 // looks like a flag
//                 if (arg in commandline_flags) {
//                     if (commandline_flags[arg].arg) {
//                         flag = arg;
//                         expect = true;
//                     } else {
//                         // this flag takes no argument.
//                         actions.push ([arg]);
//                     }
//                 } else {
//                     throw ("unrecognized flag: "+arg);
//                 }
//             } else {
//                 if (expect) {
//                     expect = false;
//                     actions.push ([flag, arg]);
//                 } else {
//                     // stand-alone argument, like an URL.  use default action.
//                     actions.push (['default', arg]);
//                 }
//             }
//         }
//         if (expect) { //p-tui!
//             var detail = (commandline_flags[flag].arg == true ? ""
//                           : " ("+commandline_flags[flag].arg + ")");
//             throw ("expected argument for flag, " + flag + detail);
//         }

//         while (actions.length) {
//             try {
//                 var a = actions.shift ();
//                 if (commandline_flags[ a[0] ].arg) {
//                     // an arg has been collected for this action (a[1])
//                     commandline_flags[ a[0] ].func (a[1]);
//                 } else {
//                     commandline_flags[ a[0] ].func ();
//                 }
//             } catch (e) {
//                 dump ("conkeror: command line action failed:\n"+e+"\n");
//             }
//         }

//         // should we open a new window?
// //         if (cmdline.state == cmdline.STATE_INITIAL_LAUNCH) {
// //             // we need to open a window, with our object as arg.
// //             ww.openWindow(null, CHROME_URI, "_blank",
// //                           "chrome,menubar,toolbar,status,resizable,dialog=no",
// //                           {wrappedJSObject: window_arguments});
// //         } else {
// //             // we need to pass our object to the active window.
// //             try {
// //                 ww.activeWindow.handle_window_arguments ({wrappedJSObject: window_arguments});
// //             } catch (e) {
// //                 dump ("conkeror: failed to find active window:\n"
// //                       +"          "+ e + "\n");
// //             }
// //         }

//     } catch (e) {
//         dump ("conkeror: abandoning command line interpretation because:\n"
//               +"          "+ e + "\n");
// //         Components.utils.reportError (e);
//     }
// }

