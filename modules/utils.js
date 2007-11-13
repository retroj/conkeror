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

/*
 * Utility functions for application scope.
 *
 */


function string_hashset() {
}

string_hashset.prototype = {
    constructor : string_hashset,

    add : function(s) {
        this["-" + s] = true;
    },
    
    contains : function(s) {
        return (("-" + s) in this);
    },

    remove : function (s) {
        delete this["-" + s];
    },

    for_each : function (f) {
        for (var i in this) {
            if (i[0] == "-")
                f(i.slice(1));
        }
    }
};

function string_hashmap() {
}

string_hashmap.prototype = {
    constructor : string_hashmap,

    put : function(s,value) {
        this["-" + s] = value;
    },
    
    contains : function(s) {
        return (("-" + s) in this);
    },

    get : function(s, default_value) {
        if (this.contains(s))
            return this["-" + s];
        return default_value;
    },

    get_put_default : function(s, default_value) {
        if (this.contains(s))
            return this["-" + s];
        return (this["-" + s] = default_value);
    },

    remove : function (s) {
        delete this["-" + s];
    },

    for_each : function (f) {
        for (var i in this) {
            if (i[0] == "-")
                f(i.slice(1), this[i]);
        }
    }
};

/// Window title formatting

/**
 * Default tile formatter.  The page url is ignored.  If there is a
 * page_title, returns: "Page title - Conkeror".  Otherwise, it
 * returns just: "Conkeror".
 */
function default_title_formatter (frame)
{
    var page_title = frame.buffers.current.title;

    if (page_title && page_title.length > 0)
        return page_title + " - Conkeror";
    else
        return "Conkeror";
}

var title_format_fn = null;

function set_window_title (frame)
{
    frame.document.title = title_format_fn(frame);
}

function init_window_title ()
{
    title_format_fn = default_title_formatter;

    add_hook("frame_initialize_late_hook", set_window_title);
    add_hook("current_browser_buffer_location_change_hook",
             function (buffer) {
                 set_window_title(buffer.frame);
             });
    add_hook("select_buffer_hook", function (buffer) { set_window_title(buffer.frame); }, true);
    add_hook("current_buffer_title_change_hook",
             function (buffer) {
                 set_window_title(buffer.frame);
             });
}
///


// Put the string on the clipboard
function writeToClipboard(str)
{
    const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
	.getService(Components.interfaces.nsIClipboardHelper);
    gClipboardHelper.copyString(str);
}


function makeURLAbsolute (base, url)
{
    // Construct nsIURL.
    var ioService = Components.classes["@mozilla.org/network/io-service;1"]
	.getService(Components.interfaces.nsIIOService);
    var baseURI  = ioService.newURI(base, null, null);

    return ioService.newURI (baseURI.resolve (url), null, null).spec;
}


function get_link_location (element)
{
    if (element && element.getAttribute("href")) {
        var loc = element.getAttribute("href");
        return makeURLAbsolute(element.baseURI, loc);
    }
}


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


function set_focus_no_scroll(frame, element)
{
    frame.document.commandDispatcher.suppressFocusScroll = true;
    element.focus();
    frame.document.commandDispatcher.suppressFocusScroll = false;
}


function do_N_times(func, n)
{
    var args = Array.prototype.slice.call(arguments, 2);
    while (n-- > 0)
        func.apply(null, args);
}

// remove whitespace from the beginning and end
function trim_whitespace (str)
{
    var tmp = new String (str);
    return tmp.replace (/^\s+/, "").replace (/\s+$/, "");
}

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

function get_os ()
{
    // possible return values: 'Darwin', 'Linux', 'WINNT', ...
    var appinfo = Cc['@mozilla.org/xre/app-info;1'].createInstance (Ci.nsIXULRuntime);
    return appinfo.OS;
}

var default_directory = null;

function set_default_directory(directory_s) {
    function getenv (variable) {
        var env = Cc['@mozilla.org/process/environment;1'].createInstance(Ci.nsIEnvironment);
        if (env.exists (variable))
            return env.get(variable);
        return null;
    }

    if (! directory_s)
    {
        if ( this.get_os() == "WINNT")
        {
            directory_s = getenv ('USERPROFILE') ||
                getenv ('HOMEDRIVE') + getenv ('HOMEPATH');
        }
        else {
            directory_s = getenv ('HOME');
        }
    }

    default_directory = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
    default_directory.initWithPath (directory_s);
}

set_default_directory();
