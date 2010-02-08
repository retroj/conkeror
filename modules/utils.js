/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2009 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

function string_hashset () {}

string_hashset.prototype = {
    constructor : string_hashset,

    add : function (s) {
        this["-" + s] = true;
    },

    contains : function (s) {
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
    },

    iterator : function () {
        for (let k in this) {
            if (i[0] == "-")
                yield i.slice(1);
        }
    }
};

function string_hashmap () {}

string_hashmap.prototype = {
    constructor : string_hashmap,

    put : function (s,value) {
        this["-" + s] = value;
    },

    contains : function (s) {
        return (("-" + s) in this);
    },

    get : function (s, default_value) {
        if (this.contains(s))
            return this["-" + s];
        return default_value;
    },

    get_put_default : function (s, default_value) {
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
    },

    iterator: function (only_keys) {
        if (only_keys) {
            for (let k in Iterator(this, true)) {
                if (k[0] == "-")
                    yield k.slice(1);
            }
        } else {
            for (let [k,v] in Iterator(this, false)) {
                if (k[0] == "-")
                    yield [k.slice(1),v];
            }
        }
    }
};


// Put the string on the clipboard
function writeToClipboard (str) {
    var gClipboardHelper = Cc["@mozilla.org/widget/clipboardhelper;1"]
	.getService(Ci.nsIClipboardHelper);
    gClipboardHelper.copyString(str);
}


function makeURLAbsolute (base, url) {
    // Construct nsIURL.
    var ioService = Cc["@mozilla.org/network/io-service;1"]
	.getService(Ci.nsIIOService);
    var baseURI  = ioService.newURI(base, null, null);
    return ioService.newURI(baseURI.resolve(url), null, null).spec;
}


function make_file (path) {
    if (path instanceof Ci.nsILocalFile)
        return path;
    var f = Cc["@mozilla.org/file/local;1"]
        .createInstance(Ci.nsILocalFile);
    f.initWithPath(path);
    return f;
}


function make_uri (uri, charset, base_uri) {
    const io_service = Cc["@mozilla.org/network/io-service;1"]
        .getService(Ci.nsIIOService2);
    if (uri instanceof Ci.nsIURI)
        return uri;
    if (uri instanceof Ci.nsIFile)
        return io_service.newFileURI(uri);
    return io_service.newURI(uri, charset, base_uri);
}

function make_file_from_chrome (url) {
    var crs = Cc['@mozilla.org/chrome/chrome-registry;1']
        .getService(Ci.nsIChromeRegistry);
    var file = crs.convertChromeURL(make_uri(url));
    return make_file(file.path);
}

function get_document_content_disposition (document_o) {
    var content_disposition = null;
    try {
        content_disposition = document_o.defaultView
            .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
            .getInterface(Components.interfaces.nsIDOMWindowUtils)
            .getDocumentMetadata("content-disposition");
    } catch (e) { }
    return content_disposition;
}


function set_focus_no_scroll (window, element) {
    window.document.commandDispatcher.suppressFocusScroll = true;
    element.focus();
    window.document.commandDispatcher.suppressFocusScroll = false;
}

function do_repeatedly_positive (func, n) {
    var args = Array.prototype.slice.call(arguments, 2);
    while (n-- > 0)
        func.apply(null, args);
}

function do_repeatedly (func, n, positive_args, negative_args) {
    if (n < 0)
        do func.apply(null, negative_args); while (++n < 0);
    else
        while (n-- > 0) func.apply(null, positive_args);
}


/**
 * Given a node, returns its position relative to the document.
 *
 * @param node The node to get the position of.
 * @return An object with properties "x" and "y" representing its offset from
 *         the left and top of the document, respectively.
 */
function abs_point (node) {
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


const XHTML_NS = "http://www.w3.org/1999/xhtml";
const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
const MATHML_NS = "http://www.w3.org/1998/Math/MathML";
const XLINK_NS = "http://www.w3.org/1999/xlink";

function create_XUL (window, tag_name) {
    return window.document.createElementNS(XUL_NS, tag_name);
}


/* Used in calls to XPath evaluate */
function xpath_lookup_namespace (prefix) {
    return {
        xhtml: XHTML_NS,
        m: MATHML_NS,
        xul: XUL_NS
    }[prefix] || null;
}

function method_caller (obj, func) {
    return function () {
        func.apply(obj, arguments);
    };
}


function get_window_from_frame (frame) {
    try {
        var window = frame.QueryInterface(Ci.nsIInterfaceRequestor)
            .getInterface(Ci.nsIWebNavigation)
            .QueryInterface(Ci.nsIDocShellTreeItem)
            .rootTreeItem
            .QueryInterface(Ci.nsIInterfaceRequestor)
            .getInterface(Ci.nsIDOMWindow).wrappedJSObject;
        /* window is now an XPCSafeJSObjectWrapper */
        window.escape_wrapper(function (w) { window = w; });
        /* window is now completely unwrapped */
        return window;
    } catch (e) {
        return null;
    }
}

function get_buffer_from_frame (window, frame) {
    var count = window.buffers.count;
    for (var i = 0; i < count; ++i) {
        var b = window.buffers.get_buffer(i);
        if (b.top_frame == frame.top)
            return b;
    }
    return null;
}


var conkeror_source_code_path = null;

function source_code_reference (uri, line_number) {
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
        yield open_with_external_editor(load_spec(this.best_uri),
                                        $line = this.line_number);
    }
};

