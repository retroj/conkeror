
function define_frame_local_hook(hook_name)
{
    initialize_hook(hook_name).run = function (frame) {
        run_hooks(this, arguments);
        if (hook_name in frame)
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

function make_chrome_frame(chrome_URI, args)
{
    return window_watcher.openWindow(null, chrome_URI, null,
                                     "resizeable=yes,dialog=no", args);
}

var conkeror_chrome_URI = "chrome://conkeror/content/conkeror.xul";

function make_frame (load_spec, tag)
{
    var result = make_chrome_frame(conkeror_chrome_URI, null);
    if (tag != null)
        result.tag_arg = tag;
    if (load_spec != null) {
        add_hook.call(result, "frame_initialize_hook", function () {
                apply_load_spec(result.buffers.current, load_spec);
            });
    }
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
        frame.buffers.current.load(url);
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

    // Set tag
    var tag = null;
    if (frame.tag_arg) {
        tag = frame.tag_arg;
        delete frame.tag_arg;
    }
    frame.tag = generate_new_frame_tag(tag);

    frame_initialize_early_hook.run(frame);
    frame.initialize_early_hook = null; // used only once

    frame_initialize_hook.run(frame);
    frame.initialize_hook = null; // used only once

    frame.setTimeout(function(){
            frame_initialize_late_hook.run(frame);
            frame.frame_initialize_late_hook = null; // used only once
        },0);
}
