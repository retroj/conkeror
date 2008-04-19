/**
 * (C) Copyright 2007 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("mode.js");

var define_window_local_hook = simple_local_hook_definer();


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
    return window_watcher.openWindow(null, chrome_URI, "_blank",
                                     "chrome,dialog=no,all,resizable", args);
}

var conkeror_chrome_URI = "chrome://conkeror/content/conkeror.xul";

function make_window(initial_buffer_creator, tag)
{
    var args = { tag: tag,
                 initial_buffer_creator: initial_buffer_creator };
    var result = make_chrome_window(conkeror_chrome_URI, null);
    result.args = args;
    make_window_hook.run(result);
    return result;
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

/* FIXME: decide if this should include not-fully-initialized windows  */
function for_each_window(func)
{
    var en = window_watcher.getWindowEnumerator ();
    while (en.hasMoreElements ()) {
        var w = en.getNext().QueryInterface (Ci.nsIDOMWindow);
        if ('conkeror' in w)
            func(w);
    }
}

function get_recent_conkeror_window()
{
    var window = window_watcher.activeWindow;
    if (window && ("conkeror" in window))
        return window;
    var en = window_watcher.getWindowEnumerator ();
    while (en.hasMoreElements ()) {
        window = en.getNext().QueryInterface (Ci.nsIDOMWindow);
        if ('conkeror' in window)
            return window;
    }
    return null;
}

define_window_local_hook("window_initialize_early_hook");
define_window_local_hook("window_initialize_hook");
define_window_local_hook("window_initialize_late_hook");

var window_extra_argument_list = [];

define_variable("window_extra_argument_max_delay", 100);

function window_setup_args(window) {
    if (window.args != null)
        return;

    var cur_time = Date.now();
    var i;
    var result = null;
    for (i = 0; i < window_extra_argument_list.length; ++i) {
        var a = window_extra_argument_list[i];
        if (a.time > cur_time - window_extra_argument_max_delay) {
            delete a.time;
            result = a;
            i++;
            break;
        }
    }
    window_extra_argument_list = window_extra_argument_list.slice(i);

    if (result == null)
        window.args = {};
    else
        window.args = result;
}

function window_set_extra_arguments(args) {
    args.time = Date.now();
    window_extra_argument_list.push(args);
}

function window_get_this_browser() {
    return this.buffers.current.browser;
}

function window_initialize(window)
{
    window.conkeror = conkeror;

    // Used by get_window_from_frame to get an unwrapped window reference
    window.escape_wrapper = function (x) { x(window); }

    window_setup_args(window);

    // Set tag
    var tag = null;
    if ('tag' in window.args)
        tag = window.args.tag;
    window.tag = generate_new_window_tag(tag);

    // Add a getBrowser() function to help certain extensions designed for Firefox work with conkeror
    window.getBrowser = window_get_this_browser;

    window_initialize_early_hook.run(window);
    delete window.initialize_early_hook; // used only once

    window_initialize_hook.run(window);
    delete window.initialize_hook; // used only once

    window.setTimeout(function(){
            window_initialize_late_hook.run(window);
            delete window.window_initialize_late_hook; // used only once
            delete window.args; // get rid of args
        },0);

    window.addEventListener("close", window_close_maybe, true /* capture */, false);
}

define_window_local_hook("window_before_close_hook", RUN_HOOK_UNTIL_FAILURE);
define_window_local_hook("window_close_hook", RUN_HOOK);
function window_close_maybe(event) {
    var window = this;

    if (!window_before_close_hook.run(window)) {
        event.preventDefault();
        event.stopPropagation();
        return;
    }

    window_close_hook.run(window);
}

function define_global_window_mode(name, hook_name) {
    function install(window) {
        if (window[name])
            throw new Error(name + " already initialized for window");
        window[name] = new conkeror[name](window);
    }
    function uninstall(window) {
        if (!window[name])
            throw new Error(name + " not initialized for window");
        window[name].uninstall();
        delete window[name];
    }
    define_global_mode(name + "_mode",
                       function () { // enable
                           add_hook(hook_name, install);
                           for_each_window(install);
                       },
                       function () { // disable
                           remove_hook(hook_name, install);
                           for_each_window(uninstall);
                       });
}
ignore_function_for_get_caller_source_code_reference("define_global_window_mode");