var get_caller_source_code_reference_ignored_functions = {};

function get_caller_source_code_reference (extra_frames_back) {
    /* Skip at least this function itself and whoever called it (and
     * more if the caller wants to be skipped). */
    var frames_to_skip = 2;
    if (extra_frames_back != null)
        frames_to_skip += extra_frames_back;

    for (let f = Components.stack; f != null; f = f.caller) {
        if (frames_to_skip > 0) {
            --frames_to_skip;
            continue;
        }
        if (get_caller_source_code_reference_ignored_functions[f.name])
            continue;
        return new source_code_reference(f.filename, f.lineNumber);
    }

    return null;
}

function ignore_function_for_get_caller_source_code_reference (func_name) {
    get_caller_source_code_reference_ignored_functions[func_name] = 1;
}

require_later("external-editor.js");

function dom_generator (document, ns) {
    this.document = document;
    this.ns = ns;
}
dom_generator.prototype = {
    element : function (tag, parent) {
        var node = this.document.createElementNS(this.ns, tag);
        var i = 1;
        if (parent != null && (parent instanceof Ci.nsIDOMNode)) {
            parent.appendChild(node);
            i = 2;
        }
        for (var nargs = arguments.length; i < nargs; i += 2)
            node.setAttribute(arguments[i], arguments[i+1]);
        return node;
    },

    text : function (str, parent) {
        var node = this.document.createTextNode(str);
        if (parent)
            parent.appendChild(node);
        return node;
    },


    stylesheet_link : function (href, parent) {
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
function generate_QI () {
    var args = Array.prototype.slice.call(arguments).map(String).concat(["nsISupports"]);
    var fstr = "if(" +
        Array.prototype.map.call(args, function (x) {
            return "iid.equals(Components.interfaces." + x + ")";
        })
        .join("||") +
        ") return this; throw Components.results.NS_ERROR_NO_INTERFACE;";
    return new Function("iid", fstr);
}

const LOCALE_PREF = "general.useragent.locale";

function get_locale () {
    return get_localized_pref(LOCALE_PREF) || get_pref(LOCALE_PREF);
}

const USER_AGENT_OVERRIDE_PREF = "general.useragent.override";

function set_user_agent (str) {
    session_pref(USER_AGENT_OVERRIDE_PREF, str);
}

function define_builtin_commands (prefix, do_command_function, toggle_mark, mark_active_predicate, mode) {

    // Specify a docstring
    function D (cmd, docstring) {
        var o = new String(cmd);
        o.doc = docstring;
        return o;
    }

    // Specify a forward/reverse pair
    function R (a, b) {
        var o = [a,b];
        o.is_reverse_pair = true;
        return o;
    }

    // Specify a movement/select/scroll/move-caret command group.
    function S (command, movement, select, scroll, caret) {
        var o = [movement, select, scroll, caret];
        o.command = command;
        o.is_move_select_pair = true;
        return o;
    }

    var builtin_commands = [

        /*
         * cmd_scrollBeginLine and cmd_scrollEndLine don't do what I
         * want, either in or out of caret mode...
         */
        S(D("beginning-of-line", "Move or extend the selection to the beginning of the current line."),
          D("cmd_beginLine", "Move point to the beginning of the current line."),
          D("cmd_selectBeginLine", "Extend selection to the beginning of the current line."),
          D("cmd_beginLine", "Scroll to the beginning of the line"),
          D("cmd_beginLine", "Scroll to the beginning of the line")),
        S(D("end-of-line", "Move or extend the selection to the end of the current line."),
          D("cmd_endLine", "Move point to the end of the current line."),
          D("cmd_selectEndLine", "Extend selection to the end of the current line."),
          D("cmd_endLine", "Scroll to the end of the current line."),
          D("cmd_endLine", "Scroll to the end of the current line.")),
        S(D("beginning-of-first-line", "Move or extend the selection to the beginning of the first line."),
          D("cmd_moveTop", "Move point to the beginning of the first line."),
          D("cmd_selectTop", "Extend selection to the beginning of the first line."),
          D("cmd_scrollTop", "Scroll to the top of the buffer"),
          D("cmd_scrollTop", "Move point to the beginning of the first line.")),
        S(D("end-of-last-line", "Move or extend the selection to the end of the last line."),
          D("cmd_moveBottom", "Move point to the end of the last line."),
          D("cmd_selectBottom", "Extend selection to the end of the last line."),
          D("cmd_scrollBottom", "Scroll to the bottom of the buffer"),
          D("cmd_scrollBottom", "Move point to the end of the last line.")),
        "cmd_copyOrDelete",
        "cmd_scrollBeginLine",
        "cmd_scrollEndLine",
        "cmd_cutOrDelete",
        D("cmd_copy", "Copy the selection into the clipboard."),
        D("cmd_cut", "Cut the selection into the clipboard."),
        D("cmd_deleteToBeginningOfLine", "Delete to the beginning of the current line."),
        D("cmd_deleteToEndOfLine", "Delete to the end of the current line."),
        D("cmd_selectAll", "Select all."),
        D("cmd_scrollTop", "Scroll to the top of the buffer."),
        D("cmd_scrollBottom", "Scroll to the bottom of the buffer.")];

    var builtin_commands_with_count = [
        R(S(D("forward-char", "Move or extend the selection forward one character."),
            D("cmd_charNext", "Move point forward one character."),
            D("cmd_selectCharNext", "Extend selection forward one character."),
            D("cmd_scrollRight", "Scroll to the right"),
            D("cmd_scrollRight", "Scroll to the right")),
          S(D("backward-char", "Move or extend the selection backward one character."),
            D("cmd_charPrevious", "Move point backward one character."),
            D("cmd_selectCharPrevious", "Extend selection backward one character."),
            D("cmd_scrollLeft", "Scroll to the left."),
            D("cmd_scrollLeft", "Scroll to the left."))),
        R(D("cmd_deleteCharForward", "Delete the following character."),
          D("cmd_deleteCharBackward", "Delete the previous character.")),
        R(D("cmd_deleteWordForward", "Delete the following word."),
          D("cmd_deleteWordBackward", "Delete the previous word.")),
        R(S(D("forward-line", "Move or extend the selection forward one line."),
            D("cmd_lineNext", "Move point forward one line."),
            D("cmd_selectLineNext", "Extend selection forward one line."),
            D("cmd_scrollLineDown", "Scroll down one line."),
            D("cmd_scrollLineDown", "Scroll down one line.")),
          S(D("backward-line", "Move or extend the selection backward one line."),
            D("cmd_linePrevious", "Move point backward one line."),
            D("cmd_selectLinePrevious", "Extend selection backward one line."),
            D("cmd_scrollLineUp", "Scroll up one line."),
            D("cmd_scrollLineUp", "Scroll up one line."))),
        R(S(D("forward-page", "Move or extend the selection forward one page."),
            D("cmd_movePageDown", "Move point forward one page."),
            D("cmd_selectPageDown", "Extend selection forward one page."),
            D("cmd_scrollPageDown", "Scroll forward one page."),
            D("cmd_movePageDown", "Move point forward one page.")),
          S(D("backward-page", "Move or extend the selection backward one page."),
            D("cmd_movePageUp", "Move point backward one page."),
            D("cmd_selectPageUp", "Extend selection backward one page."),
            D("cmd_scrollPageUp", "Scroll backward one page."),
            D("cmd_movePageUp", "Move point backward one page."))),
        R(D("cmd_undo", "Undo last editing action."),
          D("cmd_redo", "Redo last editing action.")),
        R(S(D("forward-word", "Move or extend the selection forward one word."),
            D("cmd_wordNext", "Move point forward one word."),
            D("cmd_selectWordNext", "Extend selection forward one word."),
            D("cmd_scrollRight", "Scroll to the right."),
            D("cmd_wordNext", "Move point forward one word.")),
          S(D("backward-word", "Move or extend the selection backward one word."),
            D("cmd_wordPrevious", "Move point backward one word."),
            D("cmd_selectWordPrevious", "Extend selection backward one word."),
            D("cmd_scrollLeft", "Scroll to the left."),
            D("cmd_wordPrevious", "Move point backward one word."))),
        R(D("cmd_scrollPageUp", "Scroll up one page."),
          D("cmd_scrollPageDown", "Scroll down one page.")),
        R(D("cmd_scrollLineUp", "Scroll up one line."),
          D("cmd_scrollLineDown", "Scroll down one line.")),
        R(D("cmd_scrollLeft", "Scroll left."),
          D("cmd_scrollRight", "Scroll right.")),
        D("cmd_paste", "Insert the contents of the clipboard.")];

    interactive(prefix + "set-mark",
                "Toggle whether the mark is active.\n" +
                "When the mark is active, movement commands affect the selection.",
                toggle_mark);

    function get_mode_idx () {
        if (mode == 'scroll') return 2;
        else if (mode == 'caret') return 3;
        else return 0;
    }

    function get_move_select_idx (I) {
        return mark_active_predicate(I) ? 1 : get_mode_idx();
    }

    function doc_for_builtin (c) {
        var s = "";
        if (c.doc != null)
            s += c.doc + "\n";
        return s + "Run the built-in command " + c + ".";
    }

    function define_simple_command (c) {
        interactive(prefix + c, doc_for_builtin(c), function (I) { do_command_function(I, c); });
    }

    function get_move_select_doc_string (c) {
        return c.command.doc +
            "\nSpecifically, if the mark is active, runs `" + prefix + c[1] + "'.  " +
            "Otherwise, runs `" + prefix + c[get_mode_idx()] + "'\n" +
            "To toggle whether the mark is active, use `" + prefix + "set-mark'.";
    }

    for each (let c_temp in builtin_commands) {
        let c = c_temp;
        if (c.is_move_select_pair) {
            interactive(prefix + c.command, get_move_select_doc_string(c), function (I) {
                var idx = get_move_select_idx(I);
                do_command_function(I, c[idx]);
            });
            define_simple_command(c[0]);
            define_simple_command(c[1]);
        }
        else
            define_simple_command(c);
    }

    function get_reverse_pair_doc_string (main_doc, alt_command) {
        return main_doc + "\n" +
            "The prefix argument specifies a repeat count for this command.  " +
            "If the count is negative, `" + prefix + alt_command + "' is performed instead with " +
            "a corresponding positive repeat count.";
    }

    function define_simple_reverse_pair (a, b) {
        interactive(prefix + a, get_reverse_pair_doc_string(doc_for_builtin(a), b),
                    function (I) {
                        do_repeatedly(do_command_function, I.p, [I, a], [I, b]);
                    });
        interactive(prefix + b, get_reverse_pair_doc_string(doc_for_builtin(b), a),
                    function (I) {
                        do_repeatedly(do_command_function, I.p, [I, b], [I, a]);
                    });
    }

    for each (let c_temp in builtin_commands_with_count) {
        let c = c_temp;
        if (c.is_reverse_pair) {
            if (c[0].is_move_select_pair) {
                interactive(prefix + c[0].command, get_reverse_pair_doc_string(get_move_select_doc_string(c[0]),
                                                                               c[1].command),
                            function (I) {
                                var idx = get_move_select_idx(I);
                                do_repeatedly(do_command_function, I.p, [I, c[0][idx]], [I, c[1][idx]]);
                            });
                interactive(prefix + c[1].command, get_reverse_pair_doc_string(get_move_select_doc_string(c[1]),
                                                                               c[0].command),
                            function (I) {
                                var idx = get_move_select_idx(I);
                                do_repeatedly(do_command_function, I.p, [I, c[1][idx]], [I, c[0][idx]]);
                            });
                define_simple_reverse_pair(c[0][0], c[1][0]);
                define_simple_reverse_pair(c[0][1], c[1][1]);
            } else
                define_simple_reverse_pair(c[0], c[1]);
        } else {
            let doc = doc_for_builtin(c) +
                "\nThe prefix argument specifies a positive repeat count for this command.";
            interactive(prefix + c, doc, function (I) {
                do_repeatedly_positive(do_command_function, I.p, I, c);
            });
        }
    }
}


function abort (str) {
    var e = new Error(str);
    e.__proto__ = abort.prototype;
    return e;
}
abort.prototype.__proto__ = Error.prototype;


function get_temporary_file (name) {
    if (name == null)
        name = "temp.txt";
    var file = file_locator_service.get("TmpD", Ci.nsIFile);
    file.append(name);
    // Create the file now to ensure that no exploits are possible
    file.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, 0600);
    return file;
}


/* FIXME: This should be moved somewhere else, perhaps. */
function create_info_panel (window, panel_class, row_arr) {
    /* Show information panel above minibuffer */

    var g = new dom_generator(window.document, XUL_NS);

    var p = g.element("vbox", "class", "panel " + panel_class, "flex", "0");
    var grid = g.element("grid", p);
    var cols = g.element("columns", grid);
    g.element("column", cols, "flex", "0");
    g.element("column", cols, "flex", "1");

    var rows = g.element("rows", grid);
    var row;

    for each (let [row_class, row_label, row_value] in row_arr) {
        row = g.element("row", rows, "class", row_class);
        g.element("label", row,
                  "value", row_label,
                  "class", "panel-row-label");
        g.element("label", row,
                  "value", row_value,
                  "class", "panel-row-value",
                  "crop", "end");
    }
    window.minibuffer.insert_before(p);

    p.destroy = function () {
        this.parentNode.removeChild(this);
    };

    return p;
}


/**
 * Paste from the X primary selection, unless the system doesn't support a
 * primary selection, in which case fall back to the clipboard.
 */
function read_from_x_primary_selection () {
    // Get clipboard.
    let clipboard = Components.classes["@mozilla.org/widget/clipboard;1"]
        .getService(Components.interfaces.nsIClipboard);

    // Fall back to global clipboard if the system doesn't support a selection
    let which_clipboard = clipboard.supportsSelectionClipboard() ?
        clipboard.kSelectionClipboard : clipboard.kGlobalClipboard;

    let flavors = ["text/unicode"];

    // Don't barf if there's nothing on the clipboard
    if (!clipboard.hasDataMatchingFlavors(flavors, flavors.length, which_clipboard))
        return "";

    // Create transferable that will transfer the text.
    let trans = Components.classes["@mozilla.org/widget/transferable;1"]
        .createInstance(Components.interfaces.nsITransferable);

    for each (let flavor in flavors) {
        trans.addDataFlavor(flavor);
    }
    clipboard.getData(trans, which_clipboard);

    var data_flavor = {};
    var data = {};
    var dataLen = {};
    trans.getAnyTransferData(data_flavor, data, dataLen);

    if (data) {
        data = data.value.QueryInterface(Components.interfaces.nsISupportsString);
        let data_length = dataLen.value;
        if (data_flavor.value == "text/unicode")
            data_length = dataLen.value / 2;
        return data.data.substring(0, data_length);
    } else {
        return "";
    }
}

var user_variables = {};

function define_variable (name, default_value, doc) {
    conkeror[name] = default_value;
    user_variables[name] = {
        default_value: default_value,
        doc: doc,
        shortdoc: get_shortdoc_string(doc),
        source_code_reference: get_caller_source_code_reference()
    };
}

function define_special_variable (name, getter, setter, doc) {
    conkeror.__defineGetter__(name, getter);
    conkeror.__defineSetter__(name, setter);
    user_variables[name] = {
        default_value: undefined,
        doc: doc,
        shortdoc: get_shortdoc_string(doc),
        source_code_reference: get_caller_source_code_reference()
    };
}

/* Re-define load_paths as a user variable. */
define_variable("load_paths", load_paths,
                "Array of URL prefixes searched in order when loading a module.\n" +
                "Each entry must end in a slash, and should begin with file:// or chrome://.");

/*
 * Stylesheets
 */
function register_user_stylesheet (url) {
    var uri = make_uri(url);
    var sss = Cc["@mozilla.org/content/style-sheet-service;1"]
        .getService(Ci.nsIStyleSheetService);
    sss.loadAndRegisterSheet(uri, sss.USER_SHEET);
}

function unregister_user_stylesheet (url) {
    var uri = make_uri(url);
    var sss = Cc["@mozilla.org/content/style-sheet-service;1"]
        .getService(Ci.nsIStyleSheetService);
    if (sss.sheetRegistered(uri, sss.USER_SHEET))
        sss.unregisterSheet(uri, sss.USER_SHEET);
}

function register_agent_stylesheet (url) {
    var uri = make_uri(url);
    var sss = Cc["@mozilla.org/content/style-sheet-service;1"]
        .getService(Ci.nsIStyleSheetService);
    sss.loadAndRegisterSheet(uri, sss.AGENT_SHEET);
}

function unregister_agent_stylesheet (url) {
    var uri = make_uri(url);
    var sss = Cc["@mozilla.org/content/style-sheet-service;1"]
        .getService(Ci.nsIStyleSheetService);
    if (sss.sheetRegistered(uri, sss.AGENT_SHEET))
        sss.unregisterSheet(uri, sss.AGENT_SHEET);
}

function agent_stylesheet_registered_p (url) {
    var uri = make_uri(url);
    var sss = Cc["@mozilla.org/content/style-sheet-service;1"]
        .getService(Ci.nsIStyleSheetService);
    return sss.sheetRegistered(uri, sss.AGENT_SHEET);
}

function user_stylesheet_registered_p (url) {
    var uri = make_uri(url);
    var sss = Cc["@mozilla.org/content/style-sheet-service;1"]
        .getService(Ci.nsIStyleSheetService);
    return sss.sheetRegistered(uri, sss.USER_SHEET);
}



function predicate_alist_match (alist, key) {
    for each (let i in alist) {
        if (i[0](key))
            return i[1];
    }
    return undefined;
}


function get_meta_title (doc) {
    var title = doc.evaluate("//meta[@name='title']/@content", doc, xpath_lookup_namespace,
                             Ci.nsIDOMXPathResult.STRING_TYPE , null);
    if (title && title.stringValue)
        return title.stringValue;
    return null;
}


const PREFIX_ITEM_URI = "urn:mozilla:item:";
const PREFIX_NS_EM = "http://www.mozilla.org/2004/em-rdf#";

var extension_manager = Cc["@mozilla.org/extensions/manager;1"]
    .getService(Ci.nsIExtensionManager);

function get_extension_rdf_property (id, name, type) {
    const rdf_service = Cc["@mozilla.org/rdf/rdf-service;1"]
        .getService(Ci.nsIRDFService);
    var value = extension_manager.datasource.GetTarget(
        rdf_service.GetResource(PREFIX_ITEM_URI + id),
        rdf_service.GetResource(PREFIX_NS_EM + name),
        true);
    if (value == null)
        return null;
    return value.QueryInterface(type || Ci.nsIRDFLiteral).Value;
}

function get_extension_update_item (id) {
    return extension_manager.getItemForID(id);
}

function extension_info (id) {
    this.id = id;
}
extension_info.prototype = {
    // Returns the nsIUpdateItem object associated with this extension
    get update_item () { return get_extension_update_item(this.id); },

    get_rdf_property : function (name, type) {
        return get_extension_rdf_property(this.id, name, type);
    },

    // RDF properties
    get isDisabled () { return this.get_rdf_property("isDisabled"); },
    get aboutURL () { return this.get_rdf_property("aboutURL"); },
    get addonID () { return this.get_rdf_property("addonID"); },
    get availableUpdateURL () { return this.get_rdf_property("availableUpdateURL"); },
    get availableUpdateVersion () { return this.get_rdf_property("availableUpdateVersion"); },
    get blocklisted () { return this.get_rdf_property("blocklisted"); },
    get compatible () { return this.get_rdf_property("compatible"); },
    get description () { return this.get_rdf_property("description"); },
    get downloadURL () { return this.get_rdf_property("downloadURL"); },
    get isDisabled () { return this.get_rdf_property("isDisabled"); },
    get hidden () { return this.get_rdf_property("hidden"); },
    get homepageURL () { return this.get_rdf_property("homepageURL"); },
    get iconURL () { return this.get_rdf_property("iconURL"); },
    get internalName () { return this.get_rdf_property("internalName"); },
    get locked () { return this.get_rdf_property("locked"); },
    get name () { return this.get_rdf_property("name"); },
    get optionsURL () { return this.get_rdf_property("optionsURL"); },
    get opType () { return this.get_rdf_property("opType"); },
    get plugin () { return this.get_rdf_property("plugin"); },
    get previewImage () { return this.get_rdf_property("previewImage"); },
    get satisfiesDependencies () { return this.get_rdf_property("satisfiesDependencies"); },
    get providesUpdatesSecurely () { return this.get_rdf_property("providesUpdatesSecurely"); },
    get type () { return this.get_rdf_property("type", Ci.nsIRDFInt); },
    get updateable () { return this.get_rdf_property("updateable"); },
    get updateURL () { return this.get_rdf_property("updateURL"); },
    get version () { return this.get_rdf_property("version"); }
};

function extension_is_enabled (id) {
    var info = new extension_info(id);
    return info.update_item && (info.isDisabled == "false");
}

function queue () {
    this.input = [];
    this.output = [];
}
queue.prototype = {
    get length () {
        return this.input.length + this.output.length;
    },
    push: function (x) {
        this.input[this.input.length] = x;
    },
    pop: function (x) {
        let l = this.output.length;
        if (!l) {
            l = this.input.length;
            if (!l)
                return undefined;
            this.output = this.input.reverse();
            this.input = [];
            let x = this.output[l];
            this.output.length--;
            return x;
        }
    }
};

function frame_iterator (root_frame, start_with) {
    var q = new queue, x;
    if (start_with) {
        x = start_with;
        do {
            yield x;
            for (let i = 0, nframes = x.frames.length; i < nframes; ++i)
                q.push(x.frames[i]);
        } while ((x = q.pop()));
    }
    x = root_frame;
    do {
        if (x == start_with)
            continue;
        yield x;
        for (let i = 0, nframes = x.frames.length; i < nframes; ++i)
            q.push(x.frames[i]);
    } while ((x = q.pop()));
}

function xml_http_request () {
    return Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]
        .createInstance(Ci.nsIXMLHttpRequest)
        .QueryInterface(Ci.nsIJSXMLHttpRequest)
        .QueryInterface(Ci.nsIDOMEventTarget);
}

