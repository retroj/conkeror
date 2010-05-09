/**
 * (C) Copyright 2007-2009 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

var command_line_handlers = [];

define_variable("conkeror_started", false,
    "True if conkeror has started, false if conkeror is still starting.");

define_variable("url_remoting_fn", load_url_in_new_window,
    "The function given as the value of this variable gets called for "+
    "each datum given on the command-line not a switch or the value of "+
    "a switch.  Such data are typically urls.  Some typical values are "+
    "load_url_in_new_window (default), load_url_in_new_buffer, or "+
    "load_url_in_current_buffer.");

/*
 * load_url_in_new_window is a function intended for use as
 * a value of `url_remoting_fn'.  Every url given on the
 * command line will be loaded in a new window.
 */
function load_url_in_new_window (url, ctx) {
    make_window(buffer_creator(content_buffer,
                               $opener = ctx,
                               $load = url));
}

/*
 * load_url_in_new_buffer is a function intended for use as
 * a value of `url_remoting_fn'.  Every url given on the
 * command line will be loaded in a new buffer in the most
 * recently used window, or a new window if none exist.
 */
function load_url_in_new_buffer (url, ctx) {
    create_buffer_in_current_window(
        buffer_creator(content_buffer,
                       $opener = ctx,
                       $load = url),
        OPEN_NEW_BUFFER, true /* focus the new window */);
}

/*
 * load_url_in_new_buffer_background is a function intended for use as a
 * value of `url_remoting_fn'.  Every url given on the command line will
 * be loaded in a new background buffer in the most recently used window,
 * or a new window if none exist.
 */
function load_url_in_new_buffer_background (url, ctx) {
    create_buffer_in_current_window(
        buffer_creator(content_buffer,
                       $opener = ctx,
                       $load = url),
        OPEN_NEW_BUFFER_BACKGROUND, true /* focus the new window */);
}

/*
 * load_url_in_current_buffer is a function intended for use
 * as a value of `url_remoting_fn'.  Every url given on the
 * command line will be loaded in the current buffer of the
 * most recently used window.  This makes it useful for only
 * one url at a time.  When there are no conkeror windows
 * open, the url will be loaded in a new window.
 */
function load_url_in_current_buffer (url, ctx) {
    var win = get_recent_conkeror_window();
    if (win) {
        browser_object_follow(win.buffers.current, OPEN_CURRENT_BUFFER, url);
    } else {
        load_url_in_new_window(url, ctx);
    }
}

function command_line_handler (name, suppress_default, handler) {
    command_line_handlers[name] = { suppress_default: suppress_default, func: handler };
}

function command_line_param_handler (name, suppress_default, handler) {
    command_line_handlers[name] = { suppress_default: suppress_default,
                                    param: true,
                                    func: handler };
}

command_line_handler("batch", true);
command_line_param_handler("e", true, function (expr, ctx) {
        eval(expr);
    });

command_line_param_handler("E", false, function (expr, ctx) {});

command_line_param_handler("chrome", true, function (uri, ctx) {
        try {
            make_chrome_window(uri);
        } catch (e) { dump_error(e); }
    });
command_line_param_handler("q", false, function () {
        dumpln ("w: -q may only be used as the first argument.");
    });

command_line_param_handler("f", true, function (command, ctx) {
        // hack to make sure we send this command to a window
        ctx.window = get_recent_conkeror_window();
        if (ctx.window)
            ctx.buffer = ctx.window.buffers.current;
        co_call(call_interactively(ctx, command));
    });

command_line_param_handler("l", false, function (path, ctx) {
        try {
            load(ctx.command_line.resolveFile(path));
        } catch (e) {
            dump_error(e);
        }
    });

// note `u' must be called as +u because Mozilla consumes -u
command_line_handler("u", false, function (ctx) {
        // hack to make sure we send this command to a window
        if (! ctx.window) {
            ctx.window = get_recent_conkeror_window();
            ctx.buffer = ctx.window.buffers.current;
        }
        co_call(call_interactively(ctx, "universal-argument"));
    });

