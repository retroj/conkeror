/**
 * (C) Copyright 2009 Nicholas A. Zigarovich
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

/* TODO
 *
 * Features:
 *
 * - Handle daemon mode. It might already work - need to test.
 * - Add support for using auto-save mode purely as a recovery mode:
 *   - Only auto-load session on un-clean shutdown.
 *   - On clean shutdown, optionally do not auto-save the session (for
 *     greater privacy).
 * - Explore retroj's session-switch idea.
 * - Replace session_auto_save_use_current_window with functions appropriate
 *   to each behavior. Manual sessions will need the same functions.
 *
 * Bugs:
 *
 * - Ensure loading of homepage in new buffers is inhibited in all situations.
 *   Currently I think we catch all but one.
 * - When working with existing buffers, ensure they're content_buffers.
 *   Currently we do this in some places, but not others.
 * - Auto-save the session when the last conkeror window is closed by a
 *   window manager event (like clicking the 'x' in the window deco to
 *   close the window). Currently no session is saved.
 * - Setting session_auto_save_auto_load to false is not currently useful.
 * - Fix the small hacks for prompting in _session_auto_save_auto_load
 *   and _session_auto_save_bootstrap.
 * - The fix for the previous two bugs is probably to persist the
 *   auto-save session that is loaded at startup for the life of the
 *   application, or at least until session_auto_save_load or
 *   _session_auto_save_auto_load are called for the first time.
 * - session_auto_save_use_current_window should probably be eliminated
 *   in favor of variant functions. 
 * - session_open_target should perhaps be more strictly adhered to.
 *
 * Misc:
 *
 * - Add missing docstrings.
 * - Create a wiki page detailing this module's typical usage, api, etc.
 */

