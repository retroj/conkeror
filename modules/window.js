/**
 * (C) Copyright 2007 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("mode.js");

var define_window_local_hook = simple_local_hook_definer();
var define_window_local_coroutine_hook = simple_local_coroutine_hook_definer();


define_hook("make_window_hook");

var window_watcher = Cc["@mozilla.org/embedcomp/window-watcher;1"]
    .getService(Ci.nsIWindowWatcher);

function generate_new_window_tag (tag) {
    var existing = [];
    var exact_match = false;
    var en = window_watcher.getWindowEnumerator();
    if (tag == '')
        tag = null;
    var re;
    if (tag)
        re = new RegExp ("^" + tag + "<(\\d+)>$");
    else
        re = new RegExp ("^(\\d+)$");
    while (en.hasMoreElements()) {
        var w = en.getNext().QueryInterface(Ci.nsIDOMWindow);
        if ('tag' in w)  {
            if (tag && w.tag == tag) {
                exact_match = true;
                continue;
            }
            var re_result = re.exec(w.tag);
            if (re_result)
                existing.push(re_result[1]);
        }
    }
    if (tag && ! exact_match)
        return tag;

    existing.sort(function (a, b) { return a - b; });

    var n = 1;
    for (var i = 0; i < existing.length; i++) {
        if (existing[i] < n) continue;
        if (existing[i] == n) { n++; continue; }
        break;
    }
    if (tag)
        return tag + "<" + n + ">";
    else
        return n;
}

function make_chrome_window (chrome_uri, args) {
    return window_watcher.openWindow(null, chrome_uri, "_blank",
                                     "chrome,dialog=no,all,resizable", args);
}

var conkeror_chrome_uri = "chrome://conkeror-gui/content/conkeror.xul";

/**
 * This is called by Conkeror to explicitly create a conkeror.xul window.
 * However, windows are sometimes created internally be Mozilla, for example due
 * to the logic in content-buffer.js:browser_dom_window.openURI.  In that case,
 * make_window is not called and Conkeror sees the window for the first time in
 * window_initialize, which needs to take care of all of the initialization that
 * would normally happen in make_window.
 **/
function make_window (initial_buffer_creator, tag) {
    var args = { tag: tag,
                 initial_buffer_creator: initial_buffer_creator };
    var result = make_chrome_window(conkeror_chrome_uri, null);
    result.args = args;
    make_window_hook.run(result);
    window_install_close_intercept(result);
    return result;
}

function window_install_close_intercept (window) {
    var close = window.close;
    window.close = function () {
        function attempt_close () {
            var res = yield window_before_close_hook.run(window);
            if (res) {
                window_close_hook.run(window);
                close.call(window);
            }
        }
        spawn(attempt_close());
    };
}

function get_window_by_tag (tag) {
    var en = window_watcher.getWindowEnumerator();
    while (en.hasMoreElements()) {
        var w = en.getNext().QueryInterface(Ci.nsIDOMWindow);
        if ('tag' in w && w.tag == tag)
            return w;
    }
    return null;
}

/* FIXME: decide if this should include not-fully-initialized windows  */
function for_each_window (func) {
    var en = window_watcher.getWindowEnumerator();
    while (en.hasMoreElements()) {
        var w = en.getNext().QueryInterface(Ci.nsIDOMWindow);
        if ('conkeror' in w)
            func(w);
    }
}

