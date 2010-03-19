/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

require("interactive.js");

function define_global_mode (name, enable, disable) {
    var hyphen_name = name.replace("_","-","g");
    var state = name + "_enabled";
    this[state] = false;
    var enable_hook_name = hyphen_name + "-enable-hook";
    var disable_hook_name = hyphen_name + "-disable-hook";
    define_hook(enable_hook_name);
    define_hook(disable_hook_name);
    var func = function (arg) {
        var curstate = conkeror[state];
        var newstate = (arg == null) ? !curstate : (arg > 0);
        if (curstate == newstate)
            return;
        conkeror[state] = newstate;
        if (newstate) {
            enable();
            conkeror[enable_hook_name].run();
        } else {
            disable();
            conkeror[disable_hook_name].run();
        }
    };
    this[name] = func;
    interactive(hyphen_name, null, function (I) {
        var arg = I.P;
        func(arg && univ_arg_to_number(arg));
        I.minibuffer.message(hyphen_name + (conkeror[state] ? " enabled" : " disabled"));
    });
}
ignore_function_for_get_caller_source_code_reference("define_global_mode");

provide("mode");
