/**
 * (C) Copyright 2007 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

var MAX_DUMP_DEPTH = 1;
function dump_obj_r (obj, name, indent, depth) {
    if (depth > MAX_DUMP_DEPTH) {
        return indent + name + ": <Maximum Depth Reached>\n";
    }
    if (typeof obj == "object") {
        var child = null;
        var output = indent + name + "\n";
        indent += "\t";
        for (var item in obj) {
            try {
                child = obj[item];
            } catch (e) {
                child = "<Unable to Evaluate>";
            }
            if (typeof child == "object") {
                output += dump_obj_r(child, item, indent, depth + 1);
            } else {
                output += indent + item + ": " + child + "\n";
            }
        }
        return output;
    } else {
        return obj;
    }
}

function dump_obj (obj, name) {
    if (typeof obj == "object") {
        var child = null;
        var output = name + "\n";
        for (var item in obj) {
            try {
                child = obj[item];
            } catch (e) {
                child = "<Unable to Evaluate>";
            }
            output += item + ": " + child + "\n";
        }
        return output;
    } else {
        return obj;
    }
}

function get_interface_info (o) {
    var output = "";
    for (let x in Ci) {
        try {
            o.QueryInterface(Ci[x]);
            output += x + "\n";
        } catch (e)  {
            try {
                o.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci[x]);
                output += x + " (getInterface)\n";
            } catch (e2) {
            }
        }
    }
    return output;
}

/**
 * This simple facility can be used to execute arbitrary expression in the context of some point that you'd like to debug.
 * At that point, simply set some global variable to the result of: eval(DEBUG_HERE);
 * For example:  conkeror.my_debug_ref = eval(DEBUG_HERE);
 * Then if you call:  conkeror.my_debug_ref("some expression"), the specified expression is evaluated in the context
 * at which eval(DEBUG_HERE) was called.
 *
 * Note that the unusual identifier __DEBUG_HERE is simply used to
 * avoid clobbering any identifiers that you might want to examine in
 * the local context.
 */
const DEBUG_HERE = "function (__DEBUG_HERE) { return eval(__DEBUG_HERE); }";



let (console = Cc["@mozilla.org/consoleservice;1"]
                   .getService(Ci.nsIConsoleService)) {
    console.registerListener({
        observe: function (msg) {
            if (msg instanceof Ci.nsIScriptError) {
                switch (msg.category) {
                case "CSS Parser":
                case "content javascript":
                    return;
                }
                msg.QueryInterface(Ci.nsIScriptError);
                dumpln("Console error: " + msg.message);
                dumpln("  Category: " + msg.category);
            }
        }});
}

provide("debug");
