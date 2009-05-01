/**
 * (C) Copyright 2009 Nicholas A. Zigarovich
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

/* TODO
 *
 * - json_service doesn't belong in this file.
 * - Ensure loading of homepage in new buffers is inhibited in all situations.
 *   Currently I think we catch all but one.
 * - We make a buffer_creator for each call to create_window and
 *   create_buffer. It'd be better if we used one to create all buffers.
 * - When working with existing buffers, ensure they're content_buffers.
 *   Currently we do this in some places, but not others.
 * - Add application startup and shutdown hooks.
 * - Add missing docstrings.
 * - Handle daemon mode.
 * - Currently setting session_auto_save_auto_load to false is not useful.
 *   Find a way to make it work, else rename it to session_auto_save_prompt.
 * - 'myvar instanceof Ci.nsIFile' seems to evaluate to 'true' if myvar is
 *   a string - wtf?!
 * - Auto-save the session when the last conkeror window is closed by a
 *   window manager event (like clicking the 'x' in the window deco to
 *   close the window). Currently we save an empty session when this
 *   happens.
 * - Add support for using auto-save mode purely as a recovery mode:
 *   - Only auto-load session on un-clean shutdown.
 *   - On clean shutdown, optionally do not auto-save the session (for
 *     greater privacy).
 * - Add a session_use_current_window variable for manual sessions. I would
 *   prefer a way to let the user specify this value on a per-use basis,
 *   but I think that a single global setting will satisfy almost all use-
 *   cases.
 * - session_auto_save_mode_{enable,disable} should be local to this module
 *   (i.e., let'ed).
 * - Create a wiki page detailing this module's typical usage, api, etc.
 * - Take care to prevent windows with zero buffers from being saved as part
 *   of a session.
 * - Need more testing of support for sessions when loading urls on the
 *   command-line. Particularly when prompting is enabled.
 * - Need to explicitly outline all intended use cases and rigorously test
 *   to ensure each behaves as expected.
 */

{
    var json_service = Cc["@mozilla.org/dom/json;1"]
        .createInstance(Ci.nsIJSON);

    define_variable("session_open_target", OPEN_NEW_BUFFER_BACKGROUND);

    let _session_dir_default = Cc["@mozilla.org/file/directory_service;1"]
        .getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile);
    _session_dir_default.append("sessions");
    if (! _session_dir_default.exists())
        _session_dir_default.create(Ci.nsIFile.DIRECTORY_TYPE, 0755);

    define_variable("session_dir", _session_dir_default);
                    
    define_variable("session_auto_save_file", "auto-save");

    let _get_session_auto_save_file = function () {
        if (session_auto_save_file instanceof Ci.nsILocalFile)
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
            windows[x] = buffers;
            x++;
        });
        return windows;
    }

    function session_restore(session, window, use_current_buf) {
        if (! session[0][0]) return;
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
        if (! path instanceof Ci.nsIFile)
            path = make_file(path);
        if (! session) session = session_get();
        write_text_file(path, json_service.encode(session));
    }

    function session_load(path) {
        if (! path instanceof Ci.nsIFile)
            path = make_file(path);
        return json_service.decode(read_text_file(path));
    }

    interactive("session-load", "Load a session from a file.", function (I) {
        let file = yield I.minibuffer.read_file_path(
            $prompt = "Session file:",
            $initial_value = session_dir.path,
            $history = "save");
        session_restore(session_load(make_file(file)), null, false);
    });

    interactive("session-store", "Store a session to a file.", function (I) {
        let file = yield I.minibuffer.read_file_path(
            $prompt = "Session file:",
            $initial_value = session_dir.path,
            $history = "save");
        session_store(make_file(file), session_get());
    });

    function session_auto_save_store() {
        let f = _get_session_auto_save_file();
        session_store(f, session_get());
    }

    function session_auto_save_load() {
        let f = _get_session_auto_save_file();
        if (! f.exists()) return;
        let window = session_auto_save_use_current_window ?
            get_recent_conkeror_window() : null;
        session_restore(session_load(f), window, false); 
    }

    let _session_auto_save_auto_load = function (use_current_win, use_current_buf) {
        if (session_auto_save_auto_load == false) return;
        let f = _get_session_auto_save_file();
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
        let f = _get_session_auto_save_file();
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

    function session_auto_save_mode_enable() {
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

    function session_auto_save_mode_disable() {
        remove_hook("create_buffer_hook", session_auto_save_store);
        remove_hook("kill_buffer_hook", session_auto_save_store);
        remove_hook("content_buffer_location_change_hook", session_auto_save_store);
        // Just in case.
        remove_hook("window_initialize_late_hook", _session_auto_save_mode_bootstrap);
    }

    define_global_mode("session_auto_save_mode",
                       session_auto_save_mode_enable,
                       session_auto_save_mode_disable);
}
