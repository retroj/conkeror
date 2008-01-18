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
    },

    for_each_value : function (f) {
        for (var i in this) {
            if (i[0] == "-")
                f(this[i]);
        }
    }
};

/// Window title formatting

/**
 * Default tile formatter.  The page url is ignored.  If there is a
 * page_title, returns: "Page title - Conkeror".  Otherwise, it
 * returns just: "Conkeror".
 */
function default_title_formatter (window)
{
    var page_title = window.buffers.current.title;

    if (page_title && page_title.length > 0)
        return page_title + " - Conkeror";
    else
        return "Conkeror";
}

var title_format_fn = null;

function set_window_title (window)
{
    window.document.title = title_format_fn(window);
}

function init_window_title ()
{
    title_format_fn = default_title_formatter;

    add_hook("window_initialize_late_hook", set_window_title);
    add_hook("current_content_buffer_location_change_hook",
             function (buffer) {
                 set_window_title(buffer.window);
             });
    add_hook("select_buffer_hook", function (buffer) { set_window_title(buffer.window); }, true);
    add_hook("current_buffer_title_change_hook",
             function (buffer) {
                 set_window_title(buffer.window);
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
    return null;
}


function makeURL(aURL)
{
    var ioService = Cc["@mozilla.org/network/io-service;1"]
        .getService(Ci.nsIIOService);
    return ioService.newURI(aURL, null, null);
}

function makeFileURL(aFile)
{
    var ioService = Cc["@mozilla.org/network/io-service;1"]
        .getService(Ci.nsIIOService);
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


function set_focus_no_scroll(window, element)
{
    window.document.commandDispatcher.suppressFocusScroll = true;
    element.focus();
    window.document.commandDispatcher.suppressFocusScroll = false;
}

function do_repeatedly_positive(func, n) {
    var args = Array.prototype.slice.call(arguments, 2);
    while (n-- > 0)
        func.apply(null, args);
}

function do_repeatedly(func, n, positive_args, negative_args) {
    if (n < 0)
        do func.apply(null, negative_args); while (++n < 0);
    else
        while (n-- > 0) func.apply(null, positive_args);
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

var xul_app_info = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULAppInfo);
var xul_runtime = Cc['@mozilla.org/xre/app-info;1'].getService(Ci.nsIXULRuntime);


function get_os ()
{
    // possible return values: 'Darwin', 'Linux', 'WINNT', ...
    return xul_runtime.OS;
}

var default_directory = null;

var env = Cc['@mozilla.org/process/environment;1'].getService(Ci.nsIEnvironment);
function getenv (variable) {
    if (env.exists (variable))
        return env.get(variable);
    return null;
}

function set_default_directory(directory_s) {
    if (! directory_s)
    {
        if ( get_os() == "WINNT")
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

const XHTML_NS = "http://www.w3.org/1999/xhtml";
const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
const MATHML_NS = "http://www.w3.org/1998/Math/MathML";
const XLINK_NS = "http://www.w3.org/1999/xlink";

function create_XUL(window, tag_name)
{
    return window.document.createElementNS(XUL_NS, tag_name);
}


/* Used in calls to XPath evaluate */
function xpath_lookup_namespace(prefix) {
    if (prefix == "xhtml")
        return XHTML_NS;
    if (prefix == "m")
        return MATHML_NS;
    if (prefix == "xul")
        return XUL_NS;
    return null;
}

function method_caller(obj, func) {
    return function () {
        func.apply(obj, arguments);
    }
}

function shell_quote(str) {
    var s = str.replace("\"", "\\\"", "g");
    s = s.replace("$", "\$", "g");
    return s;
}

function get_window_from_frame(frame) {
    try {
        var window = frame.QueryInterface(Ci.nsIInterfaceRequestor)
            .getInterface(Ci.nsIWebNavigation)
            .QueryInterface(Ci.nsIDocShellTreeItem)
            .rootTreeItem
            .QueryInterface(Ci.nsIInterfaceRequestor)
            .getInterface(Ci.nsIDOMWindow).wrappedJSObject;
        return window;
    } catch (e) {
        //dump_error(e);
        return null;
    }
}

function get_buffer_from_frame(window, frame) {
    var count = window.buffers.count;
    for (var i = 0; i < count; ++i) {
        var b = window.buffers.get_buffer(i);
        if (b.top_frame == frame)
            return b;
    }
    return null;
}

var file_locator = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties);

var conkeror_source_code_path = null;

function source_code_reference(uri, line_number) {
    this.uri = uri;
    this.line_number = line_number;
}
source_code_reference.prototype = {
    get module_name () {
        if (this.uri.indexOf(module_uri_prefix) == 0)
            return this.uri.substring(module_uri_prefix.length);
        return null;
    },

    get file_name () {
        var file_uri_prefix = "file://";
        if (this.uri.indexOf(file_uri_prefix) == 0)
            return this.uri.substring(file_uri_prefix.length);
        return null;
    },

    get best_uri () {
        if (conkeror_source_code_path != null) {
            var module_name = this.module_name;
            if (module_name != null)
                return "file://" + conkeror_source_code_path + "/modules/" + module_name;
        }
        return this.uri;
    },

    open_in_editor : function() {
        open_with_external_editor(this.best_uri, $line = this.line_number);
    }
};

function get_caller_source_code_reference(extra_frames_back) {
    var stack = Error().stack.split("\n");
    if (extra_frames_back == null)
        extra_frames_back = 0;
    var i = extra_frames_back + 3;
    if (stack.length <= i)
        return null;
    var s = stack[i];
    var regexp = /^[^@]*@(.*):([0-9]*)$/m;
    var match = regexp.exec(s);
    if (match.index != 0)
        return null;
    return new source_code_reference(match[1], match[2]);
}

require_later("external-editor.js");

function dom_generator(document, ns) {
    this.document = document;
    this.ns = ns;
}
dom_generator.prototype = {
    element : function(tag, parent) {
        var node = this.document.createElementNS(this.ns, tag);
        var i = 1;
        if (parent != null && (parent instanceof Ci.nsIDOMNode)) {
            parent.appendChild(node);
            i = 2;
        }
        for (; i < arguments.length; i += 2)
            node.setAttribute(arguments[i], arguments[i+1]);
        return node;
    },

    text : function(str, parent) {
        var node = this.document.createTextNode(str);
        if (parent)
            parent.appendChild(node);
        return node;
    },


    stylesheet_link : function(href, parent) {
        var node = this.element("link");
        node.setAttribute("rel", "stylesheet");
        node.setAttribute("type", "text/css");
        node.setAttribute("href", href);
        if (parent)
            parent.appendChild(node);
        return node;
    },


    add_stylesheet : function (url) {
        var head = this.document.documentElement.firstChild;
        this.stylesheet_link(url, head);
    }
};

/**
 * Generates a QueryInterface function suitable for an implemenation
 * of an XPCOM interface.  Unlike XPCOMUtils, this uses the Function
 * constructor to generate a slightly more efficient version.  The
 * arguments can be either Strings or elements of
 * Components.interfaces.
 */
function generate_QI() {
    var args = Array.prototype.slice.call(arguments).map(String).concat(["nsISupports"]);
    var fstr = "if(" +
        Array.prototype.map.call(args,
                                 function (x)
                                     "iid.equals(Components.interfaces." + x + ")")
        .join("||") +
        ") return this; throw Components.results.NS_ERROR_NO_INTERFACE;";
    return new Function("iid", fstr);
}

function set_branch_pref(branch, name, value) {
    if (typeof(value) == "string") {
        branch.setCharPref(name, value);
    } else if (typeof(alue) == "number") {
        branch.setIntPref(name, value);
    } else if (typeof(value) == "boolean") {
        branch.setBoolPref(name, value);
    }
}

function default_pref(name, value) {
    var branch = preferences.getDefaultBranch(null);
    set_branch_pref(branch, name, value);
}

function user_pref(name, value) {
    var branch = preferences.getBranch(null);
    set_branch_pref(branch, name, value);
}

function pref_is_locked(name, value) {
    var branch = preferences.getBranch(null);
    return branch.prefIsLocked(name);
}

function lock_pref(name, value) {
    var branch = preferences.getBranch(null);
    if (branch.prefIsLocked(name))
        branch.unlockPref(name);
    default_pref(name, value);
    branch.lockPref(name);
}

function unlock_pref(name) {
    var branch = preferences.getBranch(null);
    branch.unlockPref(name);
}

function get_branch_pref(branch, name) {
    switch (branch.getPrefType(name)) {
    case branch.PREF_STRING:
        return branch.getCharPref(name);
    case branch.PREF_INT:
        return branch.getIntPref(name);
    case branch.PREF_BOOL:
        return branch.getBoolPref(name);
    default:
        return null;
    }
}

function get_pref(name) {
    var branch = preferences.getBranch(null);
    return get_branch_pref(branch, name);
}

function get_default_pref(name) {
    var branch = preferences.getDefaultBranch(null);
    return get_branch_pref(branch, name);
}

function clear_pref(name) {
    var branch = preferences.getBranch(null);
    return branch.clearUserPref(name);
}

function clear_default_pref(name) {
    var branch = preferences.getDefaultBranch(null);
    return branch.clearUserPref(name);
}

function pref_has_user_value(name) {
    var branch = preferences.getBranch(null);
    return branch.prefHasUserValue(name);
}

function pref_has_default_value(name) {
    var branch = preferences.getDefaultBranch(null);
    return branch.prefHasUserValue(name);
}

const USER_AGENT_OVERRIDE_PREF = "general.useragent.override";

function set_user_agent(str) {
    lock_pref(USER_AGENT_OVERRIDE_PREF, str);
}


var builtin_commands = ["cmd_beginLine",
                        "cmd_copy",
                        "cmd_copyOrDelete",
                        "cmd_cut",
                        "cmd_cutOrDelete",
                        "cmd_deleteToBeginningOfLine",
                        "cmd_deleteToEndOfLine",
                        "cmd_endLine",
                        "cmd_moveTop",
                        "cmd_moveBottom",
                        "cmd_selectAll",
                        "cmd_selectBeginLine",
                        "cmd_selectBottom",
                        "cmd_selectEndLine",
                        "cmd_selectTop",
                        "cmd_scrollBeginLine",
                        "cmd_scrollEndLine",
                        "cmd_scrollTop",
                        "cmd_scrollBottom"];

var builtin_commands_with_count = [["cmd_charNext", "cmd_charPrevious"],
                                   ["cmd_deleteCharForward", "cmd_deleteCharBackward"],
                                   ["cmd_deleteCharForward", "cmd_deleteWordBackward"],
                                   ["cmd_lineNext", "cmd_linePrevious"],
                                   ["cmd_movePageDown", "cmd_movePageUp"],
                                   ["cmd_undo", "cmd_redo"],
                                   ["cmd_selectCharNext", "cmd_selectCharPrevious"],
                                   ["cmd_selectLineNext", "cmd_selectLinePrevious"],
                                   ["cmd_selectPageUp", "cmd_selectPageDown"],
                                   ["cmd_selectWordNext", "cmd_selectWordPrevious"],
                                   ["cmd_wordNext", "cmd_wordPrevious"],
                                   ["cmd_scrollPageUp", "cmd_scrollPageDown"],
                                   ["cmd_scrollLineUp", "cmd_scrollLineDown"],
                                   ["cmd_scrollLeft", "cmd_scrollRight"],
                                   "cmd_paste"];
