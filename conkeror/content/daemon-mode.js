
/*
 * Daemon Mode
 *
 *   This mode gets loaded into application scope.
 */


conkeror.daemon_mode_enabled = false;

conkeror.daemon_quit_exits = true;

conkeror.daemon_quit_exits_p = function () {
    return conkeror.daemon_quit_exits;
}

conkeror.daemon_quit_hook_fn = function () {
    if (conkeror.daemon_quit_exits_p ())
        conkeror.daemon_mode (-1);
};

conkeror.daemon_mode = function (arg)
{
    // null arg means toggle
    if (! arg)
        arg = conkeror.daemon_mode_enabled ? -1 : 1;
    if (arg < 0) {
        // disable if on.
        if (conkeror.daemon_mode_enabled) {
            conkeror.daemon_mode_enabled = false;
            var appStartup = Components.classes["@mozilla.org/toolkit/app-startup;1"]
                .getService(Components.interfaces.nsIAppStartup);
            appStartup.exitLastWindowClosingSurvivalArea ();
            conkeror.quit_hook = conkeror.quit_hook.filter (
                function (x) {
                    return x != conkeror.daemon_quit_hook_fn;
                });
        }
    } else {
        // enable if off
        if (conkeror.daemon_mode_enabled == false) {
            conkeror.daemon_mode_enabled = true;
            var appStartup = Components.classes["@mozilla.org/toolkit/app-startup;1"]
                .getService(Components.interfaces.nsIAppStartup);
            appStartup.enterLastWindowClosingSurvivalArea ();
            conkeror.quit_hook.push (conkeror.daemon_quit_hook_fn);
        }
    }
}

