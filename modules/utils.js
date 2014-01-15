/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2011 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("io");

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
    if (path == "~")
        return get_home_directory();
    if (WINDOWS)
        path = path.replace("/", "\\", "g");
    if ((POSIX && path.substring(0,2) == "~/") ||
        (WINDOWS && path.substring(0,2) == "~\\"))
    {
        var f = get_home_directory();
        f.appendRelativePath(path.substring(2));
    } else {
        f = Cc["@mozilla.org/file/local;1"]
            .createInstance(Ci.nsILocalFile);
        f.initWithPath(path);
    }
    return f;
}


function make_file_from_chrome (url) {
    var crs = Cc['@mozilla.org/chrome/chrome-registry;1']
        .getService(Ci.nsIChromeRegistry);
    var file = crs.convertChromeURL(make_uri(url));
    return make_file(file.path);
}


/**
 * file_symlink_p takes an nsIFile and returns the value of
 * file.isSymlink(), but also catches the error and returns false if the
 * file does not exist.  Note that this cannot be tested with
 * file.exists(), because that method automatically resolves symlinks.
 */
function file_symlink_p (file) {
    try {
        return file.isSymlink();
    } catch (e if (e instanceof Ci.nsIException) &&
             e.result == Cr.NS_ERROR_FILE_TARGET_DOES_NOT_EXIST)
    {
        return false;
    }
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
        // node = orig;
        // while (node.tagName != "BODY") {
        //     alert("okay: " + node + " " + node.tagName + " " + pt.x + " " + pt.y);
        //     node = node.offsetParent;
        // }
    }
    return pt;
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

var abort = task_canceled;

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


/*
 * Return clipboard contents as string.  When which_clipboard is given, it
 * may be an nsIClipboard constant specifying which clipboard to use.
 */
function read_from_clipboard (which_clipboard) {
    var clipboard = Cc["@mozilla.org/widget/clipboard;1"]
        .getService(Ci.nsIClipboard);
    if (which_clipboard == null)
        which_clipboard = clipboard.kGlobalClipboard;

    var flavors = ["text/unicode"];

    // Don't barf if there's nothing on the clipboard
    if (!clipboard.hasDataMatchingFlavors(flavors, flavors.length, which_clipboard))
        return "";

    // Create transferable that will transfer the text.
    var trans = Cc["@mozilla.org/widget/transferable;1"]
        .createInstance(Ci.nsITransferable);

    for each (let flavor in flavors) {
        trans.addDataFlavor(flavor);
    }
    clipboard.getData(trans, which_clipboard);

    var data_flavor = {};
    var data = {};
    var dataLen = {};
    trans.getAnyTransferData(data_flavor, data, dataLen);

    if (data) {
        data = data.value.QueryInterface(Ci.nsISupportsString);
        var data_length = dataLen.value;
        if (data_flavor.value == "text/unicode")
            data_length = dataLen.value / 2;
        return data.data.substring(0, data_length);
    } else
        return ""; //XXX: is this even reachable?
}


/**
 * Return selection clipboard contents as a string, or regular clipboard
 * contents if the system does not support a selection clipboard.
 */
function read_from_x_primary_selection () {
    var clipboard = Cc["@mozilla.org/widget/clipboard;1"]
        .getService(Ci.nsIClipboard);
    // fall back to global clipboard if the
    // system doesn't support a selection
    var which_clipboard = clipboard.supportsSelectionClipboard() ?
        clipboard.kSelectionClipboard : clipboard.kGlobalClipboard;
    return read_from_clipboard(which_clipboard);
}