var xml_http_request_load_listener = {
  // nsIBadCertListener2
  notifyCertProblem: function SSLL_certProblem (socketInfo, status, targetSite) {
    return true;
  },

  // nsISSLErrorListener
  notifySSLError: function SSLL_SSLError (socketInfo, error, targetSite) {
    return true;
  },

  // nsIInterfaceRequestor
  getInterface: function SSLL_getInterface (iid) {
    return this.QueryInterface(iid);
  },

  // nsISupports
  //
  // FIXME: array comprehension used here to hack around the lack of
  // Ci.nsISSLErrorListener in 2007 versions of xulrunner 1.9pre.
  // make it a simple generateQI when xulrunner is more stable.
  QueryInterface: XPCOMUtils.generateQI(
      [i for each (i in [Ci.nsIBadCertListener2,
                         Ci.nsISSLErrorListener,
                         Ci.nsIInterfaceRequestor])
       if (i)])
};


/**
 * Coroutine interface for sending an HTTP request and waiting for the
 * response. (This includes so-called "AJAX" requests.)
 *
 * @param lspec (required) a load_spec object or URI string (see load-spec.js)
 *
 * The request URI is obtained from this argument. In addition, if the
 * load spec specifies post data, a POST request is made instead of a
 * GET request, and the post data included in the load spec is
 * sent. Specifically, the request_mime_type and raw_post_data
 * properties of the load spec are used.
 *
 * @param $user (optional) HTTP user name to include in the request headers
 * @param $password (optional) HTTP password to include in the request headers
 *
 * @param $override_mime_type (optional) Force the response to be interpreted
 *                            as having the specified MIME type.  This is only
 *                            really useful for forcing the MIME type to be
 *                            text/xml or something similar, such that it is
 *                            automatically parsed into a DOM document.
 * @param $headers (optional) an array of [name,value] pairs (each specified as
 *                 a two-element array) specifying additional headers to add to
 *                 the request.
 *
 * @returns After the request completes (either successfully or with an error),
 *          the nsIXMLHttpRequest object is returned.  Its responseText (for any
 *          arbitrary document) or responseXML (if the response type is an XML
 *          content type) properties can be accessed to examine the response
 *          document.
 *
 * If an exception is thrown to the continutation (which can be obtained by the
 * caller by calling yield CONTINUATION prior to calling this function) while the
 * request is in progress (i.e. before this coroutine returns), the request will
 * be aborted, and the exception will be propagated to the caller.
 *
 **/