{
    define_variable("session_open_target", OPEN_NEW_BUFFER_BACKGROUND);

    let _session_dir_default = Cc["@mozilla.org/file/directory_service;1"]
        .getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile);
    _session_dir_default.append("sessions");
    if (! _session_dir_default.exists())
        _session_dir_default.create(Ci.nsIFile.DIRECTORY_TYPE, 0755);

    define_variable("session_dir", _session_dir_default);

    define_variable("session_auto_save_file", "auto-save");

    let _session_auto_save_file_get = function () {
        if (session_auto_save_file instanceof Ci.nsIFile)
            return session_auto_save_file;
        let f = session_dir.clone();
        f.append(session_auto_save_file);
        return f;
    }

    define_variable("session_auto_save_auto_load", true,
                    'Whether to auto-load when session-auto-save-mode is ' +
                    'activated. May be true, false, or "prompt".');

    define_variable("session_auto_save_use_current_window", false,
                    "Whether to load the auto-saved session in the current " +
                    "window or in a new window. May be true or false.");

    let _json = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);

    function session_get() {
        let windows = {};
        let x = 0;
        for_each_window(function (w) {
            let buffers = {};
            let y = 0;
            w.buffers.for_each(function (b) {
                if (! b.browser || ! b instanceof content_buffer) return;
                buffers[y] = b.browser.contentDocument.location.href;
                y++;
            });
            if (y == 0) return;
            windows[x] = buffers;
            x++;
        });
        return windows;
    }

    function session_restore(session, window, use_current_buf) {
        let s = 0;
        if (window) {
            let i = 0;
            if (use_current_buf) {
                window.buffers.current.load(session[s][i]);
                i++;
            }
            for (; session[s][i]; ++i) {
                let c = buffer_creator(content_buffer, $load = session[s][i]);
                create_buffer(window, c, session_open_target);
            }
            ++s;
         }

        function make_init_hook(session) {
            function init_hook(window) {
                for (let i = 1; session[i]; ++i) {
                    let c = buffer_creator(content_buffer, $load = session[i]);
                    create_buffer(window, c, session_open_target);
                }
            }
            return init_hook;
        }

        for (; session[s]; ++s) {
            let w = make_window(buffer_creator(content_buffer,
                                               $load = session[s][0]));
            add_hook.call(w, "window_initialize_late_hook",
                          make_init_hook(session[s]));
        }
    }

    function session_store(path, session) {
        if (! (path instanceof Ci.nsIFile))
            path = make_file(path);
        if (! session) session = session_get();
        write_text_file(path, _json.encode(session));
    }

    function session_load(path) {
        if (! (path instanceof Ci.nsIFile))
            path = make_file(path);
        return _json.decode(read_text_file(path));
    }

    function session_remove(path) {
        if (! (path instanceof Ci.nsIFile))
            path = make_file(path);
        path.remove(false);
    }

    interactive("session-store", "Store a session to a file.", function (I) {
        let file = yield I.minibuffer.read_file_path(
            $prompt = "Session file:",
            $initial_value = session_dir.path,
            $history = "save");
        session_store(make_file(file), session_get());
    });

    interactive("session-load", "Load a session from a file.", function (I) {
        let file = yield I.minibuffer.read_file_path(
            $prompt = "Session file:",
            $initial_value = session_dir.path,
            $history = "save");
        let w = make_window(buffer_creator(content_buffer,
                                           $load = "about:blank"));
        add_hook.call(w, "window_initialize_late_hook", function (w) {
            session_restore(session_load(make_file(file)), w, true);
        });
    });

    interactive("session-remove", "Remove a session file.", function (I) {
        let file = yield I.minibuffer.read_file_path(
            $prompt = "Session file:",
            $initial_value = session_dir.path,
            $history = "save");
        session_remove(make_file(file));
    });

    function session_auto_save_store() {
        let f = _session_auto_save_file_get();
        let s = session_get();
        if (s[0]) session_store(f, s);
        else if (f.exists()) f.remove(false);
    }

    function session_auto_save_load() {
        let f = _session_auto_save_file_get();
        if (! f.exists()) return;
        session_restore(session_load(f), null, true); 
    }

    let _session_auto_save_auto_load = function (use_current_win, use_current_buf) {
        if (session_auto_save_auto_load == false) return;
        let f = _session_auto_save_file_get();
        if (! f.exists()) return;
        // FIXME Hack for prompting. We shouldn't grab the session at this point.
        let session = session_load(f);
        let do_load = false;
        if (session_auto_save_auto_load == true) do_load = true;
        else if (session_auto_save_auto_load == "prompt") {
            let w = get_recent_conkeror_window();
            do_load = (yield w.minibuffer.read_single_character_option(
                $prompt = "Restore auto-saved session? (y/n)",
                $options = ["y", "n"]
            )) == "y";
        }
        else
            throw new Error("Invalid value for session_auto_save_auto_load: " +
                            session_auto_save_load);
        if (! do_load) return;
        let window = use_current_win ? get_recent_conkeror_window() : null;
        session_restore(session, window, use_current_buf);
    }

    function session_auto_save_clear() {
        let f = _session_auto_save_file_get();
        if (f.exists()) f.remove(false);
    }

    interactive("session-auto-save-load", "Load the last auto-saved session",
                session_auto_save_load);

    interactive("session-auto-save-clear", "Clear the auto-save session",
                session_auto_save_clear);

    let _session_auto_save_mode_bootstrap = function (b) {
        remove_hook("window_initialize_late_hook", _session_auto_save_mode_bootstrap);
        // FIXME Hack for prompting. This should happen later, and we shouldn't
        // need to call session_auto_save_store() later.
        let user_gave_urls = false;
        for (let i = 0; i < command_line.length; ++i) {
            if (command_line[i][0] != '-') {
                user_gave_urls = true;
                break;
            }
        }
        if (user_gave_urls)
            co_call(_session_auto_save_auto_load(false, true));
        else
            co_call(_session_auto_save_auto_load(true, true));
        add_hook("create_buffer_hook", session_auto_save_store);
        add_hook("kill_buffer_hook", session_auto_save_store);
        add_hook("content_buffer_location_change_hook", session_auto_save_store);
        session_auto_save_store();
    }

    let _session_auto_save_mode_enable = function () {
        if (conkeror_started) {
            add_hook("create_buffer_hook", session_auto_save_store);
            add_hook("kill_buffer_hook", session_auto_save_store);
            add_hook("content_buffer_location_change_hook", session_auto_save_store);
            co_call(_session_auto_save_auto_load(session_auto_save_use_current_window,
                                                 ! session_auto_save_use_current_window));
        }
        else
            add_hook("window_initialize_late_hook", _session_auto_save_mode_bootstrap);
    }

    let _session_auto_save_mode_disable = function () {
        remove_hook("create_buffer_hook", session_auto_save_store);
        remove_hook("kill_buffer_hook", session_auto_save_store);
        remove_hook("content_buffer_location_change_hook", session_auto_save_store);
        // Just in case.
        remove_hook("window_initialize_late_hook", _session_auto_save_mode_bootstrap);
    }

    define_global_mode("session_auto_save_mode",
                       _session_auto_save_mode_enable,
                       _session_auto_save_mode_disable);
}
