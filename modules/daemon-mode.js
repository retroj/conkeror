
/*
 * Daemon Mode
 *
 *   This mode gets loaded into application scope.
 */


var daemon_mode_enabled = false;

var daemon_quit_exits = true;

function daemon_quit_exits_p () {
    return daemon_quit_exits;
}

function daemon_quit_hook_fn () {
    if (daemon_quit_exits_p ())
        daemon_mode (-1);
};

function daemon_mode (arg)
{
    // null arg means toggle
    if (! arg)
        arg = conkeror.daemon_mode_enabled ? -1 : 1;
    if (arg < 0) {
        // disable if on.
        if (conkeror.daemon_mode_enabled) {
            conkeror.daemon_mode_enabled = false;
            var appStartup = Cc["@mozilla.org/toolkit/app-startup;1"]
                .getService(Ci.nsIAppStartup);
            appStartup.exitLastWindowClosingSurvivalArea ();
            remove_hook("quit_hook", daemon_quit_hook_fn);
        }
    } else {
        // enable if off
        if (daemon_mode_enabled == false) {
            daemon_mode_enabled = true;
            var appStartup = Components.classes["@mozilla.org/toolkit/app-startup;1"]
                .getService(Components.interfaces.nsIAppStartup);
            appStartup.enterLastWindowClosingSurvivalArea ();
            add_hook("quit_hook", daemon_quit_hook_fn);
        }
    }
}

require_later("command-line.js");

call_after_load("command-line.js", function () {
        command_line_param_handler("daemon", true, function () {
                daemon_mode(1);
                var frame = make_frame();
                frame.setTimeout(function() { frame.close(); }, 0);
            });
    });