define_keywords("$user", "$password", "$override_mime_type", "$headers");
function send_http_request (lspec) {
    // why do we get warnings in jsconsole unless we initialize the
    // following keywords?
    keywords(arguments, $user = undefined, $password = undefined,
             $override_mime_type = undefined, $headers = undefined);
    if (! (lspec instanceof load_spec))
        lspec = load_spec(lspec);
    var req = xml_http_request();
    var cc = yield CONTINUATION;
    var aborting = false;
    req.onreadystatechange = function send_http_request__onreadysatechange () {
        if (req.readyState != 4)
            return;
        if (aborting)
            return;
        cc();
    };

    if (arguments.$override_mime_type)
        req.overrideMimeType(arguments.$override_mime_type);

    var post_data = load_spec_raw_post_data(lspec);

    var method = post_data ? "POST" : "GET";

    req.open(method, load_spec_uri_string(lspec), true, arguments.$user, arguments.$password);
    req.channel.notificationCallbacks = xml_http_request_load_listener;

    for each (let [name,value] in arguments.$headers) {
        req.setRequestHeader(name, value);
    }

    if (post_data) {
        req.setRequestHeader("Content-Type", load_spec_request_mime_type(lspec));
        req.send(post_data);
    } else
        req.send(null);

    try {
        yield SUSPEND;
    } catch (e) {
        aborting = true;
        req.abort();
        throw e;
    }

    // Let the caller access the status and reponse data
    yield co_return(req);
}


