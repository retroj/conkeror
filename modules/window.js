
function define_window_local_hook(hook_name)
{
    initialize_hook(hook_name).run = function (window) {
        run_hooks(this, arguments);
        if (hook_name in window)
            run_hooks(window[hook_name], arguments);
    }
}

define_hook("make_window_hook");

var window_watcher = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);

function generate_new_window_tag(tag)
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

function make_chrome_window(chrome_URI, args)
{
    return window_watcher.openWindow(null, chrome_URI, null,
                                     "resizeable=yes,dialog=no", args);
}

var conkeror_chrome_URI = "chrome://conkeror/content/conkeror.xul";

define_keywords("$load", "$tag", "$cwd");
function make_window ()
{
    keywords(arguments);
    var result = make_chrome_window(conkeror_chrome_URI, null);
    result.make_window_used = true;
    if (arguments.$tag)
        result.tag_arg = arguments.$tag;
    var load_spec = arguments.$load;
    if (load_spec != null) {
        add_hook.call(result, "window_initialize_hook", function () {
                apply_load_spec(result.buffers.current, load_spec);
            });
    }
    if (arguments.$cwd != null)
        result.cwd_arg = arguments.$cwd;
    make_window_hook.run(result);
    return result;
}

// The simple case for find_url_new_buffer is to just load an url into
// an existing window.  However, find_url_new_buffer must also deal
// with the case where it is called many times synchronously (as by a
// command-line handler) when there is no active window into which to
// load urls.  We only want to make one window, so we keep a queue of
// urls to load, and put a function in `make_window_after_hook' that
// will load those urls.
//
var find_url_new_buffer_queue =  null;
function find_url_new_buffer(url, window, cwd)
{
    function  find_url_new_buffer_internal (window) {
        // get urls from queue
        if (find_url_new_buffer_queue) {
            for (var i = 0; i < find_url_new_buffer_queue.length; i++) {
                var o = find_url_new_buffer_queue[i];
                find_url_new_buffer (o[0], window, o[1]);
            }
            // reset queue
            find_url_new_buffer_queue = null;
        }
    }

    // window_watcher.activeWindow is the default window, but it may be
    // null, too.
    //
    if (window == null) {
        window = window_watcher.activeWindow;
    }
    if (window) {
        window.buffers.current = new browser_buffer(window);
        window.buffers.current.cwd = cwd;
        window.buffers.current.load(url);
    } else if (this.find_url_new_buffer_queue) {
        // we are queueing
        find_url_new_buffer_queue.push ([url, cwd]);
    } else {
        // establish a queue and make a window
        find_url_new_buffer_queue = [];
        window = make_window ($load = url, $cwd = cwd);
        add_hook.call(window, "window_initialize_late_hook", find_url_new_buffer_internal);
        return window;
    }
    return null;
}

function get_window_by_tag(tag)
{
    var en = window_watcher.getWindowEnumerator ();
    while (en.hasMoreElements ()) {
        var w = en.getNext().QueryInterface (Ci.nsIDOMWindow);
        if ('tag' in w && w.tag == tag)
            return w;
    }
    return null;
}

function for_each_window(func)
{
    var en = window_watcher.getWindowEnumerator ();
    while (en.hasMoreElements ()) {
        var w = en.getNext().QueryInterface (Ci.nsIDOMWindow);
        if ('tag' in w)
            func(w);
    }
}

define_window_local_hook("window_initialize_early_hook");
define_window_local_hook("window_initialize_hook");
define_window_local_hook("window_initialize_late_hook");

var window_extra_argument_list = [];
var window_extra_argument_max_delay = 100; /* USER PREFERENCE */

function window_handle_extra_arguments(window) {
    /* Handle window arguments */
    var cur_time = Date.now();
    var i;
    for (i = 0; i < window_extra_argument_list.length; ++i) {
        var a = window_extra_argument_list[i];
        if (a.time > cur_time - window_extra_argument_max_delay) {
            delete a.time;
            for (j in a)
                window[j] = a[j];
            i++;
            break;
        }
    }
    window_extra_argument_list = window_extra_argument_list.slice(i);
}

function window_set_extra_arguments(args) {
    args.time = Date.now();
    window_extra_argument_list.push(args);
}

function window_initialize(window)
{
    window.conkeror = conkeror;
    if (!window.make_window_used)
        window_handle_extra_arguments(window);
    else
        delete window.make_window_used;

    // Set tag
    var tag = null;
    if (window.tag_arg) {
        tag = window.tag_arg;
        delete window.tag_arg;
    }
    window.tag = generate_new_window_tag(tag);

    window_initialize_early_hook.run(window);
    window.initialize_early_hook = null; // used only once

    window_initialize_hook.run(window);
    window.initialize_hook = null; // used only once

    window.setTimeout(function(){
            window_initialize_late_hook.run(window);
            window.window_initialize_late_hook = null; // used only once
        },0);
}
