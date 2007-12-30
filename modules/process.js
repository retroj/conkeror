require("thread.js");
require("interactive.js");

const POSIX = (get_os() != "WINNT");
const PATH = getenv("PATH").split(POSIX ? ":" : ";"); 
const path_component_regexp = POSIX ? /^[^/]+$/ : /^[^/\\]$/;

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
        return null;
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
        /* FIXME: Need to set current directory */
        spawn_process("cmd.exe",
                      ["/C", command],
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

I.shell_command = interactive_method(
    $async = function (ctx, cont) {
        keywords(arguments);
        ctx.frame.minibuffer.read($prompt = "Shell command:",
                                  $history = "shell-command",
                                  forward_keywords(arguments),
                                  $callback = cont,
                                  $completer = get_shell_command_completer());
    });