/**
 * scroll_selection_into_view takes an editable element, and scrolls it so
 * that the selection (or insertion point) are visible.
 */
function scroll_selection_into_view (field) {
    if (field.namespaceURI == XUL_NS)
        field = field.inputField;
    try {
        field.QueryInterface(Ci.nsIDOMNSEditableElement)
            .editor
            .selectionController
            .scrollSelectionIntoView(
                Ci.nsISelectionController.SELECTION_NORMAL,
                Ci.nsISelectionController.SELECTION_FOCUS_REGION,
                true);
    } catch (e) {
        // we'll get here for richedit fields
    }
}


/**
 * build_url_regex builds a regular expression to match URLs for a given
 * web site.
 *
 * Both the $domain and $path arguments can be either regexes, in
 * which case they will be matched as is, or strings, in which case
 * they will be matched literally.
 *
 * $tlds specifies a list of valid top-level-domains to match, and
 * defaults to .com. Useful for when e.g. foo.org and foo.com are the
 * same.
 *
 * If $allow_www is true, www.domain.tld will also be allowed.
 */
define_keywords("$domain", "$path", "$tlds", "$allow_www");
function build_url_regex () {
    function regex_to_string (obj) {
        if (obj instanceof RegExp)
            return obj.source;
        return quotemeta(obj);
    }

    keywords(arguments, $path = "", $tlds = ["com"], $allow_www = false);
    var domain = regex_to_string(arguments.$domain);
    if(arguments.$allow_www) {
        domain = "(?:www\.)?" + domain;
    }
    var path   = regex_to_string(arguments.$path);
    var tlds   = arguments.$tlds;
    var regex = "^https?://" + domain + "\\." + choice_regex(tlds) + "/" + path;
    return new RegExp(regex);
}

