require("thread.js");
require("interactive.js");

const WINDOWS = (get_os() == "WINNT");
const POSIX = !WINDOWS;
const PATH = getenv("PATH").split(POSIX ? ":" : ";"); 
const path_component_regexp = POSIX ? /^[^/]+$/ : /^[^/\\]+$/;

function get_file_in_path(name) {
    var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
    if (!path_component_regexp.test(name)) {
        // Absolute path
        try {
            file.initWithPath(name);
            if (file.exists())
                return file;
        } catch (e) {}
        return null;
    } else {
        // Relative path
        for (var i = 0; i < PATH.length; ++i) {
            try {
                file.initWithPath(PATH[i]);
                file.appendRelativePath(name);
                if (file.exists())
                    return file;
            } catch(e) {}
        }
    }
    return null;
}

function spawn_process_sync(program, args, blocking) {
    var process = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
    var file = get_file_in_path(program);
    if (!file)
        throw new Error("invalid executable: " + program);
    process.init(file);
    return process.run(!!blocking, args, args.length);
}

function spawn_process(program, args, success_cont, error_cont) {
    if (success_cont == null && error_cont == null) {
        spawn_process_sync(program, args, false);
        return;
    }
    call_in_new_thread(
        function () { // function to run
            return spawn_process_sync(program, args, true);
        },
        success_cont, error_cont);
}

function shell_command(cwd, cmd, success_cont, error_cont) {
    if (POSIX) {
        var full_cmd = "cd \"" + shell_quote(cwd) + "\"; " + cmd;
        spawn_process(getenv("SHELL") || "/bin/sh",
                      ["-c", full_cmd],
                      success_cont, error_cont);
        return;
    } else {

        var full_cmd = "";
        if (cwd.match(/[a-z]:/i)) {
            full_cmd += cwd.substring(0,2) + " && ";
        }
        full_cmd += "cd \"" + shell_quote(cwd) + "\" && " + cmd;

        /* Need to convert the single command-line into a list of
         * arguments that will then get converted back into a
         * command-line by Mozilla. */
        var out = ["/C"];
        var cur_arg = "";
        var quoting = false;
        for (var i = 0; i < full_cmd.length; ++i) {
            var ch = full_cmd[i];
            if (ch == " ") {
                if (quoting) {
                    cur_arg += ch;
                } else {
                    out.push(cur_arg);
                    cur_arg = "";
                }
                continue;
            }
            if (ch == "\"") {
                quoting = !quoting;
                continue;
            }
            cur_arg += ch;
        }
        if (cur_arg.length > 0)
            out.push(cur_arg);
        spawn_process("cmd.exe", out,
                      success_cont, error_cont);
    }
}

var PATH_programs = null;
function get_shell_command_completer() {
    if (PATH_programs == null) {
        PATH_programs = [];
        var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
        for (var i = 0; i < PATH.length; ++i) {
            try {
                file.initWithPath(PATH[i]);
                var entries = file.directoryEntries;
                while (entries.hasMoreElements()) {
                    var entry = entries.getNext().QueryInterface(Ci.nsIFile);
                    PATH_programs.push(entry.leafName);
                }
            } catch (e) {}
        }
        PATH_programs.sort();
    }

    return prefix_completer($completions = PATH_programs,
                            $get_string = function (x) { return x; });
}

function minibuffer_read_shell_command(m) {
    keywords(arguments, $prompt = "Shell command", $history = "shell-command");
    return m.read(forward_keywords(arguments),
                  $completer = get_shell_command_completer());
}

I.shell_command = interactive_method(
    $async = function (ctx, cont) {
        minibuffer_read_shell_command(ctx.window.minibuffer, forward_keywords(arguments),
                                      $callback = cont);
    });


define_keywords("$command", "$argument", "$callback", "$failure_callback");
function shell_command_with_argument(cwd) {
    keywords(arguments);
    var cmdline = arguments.$command;
    var cont = arguments.$callback;
    var failure_cont = arguments.$failure_callback;
    var argument = arguments.$argument;
    if (!cmdline.match("{}")) {
        cmdline = cmdline + " \"" + shell_quote(argument) + "\"";
    } else {
        cmdline = cmdline.replace("{}", "\"" + shell_quote(argument) + "\"");
    }
    shell_command(cwd, cmdline, cont, failure_callback /*, function (exit_code) {
            if (exit_code == 0)
                buffer.window.minibuffer.message("Shell command exited normally.");
            else
                buffer.window.minibuffer.message("Shell command exited with status " + exit_code + ".");
                }*/);
}
