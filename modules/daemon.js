/**
 * (C) Copyright 2007 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

/*
 * Daemon Mode
 *
 *   This mode gets loaded into application scope.
 */

require("mode.js");

var daemon_quit_exits = true;

function daemon_quit_exits_p () {
    return daemon_quit_exits;
}

function daemon_quit_hook_fn () {
    if (daemon_quit_exits_p ())
        daemon_mode (-1);
};

define_global_mode("daemon_mode",
                   function () { // enable
                       var appStartup = Components.classes["@mozilla.org/toolkit/app-startup;1"]
                           .getService(Components.interfaces.nsIAppStartup);
                       appStartup.enterLastWindowClosingSurvivalArea();
                       add_hook("quit_hook", daemon_quit_hook_fn);
                   },
                   function () { // disable
                       var appStartup = Cc["@mozilla.org/toolkit/app-startup;1"]
                           .getService(Ci.nsIAppStartup);
                       appStartup.exitLastWindowClosingSurvivalArea ();
                       remove_hook("quit_hook", daemon_quit_hook_fn);
                   });

require_later("command-line.js");

call_after_load("command-line.js", function () {
        command_line_handler("daemon", true, function () {
                daemon_mode(true);
                var window = make_chrome_window(conkeror_chrome_URI);
                window.setTimeout(function() { window.close(); }, 0);
            });
    });