/**
 * splice_ranges: Given an ordered array of non-overlapping ranges,
 * represented as elements of [start, end], insert a new range into the
 * array, extending, replacing, or merging existing ranges as needed.
 * Mutates `arr' in place, but returns the reference to it.
 *
 * Examples:
 *
 * splice_range([[1,3],[4,6], 5, 8)
 *  => [[1,3],[4,8]]
 *
 * splice_range([[1,3],[4,6],[7,10]], 2, 8)
 *  => [[1,10]]
 */
function splice_range (arr, start, end) {
    for (var i = 0; i < arr.length; ++i) {
        let [n,m] = arr[i];
        if (start > m)
            continue;
        if (end < n) {
            arr.splice(i, 0, [start, end]);
            break;
        }
        if (start < n)
            arr[i][0] = start;

        if (end >= n) {
            /*
             * The range we are inserting overlaps the current
             * range. We need to scan right to see if it also contains any other
             * ranges entirely, and remove them if necessary.
             */
            var j = i;
            while (j < arr.length && end >= arr[j][0])
                j++;
            j--;
            arr[i][1] = Math.max(end, arr[j][1]);
            arr.splice(i + 1, j - i);
            break;
        }
    }
    if (start > arr[arr.length - 1][1])
        arr.push([start, end]);
    return arr;
}


