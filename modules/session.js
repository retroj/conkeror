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
 * - A session-load-window-replace command which is like
 *   window-current-replace, but which also recycles existing windows.
 * - A session-load-window-current-flatten command which loads all buffers in a
 *   multi-window section in the current window.
 * - Session files should be more human readable.
 * - Ability to store arbitrary session data, for example, a buffer's history.
 * - The previous two features depend on a parser/generator for retroj's
 *   structured plaintext format.
 *
 * Bugs, critical:
 *
 * - This module does not work correctly with daemon mode.
 *
 * Bugs, deferred:
 *
 * - Inhibit loading of the homepage in windows' initial buffers when auto-
 *   loading a session.
 * - Auto-save the session when the last conkeror window is closed by a
 *   window manager event. Currently no session is saved.
 * - Consider how and which errors should be handled. Too often we silently
 *   fail and return without telling the user why we are doing so.
 */

in_module(null);

{
    //// Manual sessions. ////


    let _session_dir_default = Cc["@mozilla.org/file/directory_service;1"]
        .getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile);
    _session_dir_default.append("sessions");
    if (! _session_dir_default.exists())
        _session_dir_default.create(Ci.nsIFile.DIRECTORY_TYPE, 0755);

    define_variable("session_dir", _session_dir_default,
        "Default directory for save/load interactive commands.");

    let _json = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);

    /**
     * session_get generates and returns a structure containing session
     * data for the current group of open windows.
     */
    function session_get () {
        let windows = {};
        let x = 0;
        for_each_window(function (w) {
            let buffers = {};
            let y = 0;
            w.buffers.for_each(function (b) {
                if (! b.browser || ! (b instanceof content_buffer))
                    return;
                buffers[y] = b.display_uri_string;
                y++;
            });
            if (y == 0)
                return;
            windows[x] = buffers;
            x++;
        });
        return windows;
    }

    /**
     * session_load loads the given session (given as a data structure),
     * with optional window as the first window to load the session into,
     * with optional buffer_idx as the buffer index at which to begin
     * overwriting existing buffers.
     */
    function session_load (session, window, buffer_idx) {
        if (! (session[0] && session[0][0]))
            throw new Error("Invalid 'session' argument.");
        let s = 0;
        if (window) {
            let bi = buffer_idx != undefined ?
                buffer_idx : window.buffers.count;

            // first kill special buffers slated for recycling.
            let (b, i = (bi == 0 ? 1 : bi),
                 safe2kill = bi > 0)
            {
                while ((b = window.buffers.get_buffer(i))) {
                    if (b instanceof content_buffer) {
                        safe2kill = true;
                        ++i;
                    } else
                        kill_buffer(b, true);
                }
                if (bi == 0 &&
                    (b = window.buffers.get_buffer(0)) &&
                    !(b instanceof content_buffer))
                {
                    if (! safe2kill)
                        create_buffer(window,
                                      buffer_creator(content_buffer),
                                      OPEN_NEW_BUFFER_BACKGROUND);
                    kill_buffer(b, true);
                }
            }

            // it is now safe to recycle the remaining buffers.
            for (let i = 0; session[s][i] != undefined; ++i, ++bi) {
                let b = window.buffers.get_buffer(bi);
                if (b)
                    b.load(session[s][i]);
                else {
                    let c = buffer_creator(content_buffer, $load = session[s][i]);
                    create_buffer(window, c, OPEN_NEW_BUFFER_BACKGROUND);
                }
            }
            for (let b = window.buffers.get_buffer(bi); b;
                 b = window.buffers.get_buffer(bi))
            {
                kill_buffer(b, true);
            }
            ++s;
        }

        function make_init_hook (session) {
            function init_hook (window) {
                for (let i = 1; session[i] != undefined; ++i) {
                    let c = buffer_creator(content_buffer, $load = session[i]);
                    create_buffer(window, c, OPEN_NEW_BUFFER_BACKGROUND);
                }
            }
            return init_hook;
        }

        for (; session[s] != undefined; ++s) {
            let w = make_window(buffer_creator(content_buffer,
                                               $load = session[s][0]));
            add_hook.call(w, "window_initialize_late_hook",
                          make_init_hook(session[s]));
        }
    }

    /**
     * session_load_window_new loads the given session into new windows.
     */
    function session_load_window_new (session) {
        session_load(session);
    }

    /**
     * session_load_window_current loads the given session, with the
     * session's first window being appended to window.  No existing
     * buffers will be overwritten.
     */
    function session_load_window_current (session, window) {
        let w = window ? window : get_recent_conkeror_window();
        session_load(session, w);
    }

    /**
     * session_load_window_current loads the given session, with the
     * session's first window replacing the given window.  All buffers in
     * the given window will be overwritten.
     */
    function session_load_window_current_replace (session, window) {
        let w = window ? window : get_recent_conkeror_window();
        session_load(session, w, 0);
    }

    /**
     * session_write writes the given session to the file given by path.
     */
    function session_write (path, session) {
        if (! (path instanceof Ci.nsIFile))
            path = make_file(path);
        if (! session)
            session = session_get();
        write_text_file(path, _json.encode(session));
    }

    /**
     * session_read reads session data from the given file path,
     * and returns a decoded session structure.
     */
    function session_read (path) {
        if (! (path instanceof Ci.nsIFile))
            path = make_file(path);
        return _json.decode(read_text_file(path));
    }

    /**
     * session_remove deletes the given session file.
     */
    function session_remove (path) {
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

    let _session_file_not_found = function (I, file) {
        let mb = I ? I.minibuffer : get_recent_conkeror_window().minibuffer;
        let msg = "Session file not found: " + file.path;
        mb.message(msg);
        dumpln(msg);
    }

    interactive("session-save",
        "Save the current session.",
        function (I) {
            session_write(make_file(yield _session_prompt_file(I)),
                          session_get());
        });

    interactive("session-load-window-new",
        "Load a session in a new window.", 
        function (I) {
            let file = make_file(yield _session_prompt_file(I));
            if (! file.exists())
                _session_file_not_found(I, file);
            else
                session_load_window_new(session_read(file));
        });

    interactive("session-load-window-current",
        "Load a session in new buffers in the current window.",
        function (I) {
            let file = make_file(yield _session_prompt_file(I));
            if (! file.exists())
                _session_file_not_found(I, file);
            else
                session_load_window_current(session_read(file), I.window);
        });

    interactive("session-load-window-current-replace", 
        "Replace all buffers in the current window with buffers "+
        "in the saved session.",
        function (I) {
            let file = make_file(yield _session_prompt_file(I));
            if (! file.exists())
                _session_file_not_found(I, file);
            else
                session_load_window_current_replace(session_read(file),
                                                    I.window, 0);
        });

    interactive("session-remove",
        "Remove a session file.",
        function (I) {
            let file = make_file(yield _session_prompt_file(I));
            if (! file.exists())
                _session_file_not_found(I, file);
            else
                session_remove(file);
        });


    //// Auto-save sessions. ////


    define_variable("session_auto_save_file", "auto-save",
        "Default filename for the auto-save session.");

    define_variable("session_auto_save_auto_load", false,
        'Whether to load the auto-saved session when the browser is started. '+
        'May be true, false, or "prompt".');

    function session_auto_save_load_window_new () {
        session_load_window_new(_session_auto_save_cached);
    }

    function session_auto_save_load_window_current (window) {
        session_load_window_current(_session_auto_save_cached, window);
    }

    function session_auto_save_load_window_current_replace (window) {
        session_load_window_current_replace(_session_auto_save_cached, window);
    }
    
    define_variable("session_auto_save_auto_load_fn",
        null,
        "Function to be called to load the auto-saved session at start-up " +
        "when URLs are given on the command-line. May be " +
        "session_auto_save_load_window_new, " + 
        "session_auto_save_load_window_current, or null. If null, the" +
        "session will not be auto-loaded when URLs are given.");

    // Supported values:
    //   undefined - we have not tried to cache the auto-save.
    //   null      - we have tried to cache the auto-save, but it didn't exist.
    //   object    - the cached session object for the auto-save.
    let _session_auto_save_cached = undefined;

    let _session_auto_save_file_get = function () {
        if (session_auto_save_file instanceof Ci.nsIFile)
            return session_auto_save_file;
        let f = session_dir.clone();
        f.append(session_auto_save_file);
        return f;
    };

    function session_auto_save_save () {
        let f = _session_auto_save_file_get();
        let s = session_get();
        if (s[0])
            session_write(f, s);
        else if (f.exists())
            f.remove(false);
    }

    function session_auto_save_remove () {
        let f = _session_auto_save_file_get();
        if (f.exists())
            f.remove(false);
    }

    let _session_auto_save_auto_load = function (user_gave_urls) {
        if (! session_auto_save_auto_load)
            return;
        if (! _session_auto_save_cached) {
            _session_file_not_found(null, _session_auto_save_file_get());
            return;
        }
        let do_load = false;
        let window = get_recent_conkeror_window();
        if (session_auto_save_auto_load == true)
            do_load = true;
        else if (session_auto_save_auto_load == "prompt" && !user_gave_urls) {
            do_load = (yield window.minibuffer.read_single_character_option(
                $prompt = "Load auto-saved session? (y/n)",
                $options = ["y", "n"]
            )) == "y";
        } else
            throw new Error("Invalid value for session_auto_save_auto_load: " +
                            session_auto_save_auto_load);
        if (! do_load)
            return;
        if (user_gave_urls) {
            if (session_auto_save_auto_load_fn)
                session_auto_save_auto_load_fn(window);
        } else
            session_auto_save_load_window_current_replace(window);
    };

    interactive("session-auto-save-load-window-new",
        "Load the auto-save session in a new window.",
        function (I) { 
            if (_session_auto_save_cached == null)
                _session_file_not_found(I, _session_auto_save_file_get());
            else
                session_auto_save_load_window_new();
        });

    interactive("session-auto-save-load-window-current",
        "Load the auto-save session in new buffers in the current window.",
        function (I) {
            if (_session_auto_save_cached == null)
                _session_file_not_found(I, _session_auto_save_file_get());
            else
                session_auto_save_load_window_current(I.window);
        });

    interactive("session-auto-save-load-window-current-replace",
        "Replace all buffers in the current window with buffers in the "+
        "auto-saved session.",
        function (I) {
            if (_session_auto_save_cached == null)
                _session_file_not_found(I, _session_auto_save_file_get());
            else
                session_auto_save_load_window_current_replace(I.window);
        });

    interactive("session-auto-save-remove",
                "Remove the auto-save session",
                session_auto_save_remove);


    //// auto-save-session-mode ////


    let _session_auto_save_mode_bootstrap = function (b) {
        remove_hook("window_initialize_late_hook", _session_auto_save_mode_bootstrap);
        add_hook("create_buffer_hook", session_auto_save_save);
        add_hook("kill_buffer_hook", session_auto_save_save);
        add_hook("content_buffer_location_change_hook", session_auto_save_save);
        let user_gave_urls = false;
        for (let i = 0; i < command_line.length; ++i) {
            if (command_line[i][0] != '-') {
                user_gave_urls = true;
                break;
            }
        }
        co_call(_session_auto_save_auto_load(user_gave_urls));
    };

    let _session_auto_save_mode_enable = function () {
        if (_session_auto_save_cached == undefined) {
            let f = _session_auto_save_file_get();
            _session_auto_save_cached = f.exists() ? session_read(f) : null;
        }
        if (conkeror_started) {
            add_hook("create_buffer_hook", session_auto_save_save);
            add_hook("kill_buffer_hook", session_auto_save_save);
            add_hook("content_buffer_location_change_hook", session_auto_save_save);
        } else
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

    session_auto_save_mode(true);
}

provide("session");