function predicate_alist_match (alist, key) {
    for each (let i in alist) {
        if (i[0] instanceof RegExp) {
            if (i[0].exec(key))
                return i[1];
        } else if (i[0](key))
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


function queue () {
    this.input = [];
    this.output = [];
}
queue.prototype = {
    constructor: queue,
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

function for_each_frame (win, callback) {
    callback(win);
    if (win.frames && win.frames.length) {
        for (var i = 0, n = win.frames.length; i < n; ++i)
            for_each_frame(win.frames[i], callback);
    }
}

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
 * Promise interface for sending an HTTP request and waiting for the
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
 * @returns Promise that resolves to nsIXMLHttpRequest after the request
 *          completes (either successfully or with an error).  Its responseText
 *          (for any arbitrary document) or responseXML (if the response type is
 *          an XML content type) properties can be accessed to examine the
 *          response document.
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

    let deferred = Promise.defer();
    req.onreadystatechange = function send_http_request__onreadystatechange () {
        if (req.readyState != 4)
            return;
        deferred.resolve(req);
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

    return make_simple_cancelable(deferred);
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


function compute_up_url (uri) {
    try {
        uri = uri.clone().QueryInterface(Ci.nsIURL);
    } catch (e) {
        return uri.spec;
    }
    for (let [k, p] in Iterator(["ref", "query", "param", "fileName"])) {
        if (p in uri && uri[p] != "") {
            uri[p] = "";
            return uri.spec;
        }
    }
    return uri.resolve("..");
}


function url_path_trim (url) {
    var uri = make_uri(url);
    uri.spec = url;
    uri.path = "";
    return uri.spec;
}

/**
 * possibly_valid_url returns true if its argument is an url-like string,
 * meaning likely a valid thing to pass to nsIWebNavigation.loadURI.
 */
function possibly_valid_url (str) {
    // no inner space before first /
    return /^\s*[^\/\s]*(\/|\s*$)/.test(str)
        && !(/^\s*$/.test(str));
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
 * Simple predicate returns true if elem is an nsIDOMNode or
 * nsIDOMWindow.
 */
function dom_node_or_window_p (elem) {
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


/**
 * evaluate string s as javascript in the 'this' scope in which evaluate
 * is called.
 */
function evaluate (s) {
    try {
        var obs = Cc["@mozilla.org/observer-service;1"]
            .getService(Ci.nsIObserverService);
        obs.notifyObservers(null, "startupcache-invalidate", null);
        var temp = get_temporary_file("conkeror-evaluate.tmp.js");
        write_text_file(temp, s);
        var url = make_uri(temp).spec;
        return load_url(url, this);
    } finally {
        if (temp && temp.exists())
            temp.remove(false);
    }
}


/**
 * set_protocol_handler takes a protocol and a handler spec.  If the
 * handler is true, Mozilla will (try to) handle this protocol internally.
 * If the handler null, the user will be prompted for a handler when a
 * resource of this protocol is requested.  If the handler is an nsIFile,
 * the program it gives will be launched with the url as an argument.  If
 * the handler is a string, it will be interpreted as an URL template for
 * a web service and the sequence '%s' within it will be replaced by the
 * url-encoded url.
 */
function set_protocol_handler (protocol, handler) {
    var eps = Cc["@mozilla.org/uriloader/external-protocol-service;1"]
        .getService(Ci.nsIExternalProtocolService);
    var info = eps.getProtocolHandlerInfo(protocol);
    var expose_pref = "network.protocol-handler.expose."+protocol;
    if (handler == true) {
        // internal handling
        clear_default_pref(expose_pref);
    } else if (handler) {
        // external handling
        if (handler instanceof Ci.nsIFile) {
            var h = Cc["@mozilla.org/uriloader/local-handler-app;1"]
                .createInstance(Ci.nsILocalHandlerApp);
            h.executable = handler;
        } else if (typeof handler == "string") {
            h = Cc["@mozilla.org/uriloader/web-handler-app;1"]
                .createInstance(Ci.nsIWebHandlerApp);
            var uri = make_uri(handler);
            h.name = uri.host;
            h.uriTemplate = handler;
        }
        info.alwaysAskBeforeHandling = false;
        info.preferredAction = Ci.nsIHandlerInfo.useHelperApp;
        info.possibleApplicationHandlers.clear();
        info.possibleApplicationHandlers.appendElement(h, false);
        info.preferredApplicationHandler = h;
        session_pref(expose_pref, false);
    } else {
        // prompt
        info.alwaysAskBeforeHandling = true;
        info.preferredAction = Ci.nsIHandlerInfo.alwaysAsk;
        session_pref(expose_pref, false);
    }
    var hs = Cc["@mozilla.org/uriloader/handler-service;1"]
        .getService(Ci.nsIHandlerService);
    hs.store(info);
}

provide("utils");
