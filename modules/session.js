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
 * - It would be nice if session_write wrote json that was a bit more human-
 *   readable. Consider retroj's structed plaintext format.
 *
 * Bugs, show-stoppers:
 *
 * - When working with existing buffers, ensure they're content_buffers.
 *   Currently we do this in some places, but not others.
 * - Setting _session_auto_save_auto_load to false is not currently useful.
 * - Fix the small hacks for prompting in _session_auto_save_auto_load
 *   and _session_auto_save_mode_bootstrap.
 * - The fix for the previous two bugs is probably to persist the
 *   auto-save session that is loaded at startup for the life of the
 *   application, or at least until session_auto_save_load or
 *   _session_auto_save_auto_load are called for the first time.
 *
 * Bugs, deferred:
 *
 * - Ensure loading of homepage in new buffers is inhibited in all situations.
 *   Currently I think we catch all but one though this instance is handled
 *   fairly gracefully.
 * - Auto-save the session when the last conkeror window is closed by a
 *   window manager event (like clicking the 'x' in the window deco to
 *   close the window). Currently no session is saved. This is a non-trivial
 *   fix.
 *
 * Misc:
 *
 * - Create a wiki page detailing this module's typical usage, api, etc.
 */

{
    let _session_dir_default = Cc["@mozilla.org/file/directory_service;1"]
        .getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile);
    _session_dir_default.append("sessions");
    if (! _session_dir_default.exists())
        _session_dir_default.create(Ci.nsIFile.DIRECTORY_TYPE, 0755);

    define_variable("session_dir", _session_dir_default,
        "Default directory for save/load interactive commands.");

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

    function session_load(session, window, buffer_idx) {
        if (! (session[0] && session[0][0]))
            throw new Error("Invalid 'session' argument.");
        let s = 0;
        if (window) {
            let bi = buffer_idx != undefined ?
                buffer_idx : window.buffers.count;
            for (let i = 0; session[s][i]; ++i, ++bi) {
                let b = window.buffers.get_buffer(bi);
                if (b) b.load(session[s][i]);
                else {
                    let c = buffer_creator(content_buffer, $load = session[s][i]);
                    create_buffer(window, c, OPEN_NEW_BUFFER_BACKGROUND);
                }
            }
            for (let b = window.buffers.get_buffer(bi); b;
                 b = window.buffers.get_buffer(bi))
                kill_buffer(b, true);
            ++s;
        }

        function make_init_hook(session) {
            function init_hook(window) {
                for (let i = 1; session[i]; ++i) {
                    let c = buffer_creator(content_buffer, $load = session[i]);
                    create_buffer(window, c, OPEN_NEW_BUFFER_BACKGROUND);
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

    function session_load_window_new(session) {
        session_load(session);
    }

    function session_load_window_current(session, window) {
        let w = window ? window : get_recent_conkeror_window();
        session_load(session, w);
    }

    function session_load_window_current_replace(session, window) {
        let w = window ? window : get_recent_conkeror_window();
        session_load(session, w, 0);
    }

    function session_write(path, session) {
        if (! (path instanceof Ci.nsIFile))
            path = make_file(path);
        if (! session) session = session_get();
        write_text_file(path, _json.encode(session));
    }

    function session_read(path) {
        if (! (path instanceof Ci.nsIFile))
            path = make_file(path);
        return _json.decode(read_text_file(path));
    }

    function session_remove(path) {
        if (! (path instanceof Ci.nsIFile))
            path = make_file(path);
        path.remove(false);
    }

    let _session_prompt_file = function (I) {
        yield co_return(
            yield I.minibuffer.read_file_path(
                $prompt = "Session file:",
                $initial_value = session_dir.path,
                $history = "save"
            )
        );
    };

    interactive("session-save", "Save a session to a file.", function (I) {
        session_write(make_file(yield _session_prompt_file(I)), session_get());
    });

    interactive("session-load-window-new", "Load a session in a new window.", 
        function (I) {
            let file = make_file(yield _session_prompt_file(I));
            session_load_window_new(session_read(file));
        });

    interactive("session-load-window-current",
        "Load a session in new buffers in the current window.",
        function (I) {
            let file = make_file(yield _session_prompt_file(I));
            session_load_window_current(session_read(file), I.window);
        });

    interactive("session-load-window-current-replace", 
        "Load a session in existing buffers in the current window.",
        function (I) {        
            let file = make_file(yield _session_prompt_file(I));
            session_load_window_current_replace(session_read(file), I.window, 0)
        });

    interactive("session-remove", "Remove a session file.", function (I) {
        session_remove(make_file(yield _session_prompt_file(I)));
    });

    define_variable("session_auto_save_file", "auto-save",
        "Default filename for the auto-save session.");

    define_variable("session_auto_save_auto_load", true,
        'Whether to load the auto-saved session when the browser is started. ' +
        'May be true, false, or "prompt".');

    define_variable("session_auto_save_load_fn", session_load_window_new,
        "Function to be called to load the auto-saved session at start-up " +
        "when URLs are given on the command-line, and when " +
        "session-auto-save-load is called. May be " +
        "session_load_window_new or session_load_window_current.");

    let _session_auto_save_file_get = function () {
        if (session_auto_save_file instanceof Ci.nsIFile)
            return session_auto_save_file;
        let f = session_dir.clone();
        f.append(session_auto_save_file);
        return f;
    };

    function session_auto_save_load() {
        let f = _session_auto_save_file_get();
        if (! f.exists()) return;
        session_auto_save_load_fn(session_read(f));
    }

    function session_auto_save_save() {
        let f = _session_auto_save_file_get();
        let s = session_get();
        if (s[0]) session_write(f, s);
        else if (f.exists()) f.remove(false);
    }

    let _session_auto_save_auto_load = function (user_gave_urls) {
        if (! session_auto_save_auto_load) return;
        let f = _session_auto_save_file_get();
        if (! f.exists()) return;
        // FIXME Hack for prompting. We shouldn't grab the session at this point.
        let session = session_read(f);
        let do_load = false;
        let window = get_recent_conkeror_window();
        if (session_auto_save_auto_load == true) do_load = true;
        else if (session_auto_save_auto_load == "prompt") {
            do_load = (yield window.minibuffer.read_single_character_option(
                $prompt = "Load auto-saved session? (y/n)",
                $options = ["y", "n"]
            )) == "y";
        }
        else
            throw new Error("Invalid value for session_auto_save_auto_load: " +
                            session_auto_save_load);
        if (! do_load) return;
        if (user_gave_urls) session_auto_save_load_fn(session, window);
        else session_load_window_current_replace(session, window);
    };

    function session_auto_save_remove() {
        let f = _session_auto_save_file_get();
        if (f.exists()) f.remove(false);
    }

    interactive("session-auto-save-load", "Load the last auto-saved session",
                session_auto_save_load);

    interactive("session-auto-save-remove", "Remove the auto-save session",
                session_auto_save_remove);

    let _session_auto_save_mode_bootstrap = function (b) {
        remove_hook("window_initialize_late_hook", _session_auto_save_mode_bootstrap);
        // FIXME Hack for prompting. This should happen later, and we shouldn't
        // need to call session_auto_save_save() later.
        let user_gave_urls = false;
        for (let i = 0; i < command_line.length; ++i) {
            if (command_line[i][0] != '-') {
                user_gave_urls = true;
                break;
            }
        }
        co_call(_session_auto_save_auto_load(user_gave_urls));
        add_hook("create_buffer_hook", session_auto_save_save);
        add_hook("kill_buffer_hook", session_auto_save_save);
        add_hook("content_buffer_location_change_hook", session_auto_save_save);
        session_auto_save_save();
    };

    let _session_auto_save_mode_enable = function () {
        if (conkeror_started) {
            add_hook("create_buffer_hook", session_auto_save_save);
            add_hook("kill_buffer_hook", session_auto_save_save);
            add_hook("content_buffer_location_change_hook", session_auto_save_save);
        }
        else
            add_hook("window_initialize_late_hook", _session_auto_save_mode_bootstrap);
    };

    let _session_auto_save_mode_disable = function () {
        remove_hook("create_buffer_hook", session_auto_save_save);
        remove_hook("kill_buffer_hook", session_auto_save_save);
        remove_hook("content_buffer_location_change_hook", session_auto_save_save);
        // Just in case.
        remove_hook("window_initialize_late_hook", _session_auto_save_mode_bootstrap);
    };

    define_global_mode("session_auto_save_mode",
                       _session_auto_save_mode_enable,
                       _session_auto_save_mode_disable);
}
