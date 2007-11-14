
function define_frame_local_hook(hook_name)
{
    initialize_hook(hook_name).run = function (frame) {
        run_hooks(this, arguments);
        run_hooks(frame[hook_name], arguments);
    }
}

define_hook("make_frame_hook");

var window_watcher = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);

function generate_new_frame_tag(tag)
{
    var existing = [];
    var exact_match = false;
    var en = window_watcher.getWindowEnumerator ();
    if (tag == '') { tag = null; }
    var re;
    if (tag) {
        re = new RegExp ("^" + tag + "<(\\d+)>$");
    } else {
        re = new RegExp ("^(\\d+)$");
    }
    while (en.hasMoreElements ()) {
        var w = en.getNext().QueryInterface (Ci.nsIDOMWindow);
        if ('tag' in w)  {
            if (tag && w.tag == tag) {
                exact_match = true;
                continue;
            }
            var re_result = re.exec (w.tag);
            if (re_result)
                existing.push (re_result[1]);
        }
    }
    if (tag && ! exact_match)
        return tag;

    existing.sort (function (a, b) { return a - b; });

    var n = 1;
    for (var i = 0; i < existing.length; i++) {
        if (existing[i] < n) continue;
        if (existing[i] == n) { n++; continue; }
        break;
    }
    if (tag) {
        return tag + "<" + n + ">";
    } else {
        return n;
    }
}


function encode_xpcom_structure(data)
{
    var ret = null;
    if (typeof data == 'string') {
        ret = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
        ret.data = data;
    } else if (typeof data == 'object') { // should be a check for array.
        ret = Cc["@mozilla.org/array;1"].createInstance(Ci.nsIMutableArray);
        for (var i = 0; i < data.length; i++) {
            ret.appendElement (this.encode_xpcom_structure (data[i]), false);
        }
    } else {
        throw new Error('make_xpcom_struct was given something other than String or Array');
    }
    return ret;
}

function decode_xpcom_structure(data)
{
    function dostring (data) {
        try {
            var iface = data.QueryInterface (Ci.nsISupportsString);
            return iface.data;
        } catch (e) {
            return null;
        }
    }

    var ret = dostring (data);
    if (ret) { return ret; }
    // it's not a string, so we will assume it is an array.
    ret = [];
    var en = data.QueryInterface (Ci.nsIArray).enumerate ();
    while (en.hasMoreElements ()) {
        ret.push (decode_xpcom_structure (en.getNext ()));
    }
    return ret;
}

function make_chrome_frame(chrome_URI, args)
{
    return window_watcher.openWindow(null, chrome_URI, null,
                                     "resizeable=yes,dialog=no", args);
}

var conkeror_chrome_URI = "chrome://conkeror/content/conkeror.xul";

function make_frame (url, tag)
{
    var open_args = ['conkeror'];
    if (url) { open_args.push (['find'].concat (url)); }
    if (tag) { open_args.push (['tag', tag]); }
    open_args = encode_xpcom_structure (open_args);
    var result = make_chrome_frame(conkeror_chrome_URI, open_args);
    make_frame_hook.run(result);
    return result;
}

// The simple case for find_url_new_buffer is to just load an url into
// an existing frame.  However, find_url_new_buffer must also deal
// with the case where it is called many times synchronously (as by a
// command-line handler) when there is no active frame into which to
// load urls.  We only want to make one frame, so we keep a queue of
// urls to load, and put a function in `make_frame_after_hook' that
// will load those urls.
//
var find_url_new_buffer_queue =  null;
function find_url_new_buffer(url, frame)
{
    function  find_url_new_buffer_internal (frame) {
        // get urls from queue
        if (find_url_new_buffer_queue) {
            for (var i = 0; i < find_url_new_buffer_queue.length; i++) {
                find_url_new_buffer (find_url_new_buffer_queue[i], frame);
            }
            // reset queue
            find_url_new_buffer_queue = null;
        }
    }

    // window_watcher.activeWindow is the default frame, but it may be
    // null, too.
    //
    if (frame == null) {
        frame = window_watcher.activeWindow;
    }
    if (frame) {
        frame.buffers.current = new browser_buffer(frame);
        frame.buffers.current.load_URI(url);
    } else if (this.find_url_new_buffer_queue) {
        // we are queueing
        find_url_new_buffer_queue.push (url);
    } else {
        // establish a queue and make a frame
        find_url_new_buffer_queue = [];
        frame = make_frame (url);
        add_hook.call(frame, "frame_initialize_late_hook", find_url_new_buffer_internal);
        return frame;
    }
    return null;
}

function get_frame_by_tag(tag)
{
    var en = window_watcher.getWindowEnumerator ();
    while (en.hasMoreElements ()) {
        var w = en.getNext().QueryInterface (Ci.nsIDOMWindow);
        if ('tag' in w && w.tag == tag)
            return w;
    }
    return null;
}

function for_each_frame(func)
{
    var en = window_watcher.getWindowEnumerator ();
    while (en.hasMoreElements ()) {
        var w = en.getNext().QueryInterface (Ci.nsIDOMWindow);
        if ('tag' in w)
            func(w);
    }
}

define_frame_local_hook("frame_initialize_early_hook");
define_frame_local_hook("frame_initialize_hook");
define_frame_local_hook("frame_initialize_late_hook");

function frame_initialize(frame)
{
    frame.conkeror = conkeror;
    frame_initialize_early_hook.run(frame);
    frame_initialize_hook.run(frame);
    frame.setTimeout(function(){frame_initialize_late_hook.run(frame);},0);
}