function get_recent_conkeror_window () {
    var wm = Cc['@mozilla.org/appshell/window-mediator;1']
       .getService(Ci.nsIWindowMediator);
    var window = wm.getMostRecentWindow("navigator:browser");
    if (window && ("conkeror" in window))
        return window;
    var en = window_watcher.getWindowEnumerator();
    while (en.hasMoreElements()) {
        window = en.getNext().QueryInterface(Ci.nsIDOMWindow);
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

/**
 * Called by window_initialize.  If the window was created using make_window (as
 * indicated by window.args having been set), nothing needs to be done.
 * Otherwise, we need to perform the setup that would otherwise occur in
 * make_window.
 **/
function window_setup_args (window) {
    if (window.args != null)
        return;

    window_install_close_intercept(window);


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

function window_set_extra_arguments (args) {
    args.time = Date.now();
    window_extra_argument_list.push(args);
}

function window_get_this_browser () {
    return this.buffers.current.browser;
}

function window_initialize (window) {
    window.conkeror = conkeror;

    // Used by get_window_from_frame to get an unwrapped window reference
    window.escape_wrapper = function (x) { x(window); };

    window_setup_args(window);

    // Set tag
    var tag = null;
    if ('tag' in window.args)
        tag = window.args.tag;
    window.tag = generate_new_window_tag(tag);

    // Add a getBrowser() and content to help certain extensions designed
    // for Firefox work with conkeror
    window.getBrowser = window_get_this_browser;
    window.__defineGetter__('content',
                            function () {
                                return this.buffers.current.browser.contentWindow;
                            });

    // Tell Mozilla the window_initialize_late_hook to run after a timeout

    // Do this here, before doing the rest of the window
    // initialization, so that window_initialize_late_hook will be run
    // prior to any other "late" hooks set up by other modules in a
    // function registered in window_initialize{_early,}_hook.
    window.setTimeout(function () {
            window_initialize_late_hook.run(window);
            delete window.window_initialize_late_hook; // used only once
            delete window.args; // get rid of args
        }, 0);

    window_initialize_early_hook.run(window);
    delete window.window_initialize_early_hook; // used only once

    window_initialize_hook.run(window);
    delete window.window_initialize_hook; // used only once

    window.addEventListener("close",
                            function (event) {
                                event.preventDefault();
                                event.stopPropagation();
                                this.close();
                            },
                            true /* capture */);
}

define_window_local_coroutine_hook("window_before_close_hook",
                                   RUN_HOOK_UNTIL_FAILURE);
define_window_local_hook("window_close_hook", RUN_HOOK);

/*
 * Window Modes
 */

function define_global_window_mode (name, hook_name) {
    keywords(arguments);
    function install (window) {
        if (name in window)
            throw new Error(name + " already initialized for window");
        window[name] = new conkeror[name](window);
    }
    function uninstall (window) {
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
                       },
                       forward_keywords(arguments));
}
ignore_function_for_get_caller_source_code_reference("define_global_window_mode");



/*
 * Window Title
 */

/**
 * Default tile formatter.  The page url is ignored.  If there is a
 * page_title, returns: "Page title - Conkeror".  Otherwise, it
 * returns just: "Conkeror".
 */
function default_title_formatter (window) {
    var page_title = window.buffers.current.title;

    if (page_title && page_title.length > 0)
        return page_title + " - Conkeror";
    else
        return "Conkeror";
}

var title_format_fn = null;

function set_window_title (window) {
    window.document.title = title_format_fn(window);
}

function init_window_title () {
    title_format_fn = default_title_formatter;

    add_hook("window_initialize_late_hook", set_window_title);
    add_hook("current_content_buffer_location_change_hook",
             function (buffer) {
                 set_window_title(buffer.window);
             });
    add_hook("select_buffer_hook",
             function (buffer) {
                 set_window_title(buffer.window);
             }, true);
    add_hook("current_buffer_title_change_hook",
             function (buffer) {
                 set_window_title(buffer.window);
             });
}

init_window_title();


function call_builtin_command (window, command, clear_mark) {
    var m = window.minibuffer;
    if (m.active && m._input_mode_enabled) {
        m._restore_normal_state();
        var e = m.input_element;
        var c = e.controllers.getControllerForCommand(command);
        try {
            if (c && c.isCommandEnabled(command))
                c.doCommand(command);
        } catch (e) {
            // ignore errors
        }
        if (clear_mark)
            m.current_state.mark_active = false;
    } else {
        function attempt_command (element) {
            var c;
            if (element.controllers
                && (c = element.controllers.getControllerForCommand(command)) != null
                && c.isCommandEnabled(command))
            {
                try {
                    c.doCommand(command);
                } catch (e) {
                    // ignore errors
                }
                if (clear_mark)
                    window.buffers.current.mark_active = false;
                return true;
            }
            return false;
        }
        var element = window.buffers.current.focused_element;
        if (element && attempt_command(element, command))
            return;
        var win = window.buffers.current.focused_frame;
        while (true) {
            if (attempt_command(win, command))
                return;
            if (!win.parent || win == win.parent)
                break;
            win = win.parent;
        }
    }
}


/**
 * window_set_full_screen sets or toggles the fullScreen and hideChrome
 * properties of the given window.  When fullscreen is a boolean, it sets
 * it to that value.  When it is null or not given, it toggles the current
 * value.
 */
function window_set_full_screen (window, fullscreen) {
    if (fullscreen === true || fullscreen === false) {
        window.fullScreen = fullscreen;
        window.hideChrome = fullscreen;
    } else {
        window.fullScreen = ! window.fullScreen;
        window.hideChrome = window.fullScreen;
    }
}


provide("window");
