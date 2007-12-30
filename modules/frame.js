
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

define_keywords("$load", "$tag", "$cwd");
function make_frame ()
{
    keywords(arguments);
    var result = make_chrome_frame(conkeror_chrome_URI, null);
    result.make_frame_used = true;
    if (arguments.$tag)
        result.tag_arg = arguments.$tag;
    var load_spec = arguments.$load;
    if (load_spec != null) {
        add_hook.call(result, "frame_initialize_hook", function () {
                apply_load_spec(result.buffers.current, load_spec);
            });
    }
    if (arguments.$cwd != null)
        result.cwd_arg = arguments.$cwd;
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
function find_url_new_buffer(url, frame, cwd)
{
    function  find_url_new_buffer_internal (frame) {
        // get urls from queue
        if (find_url_new_buffer_queue) {
            for (var i = 0; i < find_url_new_buffer_queue.length; i++) {
                var o = find_url_new_buffer_queue[i];
                find_url_new_buffer (o[0], frame, o[1]);
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
        frame.buffers.current.cwd = cwd;
        frame.buffers.current.load(url);
    } else if (this.find_url_new_buffer_queue) {
        // we are queueing
        find_url_new_buffer_queue.push ([url, cwd]);
    } else {
        // establish a queue and make a frame
        find_url_new_buffer_queue = [];
        frame = make_frame ($load = url, $cwd = cwd);
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

var frame_extra_argument_list = [];
var frame_extra_argument_max_delay = 100; /* USER PREFERENCE */

function frame_handle_extra_arguments(frame) {
    /* Handle frame arguments */
    var cur_time = Date.now();
    var i;
    for (i = 0; i < frame_extra_argument_list.length; ++i) {
        var a = frame_extra_argument_list[i];
        if (a.time > cur_time - frame_extra_argument_max_delay) {
            delete a.time;
            for (j in a)
                frame[j] = a[j];
            i++;
            break;
        }
    }
    frame_extra_argument_list = frame_extra_argument_list.slice(i);
}

function frame_set_extra_arguments(args) {
    args.time = Date.now();
    frame_extra_argument_list.push(args);
}

function frame_initialize(frame)
{
    frame.conkeror = conkeror;
    if (!frame.make_frame_used)
        frame_handle_extra_arguments(frame);
    else
        delete frame.make_frame_used;

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