function compute_url_up_path (url) {
    var new_url = Cc["@mozilla.org/network/standard-url;1"]
        .createInstance (Ci.nsIURL);
    new_url.spec = url;
    var up;
    if (new_url.param != "" || new_url.query != "")
        up = new_url.filePath;
    else if (new_url.fileName != "")
        up = ".";
    else
        up = "..";
    return up;
}


function url_path_trim (url) {
    var uri = make_uri(url);
    uri.spec = url;
    uri.path = "";
    return uri.spec;
}

/* possibly_valid_url returns true if the string might be a valid
 * thing to pass to nsIWebNavigation.loadURI.  Currently just checks
 * that there's no whitespace in the middle and that it's not entirely
 * whitespace.
 */
function possibly_valid_url (url) {
    return !(/\S\s+\S/.test(url)) && !(/^\s*$/.test(url));
}


/* remove_duplicates_filter returns a function that can be
 * used in Array.filter.  It removes duplicates.
 */
function remove_duplicates_filter () {
    var acc = {};
    return function (x) {
        if (acc[x]) return false;
        acc[x] = 1;
        return true;
    };
}


/**
 * Given an array, switches places on the subarrays at index i1 to i2 and j1 to
 * j2. Leaves the rest of the array unchanged.
 */
function switch_subarrays (arr, i1, i2, j1, j2) {
    return arr.slice(0, i1) +
        arr.slice(j1, j2) +
        arr.slice(i2, j1) +
        arr.slice(i1, i2) +
        arr.slice(j2, arr.length);
}


