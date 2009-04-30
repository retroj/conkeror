/**
 * (C) Copyright 2009 Nicholas A. Zigarovich
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

/* TODO
 *
 * - json_service doesn't belong in this file.
 * - Tab complete existing session names/paths in minibuffer prompts.
 * - Ensure loading of homepage in new buffers is inhibited in all situations.
 *   Currently I think we catch all but one.
 * - We make a buffer_creator for each call to create_window and
 *   create_buffer. It'd be better if we used one to create all buffers.
 * - When working with existing buffers, ensure they're content_buffers.
 *   Currently we do this in some places, but not others.
 * - Implement interactive functions.
 * - Add application startup and shutdown hooks.
 * - Optionally prompt on auto-load.
 * - Optionally auto-save, but not auto-load.
 * - Add missing docstrings.
 * - Handle case where conkeror is started with urls given on the command-line.
 * - Handle daemon mode.
 * - Manually restore sessions in new windows by default, optionally instead
 *   recycling the existing window (without clobbering existing buffers).
 *   Currently we always use the latter case.
 * - Rename session_{path,auto_save_path}.
 * - session_auto_save_path should be either a string filename considered to be
     relative to session_path, or a nsIFile instance representing an absolute
     path.
 * - Replace session_auto_save_prompt with a variable
 *   session_auto_save_auto_load, which can be true, false, or "prompt".
 */

{
    var json_service = Cc["@mozilla.org/dom/json;1"]
        .createInstance(Ci.nsIJSON);

    define_variable("session_open_target", OPEN_NEW_BUFFER_BACKGROUND);
    
    define_variable("session_path",
                    Cc["@mozilla.org/file/directory_service;1"]
                        .getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile));

    let _session_auto_save_path_default = session_path.clone();
     _session_auto_save_path_default.append("session-auto-save.json");

    define_variable("session_auto_save_path", _session_auto_save_path_default);

    define_variable("session_auto_save_prompt", false);

    define_variable("session_auto_save_auto_load", true);

    let session_auto_save_bootstrapped = false;

    function session_get() {
        let windows = {};
        let x = 0;
        for_each_window(function (w) {
            let buffers = {};
            let y = 0;
            w.buffers.for_each(function (b) {
		// FIXME I don't know what b.generated is or means. This was
		// in dmhouse's code so I figured what the hell.
                if (! b.browser || b.generated || ! b instanceof content_buffer)
		    return;
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

    interactive("session-load",
                "Load a session under a particular name.",
                function (I) {});

    interactive("session-load-path",
                "Load a session from the file at the specified path.",
                function (I) {});

    interactive("session-store",
                "Store a session under a particular name.",
                function (I) {});

    interactive("session-store-path",
                "Store a session in a file at the specified path.",
                function (I) {});

    function session_auto_save_store() {
        session_store(session_auto_save_path, session_get());
    }

    function session_auto_save_load(use_current_buf) {
        if (session_auto_save_path.exists()) {
	    let window = get_recent_conkeror_window();
            session_restore(session_load(session_auto_save_path), window, 
                            use_current_buf);
	}
    }

    function session_auto_save_clear() {
	if (session_auto_save_path.exists())
            session_auto_save_path.remove(false);
    }

    interactive("session-auto-save-load", "Load the last auto-saved session",
		session_auto_save_load);

    interactive("session-auto-save-clear", "Clear the auto-save session",
		session_auto_save_clear);

    function session_auto_save_mode_enable() {
        if (conkeror_started) {
            add_hook("create_buffer_hook", session_auto_save_store);
            add_hook("kill_buffer_hook", session_auto_save_store);
            add_hook("content_buffer_location_change_hook", session_auto_save_store);
	    session_auto_save_load(false);
        }
        else {
	    function session_auto_save_bootstrap(b) {
	        remove_hook("create_buffer_hook", session_auto_save_bootstrap);
                add_hook("create_buffer_hook", session_auto_save_store);
                add_hook("kill_buffer_hook", session_auto_save_store);
                add_hook("content_buffer_location_change_hook", session_auto_save_store);
		// FIXME If urls were given on the command line, pass false.
	        session_auto_save_load(true);
	    }
            // Wait for the initial buffer to be created in the initial window,
            // then add our hooks and load the session.
	    add_hook("create_buffer_hook", session_auto_save_bootstrap);
        }
    }

    function session_auto_save_mode_disable() {
        remove_hook("create_buffer_hook", session_auto_save_store);
        remove_hook("kill_buffer_hook", session_auto_save_store);
        remove_hook("content_buffer_location_change_hook", session_auto_save_store);
    }

    define_global_mode("session_auto_save_mode",
                       session_auto_save_mode_enable,
                       session_auto_save_mode_disable);
}
