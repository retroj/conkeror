/**
 * (C) Copyright 2007-2009 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

require("mode.js");

define_variable("daemon_quit_exits", true,
    "This variable controls whether the `quit' command will exit "+
    "the program or only close windows when daemon-mode is enabled. "+
    "The default is true, meaning that the `quit' command will exit "+
    "the program.");

function daemon_quit_hook_fn () {
    if (daemon_quit_exits)
        daemon_mode(-1);
};

define_global_mode("daemon_mode",
    function () { // enable
        Cc["@mozilla.org/toolkit/app-startup;1"]
            .getService(Ci.nsIAppStartup)
            .enterLastWindowClosingSurvivalArea();
        add_hook("quit_hook", daemon_quit_hook_fn);
    },
    function () { // disable
        Cc["@mozilla.org/toolkit/app-startup;1"]
            .getService(Ci.nsIAppStartup)
            .exitLastWindowClosingSurvivalArea();
        remove_hook("quit_hook", daemon_quit_hook_fn);
    });

require_later("command-line.js");

call_after_load("command-line", function () {
        command_line_handler("daemon", true, function () {
                daemon_mode(true);
                var window = make_chrome_window(conkeror_chrome_uri);
                window.setTimeout(function () { window.close(); }, 0);
            });
    });

provide("daemon");