/**
 * Convenience function for making simple XPath lookups in a document.
 *
 * @param doc The document to look in.
 * @param exp The XPath expression to search for.
 * @return The XPathResult object representing the set of found nodes.
 */
function xpath_lookup (doc, exp) {
    return doc.evaluate(exp, doc, null, Ci.nsIDOMXPathResult.ANY_TYPE, null);
}


/* get_contents_synchronously returns the contents of the given
 * url (string or nsIURI) as a string on success, or null on failure.
 */
function get_contents_synchronously (url) {
    var ioService=Cc["@mozilla.org/network/io-service;1"]
        .getService(Ci.nsIIOService);
    var scriptableStream=Cc["@mozilla.org/scriptableinputstream;1"]
        .getService(Ci.nsIScriptableInputStream);
    var channel;
    var input;
    try {
        if (url instanceof Ci.nsIURI)
            channel = ioService.newChannelFromURI(url);
        else
            channel = ioService.newChannel(url, null, null);
        input=channel.open();
    } catch (e) {
        return null;
    }
    scriptableStream.init(input);
    var str=scriptableStream.read(input.available());
    scriptableStream.close();
    input.close();
    return str;
}


/**
 * dom_add_class adds a css class to the given dom node.
 */
function dom_add_class (node, cssclass) {
    if (node.className)
        node.className += " "+cssclass;
    else
        node.className = cssclass;
}

/**
 * dom_remove_class removes the given css class from the given dom node.
 */
function dom_remove_class (node, cssclass) {
    if (! node.className)
        return;
    var classes = node.className.split(" ");
    classes = classes.filter(function (x) { return x != cssclass; });
    node.className = classes.join(" ");
}


/**
 * dom_node_flash adds the given cssclass to the node for a brief interval.
 * this class can be styled, to create a flashing effect.
 */
function dom_node_flash (node, cssclass) {
    dom_add_class(node, cssclass);
    call_after_timeout(
        function () {
            dom_remove_class(node, cssclass);
        },
        400);
}


/**
 * data is an an alist (array of 2 element arrays) where each pair is a key
 * and a value.
 *
 * The return type is a mime input stream that can be passed as postData to
 * nsIWebNavigation.loadURI.  In terms of Conkeror's API, the return value
 * of this function is of the correct type for the `post_data' field of a
 * load_spec.
 */
function make_post_data (data) {
    data = [(encodeURIComponent(pair[0])+'='+encodeURIComponent(pair[1]))
            for each (pair in data)].join('&');
    data = string_input_stream(data);
    return mime_input_stream(
        data, [["Content-Type", "application/x-www-form-urlencoded"]]);
}


/**
 * Centers the viewport around a given element.
 *
 * @param win  The window to scroll.
 * @param elem The element arund which we put the viewport.
 */
function center_in_viewport (win, elem) {
    let point = abs_point(elem);

    point.x -= win.innerWidth / 2;
    point.y -= win.innerHeight / 2;

    win.scrollTo(point.x, point.y);
}


/**
 * Takes an interactive context and a function to call with the word
 * at point as its sole argument, and which returns a modified word.
 */
//XXX: this should be implemented in terms of modify_region,
//     in order to work in richedit fields.
function modify_word_at_point (I, func) {
    var focused = I.buffer.focused_element;

    // Skip any whitespaces at point and move point to the right place.
    var point = focused.selectionStart;
    var rest = focused.value.substring(point);

    // Skip any whitespaces.
    for (var i = 0, rlen = rest.length; i < rlen; i++) {
        if (" \n".indexOf(rest.charAt(i)) == -1) {
            point += i;
            break;
        }
    }

    // Find the next whitespace, as it is the end of the word.  If no next
    // whitespace is found, we're at the end of input.  TODO: Add "\n" support.
    goal = focused.value.indexOf(" ", point);
    if (goal == -1)
        goal = focused.value.length;

    // Change the value of the text field.
    var input = focused.value;
    focused.value =
        input.substring(0, point) +
        func(input.substring(point, goal)) +
        input.substring(goal);

    // Move point.
    focused.selectionStart = goal;
    focused.selectionEnd = goal;
}


/**
 * Simple predicate returns true if elem is an nsIDOMNode or
 * nsIDOMWindow.
 */
function element_dom_node_or_window_p (elem) {
    if (elem instanceof Ci.nsIDOMNode)
        return true;
    if (elem instanceof Ci.nsIDOMWindow)
        return true;
    return false;
}

/**
 * Given a hook name, a buffer and a function, waits until the buffer document
 * has fully loaded, then calls the function with the buffer as its only
 * argument.
 *
 * @param {String} The hook name.
 * @param {buffer} The buffer.
 * @param {function} The function to call with the buffer as its argument once
 *                   the buffer has loaded.
 */
function do_when (hook, buffer, fun) {
    if (buffer.browser.webProgress.isLoadingDocument)
	add_hook.call(buffer, hook, fun);
    else
	fun(buffer);
}
