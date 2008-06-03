/**
 * (C) Copyright 2007 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

var command_line_handlers = [];

define_variable("url_remoting_fn", load_url_in_new_window);

function load_url_in_new_window(url, ctx) {
    make_window(buffer_creator(content_buffer, $load = url, $configuration = ctx.config));
}

function load_url_in_new_buffer(url, ctx) {
    create_buffer_in_current_window(buffer_creator(content_buffer, $load = url, $configuration = ctx.config),
                                    OPEN_NEW_BUFFER, true /* focus the new window */);
}

function command_line_handler(name, suppress_default, handler)
{
    command_line_handlers[name] = { suppress_default: suppress_default, func: handler };
}

function command_line_param_handler(name, suppress_default, handler)
{
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

command_line_param_handler("cwd", false, function (dir, ctx) {
        if (ctx.config == null)
            ctx.config = {};
        ctx.config.cwd = dir;
    });

command_line_param_handler("f", true, function (command) {
        var ctx = {
            window: window_watcher.activeWindow
        };
       call_interactively(ctx, command);
    });

function handle_command_line(cmdline)
{
    try {
        var suppress_default = false;
        var suppress_rc = false;

        var i = 0;

        /* -q must be the first argument, if it is given */
        if (cmdline.length > 0 && cmdline.getArgument(0) == "-q")
        {
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

        if (! suppress_rc && initial_launch)
        {
            try {
                load_rc ();
            } catch (e) { dump (e + "\n"); }
        } else if (suppress_rc && ! initial_launch) {
            dumpln ("w: attempt to suppress load_rc in remote invocation");
        }
        var ctx = {}; // command-line processing context

        for (; i < cmdline.length; ++i)
        {
            var arg = cmdline.getArgument(i);
            if (arg[0] == '-') {
                var arg1 = arg.substring(1);
                if (arg1 in command_line_handlers) {
                    var handler = command_line_handlers[arg1];
                    if (handler.suppress_default)
                        suppress_default = true;
                    if (handler.func) {
                        if (handler.param) {
                            i++; // increment the argument counter to skip the parameter
                            if (i >= cmdline.length) {
                                dump ("w: ignoring command switch `"+arg+"' because no argument was provided.\n");
                                continue;
                            }
                            var param = cmdline.getArgument (i);
                            handler.func(param, ctx);
                        } else {
                            handler.func(ctx);
                        }
                    }
                    continue;
                }
            }

            // something other than a switch was passed on the command
            // line.  suppress the default window, and call the
            // user-configurable remoting function on it.
            //
            suppress_default = true;
            url_remoting_fn (arg, ctx);
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
}