function handle_command_line (cmdline) {
    try {
        this.command_line = [];
        for (let i = 0, clen = cmdline.length; i < clen; ++i)
            command_line.push(cmdline.getArgument(i));

        var suppress_default = false;
        var suppress_rc = false;

        var i = 0;

        /* -q must be the first argument, if it is given */
        if (cmdline.length > 0 && cmdline.getArgument(0) == "-q") {
            suppress_rc = true;
            i++;
        }

        var initial_launch = (cmdline.state == cmdline.STATE_INITIAL_LAUNCH);

        if (initial_launch) {
            let j = i;
            while (j + 1 < cmdline.length) {
                if (cmdline.getArgument(j) == "-E") {
                    eval(cmdline.getArgument(j+1));
                    cmdline.removeArguments(j, j+1);
                } else
                    ++j;
            }

            let load_default_modules = get_pref("conkeror.loadDefaultModules");
            let load_mods = new RegExp("^(" + get_pref("conkeror.loadModules") + ")$");
            try {
                let branch = preferences.getBranch("conkeror.load.");
                for each (let m in branch.getChildList("", {})) {
                    let val;
                    try {
                        val = branch.getIntPref(m);
                    } catch (e) {
                        dumpln("Error: Preference 'conkeror.load." + m + "' has non-integer value.");
                    }
                    if ((val > 0 && (load_default_modules > 0 ||
                                     ((load_default_modules == 0) && branch.prefHasUserValue(m)))) ||
                        (val >= 0 && load_mods.test(m)))
                        require(m + ".js");
                }
            } catch (e) {dump_error(e);}
        }

        if (! suppress_rc && initial_launch) {
            try {
                load_rc();
            } catch (e) {
                dump_error(e);
            }
        } else if (suppress_rc && ! initial_launch) {
            dumpln("w: attempt to suppress loading of rc in remote invocation");
        }
        var ctx = new interactive_context();
        ctx.command_line = cmdline;
        ctx.local = { cwd: cmdline.resolveFile("."),
                      __proto__: conkeror }

        for (let clen = cmdline.length; i < clen; ++i) {
            var arg = cmdline.getArgument(i);
            if (arg[0] == '-' || arg[0] == '+') {
                var arg1 = arg.substring(1);
                if (arg1 in command_line_handlers) {
                    var handler = command_line_handlers[arg1];
                    if (handler.suppress_default)
                        suppress_default = true;
                    if (handler.func) {
                        if (handler.param) {
                            i++; // increment the argument counter to skip the parameter
                            if (i >= cmdline.length) {
                                dump("w: ignoring command switch `"+arg+"' because no argument was provided.\n");
                                continue;
                            }
                            var param = cmdline.getArgument(i);
                            handler.func(param, ctx);
                        } else {
                            handler.func(ctx);
                        }
                    }
                    continue;
                } else {
                    dump("w: unknown command switch `"+arg+"'.\n");
                }
            } else {
                // something other than a switch was passed on the command
                // line.  suppress the default window, and call the
                // user-configurable remoting function on it.
                //
                suppress_default = true;
                url_remoting_fn(arg, ctx);
            }
        }

        // we are greedy and handle all command line arguments.  remove
        // everything from the command line object, so no other
        // components can see them.
        //
        if (cmdline.length > 0) {
            cmdline.removeArguments(0, cmdline.length - 1);
        }

        // no args were found for url_remoting_fn, and no switches
        // explicitly suppressed the creation of a default window
        // (e.g. -batch or -daemon)
        //
        if (! suppress_default) {
            url_remoting_fn(homepage, ctx);
        }
    } catch (e) {
        dumpln("Error processing command line.");
        dump_error(e);
    }
    conkeror_started = true;
}

provide("command-line");
