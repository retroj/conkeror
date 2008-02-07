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

function spawn_process(program, args) {
    var result = yield in_new_thread(spawn_process_sync, program, args, true);
    yield co_return(result);
}

function shell_command_sync(cwd, cmd, blocking) {
    if (POSIX) {
        var full_cmd = "cd \"" + shell_quote(cwd) + "\"; " + cmd;
        return spawn_process_sync(getenv("SHELL") || "/bin/sh",
                                  ["-c", full_cmd],
                                  blocking);
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
        return spawn_process_sync("cmd.exe", out, blocking);
    }
}

function shell_command(cwd, cmd) {
    var result = yield in_new_thread(shell_command_sync, cwd, cmd, true);
    yield co_return(result);
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

// use default
minibuffer_auto_complete_preferences["shell-command"] = null;

/* FIXME: support a relative or full path as well as PATH commands */
define_keywords("$cwd");
minibuffer.prototype.read_shell_command = function () {
    keywords(arguments, $history = "shell-command");
    var prompt = arguments.$prompt || "Shell command [" + arguments.$cwd + "]:";
    var result = yield this.read(
        $prompt = prompt,
        $history = "shell-command",
        $auto_complete = "shell-command",
        $select,
        $validator = function (x, m) {
            var s = x.replace(/^\s+|\s+$/g, '');
            if (s.length == 0) {
                m.message("A blank shell command is not allowed.");
                return false;
            }
            return true;
        },
        forward_keywords(arguments),
        $completer = get_shell_command_completer());
    yield co_return(result);
}

function shell_command_with_argument_sync(cwd, cmdline, argument, blocking) {
    if (!cmdline.match("{}")) {
        cmdline = cmdline + " \"" + shell_quote(argument) + "\"";
    } else {
        cmdline = cmdline.replace("{}", "\"" + shell_quote(argument) + "\"");
    }
    return shell_command_sync(cwd, cmdline, blocking);
}

function shell_command_with_argument(cwd, cmdline, argument) {
    var result = yield in_new_thread(shell_command_with_argument_sync, cwd, cmdline, argument, true);
    yield co_return(result);
}
