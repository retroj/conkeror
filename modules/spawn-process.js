/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("interactive.js");
require("io.js");

const WINDOWS = (get_os() == "WINNT");
const POSIX = !WINDOWS;
const PATH = getenv("PATH").split(POSIX ? ":" : ";");

const path_component_regexp = POSIX ? /^[^\/]+$/ : /^[^\/\\]+$/;

function get_file_in_path(name) {
    if (name instanceof Ci.nsIFile) {
        if (name.exists())
            return name;
        return null;
    }
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

function spawn_process_internal(program, args, blocking) {
    var process = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
    process.init(get_file_in_path(program));
    return process.run(!!blocking, args, args.length);
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

const STDIN_FILENO = 0;
const STDOUT_FILENO = 1;
const STDERR_FILENO = 2;

var spawn_process_helper_default_fd_wait_timeout = 1000;
var spawn_process_helper_setup_timeout = 2000;
var spawn_process_helper_program = file_locator.get("CurProcD", Ci.nsIFile);
spawn_process_helper_program.append("spawn-process-helper");

/**
 * @param program_name
 *                 Specifies the full path to the program.
 * @param args
 *                 An array of strings to pass as the arguments to the program.
 *                 The first argument should be the program name.  These strings must not have
 *                 any NUL bytes in them.
 * @param working_dir
 *                 If non-null, switch to the specified path before running the program.
 * @param finished_callback
 *                 Called with a single argument, the exit code of the process, as returned by the wait system call.
 * @param failure_callback
 *                 Called with a single argument, an exception, if one occurs.
 * @param fds
 *                 If non-null, must be an object with only non-negative integer properties set.  Each such property
 *                 specifies that the corresponding file descriptor in the spaned process should be redirected.  Note that
 *                 0 corresponds to STDIN, 1 corresponds to STDOUT, and 2 corresponds to STDERR.  Note that every redirected
 *                 file descriptor can be used for both input and output, although STDIN, STDOUT, and STDERR are typically
 *                 used only unidirectionally.  Each property must be an object itself, with an input and/or output property
 *                 specifying callback functions that are called with an nsIAsyncInputStream or nsIAsyncOutputStream when the
 *                 stream for that file descriptor is available.
 * @param fd_wait_timeout
 *                 Specifies the number of milliseconds to wait for the file descriptor redirection sockets to be closed after
 *                 the control socket indicates the process has exited before they are closed forcefully.  A negative value
 *                 means to wait indefinitely.  If fd_wait_timeout is null, spawn_process_helper_default_fd_wait_timeout
 *                 is used instead.
 *
 *
 * @returns
 *                 A function that can be called to prematurely terminate the spawned process.
 */
function spawn_process(program_name, args, working_dir,
                       success_callback, failure_callback, fds,
                       fd_wait_timeout) {

    args = args.slice();
    if (args[0] == null)
        args[0] = (program_name instanceof Ci.nsIFile) ? program_name.path : program_name;

    program_name = get_file_in_path(program_name).path;

    const key_length = 100;
    const fd_spec_size = 15;

    if (fds == null)
        fds = {};

    if (fd_wait_timeout === undefined)
        fd_wait_timeout = spawn_process_helper_default_fd_wait_timeout;

    var unregistered_transports = [];
    var registered_transports = [];

    var server = null;
    var setup_timer = null;

    const CONTROL_CONNECTED = 0;
    const CONTROL_SENDING_KEY = 1;
    const CONTROL_SENT_KEY = 2;

    var control_state = CONTROL_CONNECTED;
    var terminate_pending = false;

    var control_transport = null;

    var control_binary_input_stream = null;
    var control_output_stream = null, control_input_stream = null;
    var exit_status = null;

    var client_key = "";
    var server_key = "";
    // Make sure key does not have any 0 bytes in it.
    for (let i = 0; i < key_length; ++i) client_key += String.fromCharCode(Math.floor(Math.random() * 255) + 1);

    // Make sure key does not have any 0 bytes in it.
    for (let i = 0; i < key_length; ++i) server_key += String.fromCharCode(Math.floor(Math.random() * 255) + 1);

    var key_file_fd_data = "";

    // This is the total number of redirected file descriptors.
    var total_client_fds = 0;

    // This is the total number of redirected file descriptors that will use a socket connection.
    var total_fds = 0;

    for (let i in fds) {
        if (fds.hasOwnProperty(i)) {
            key_file_fd_data += i + "\0";
            let fd = fds[i];
            if ('file' in fd) {
                if (fd.perms == null)
                    fd.perms = 0666;
                key_file_fd_data += fd.file + "\0" + fd.mode + "\0" + fd.perms + "\0";
                delete fds[i]; // Remove it from fds, as we won't need to work with it anymore
            } else
                ++total_fds;
            ++total_client_fds;
        }
    }
    var key_file_data = client_key + "\0" + server_key + "\0" + program_name + "\0" +
        (working_dir != null ? working_dir : "") + "\0" +
        args.length + "\0" +
        args.join("\0") + "\0" +
        total_client_fds + "\0" + key_file_fd_data;

    function fail(e) {
        if (!terminate_pending) {
            terminate();
            if (failure_callback)
                failure_callback(e);
        }
    }

    function cleanup_server() {
        if (server) {
            server.close();
            server = null;
        }
        for (let i in unregistered_transports) {
            unregistered_transports[i].close(0);
            delete unregistered_transports[i];
        }
    }

    function cleanup_fd_sockets() {
        for (let i in registered_transports) {
            registered_transports[i].transport.close(0);
            delete registered_transports[i];
        }
    }

    function cleanup_control() {
        if (control_transport) {
            control_binary_input_stream.close();
            control_binary_input_stream = null;
            control_transport.close(0);
            control_transport = null;
            control_input_stream = null;
            control_output_stream = null;
        }
    }

    function control_send_terminate() {
        control_input_stream = null;
        control_binary_input_stream.close();
        control_binary_input_stream = null;
        async_binary_write(control_output_stream, "\0", function () {
            control_output_stream = null;
            control_transport.close(0);
            control_transport = null;
        });
    }

    function terminate() {
        if (terminate_pending)
            return exit_status;
        terminate_pending = true;
        if (setup_timer) {
            setup_timer.cancel();
            setup_timer = null;
        }
        cleanup_server();
        cleanup_fd_sockets();
        if (control_transport) {
            switch (control_state) {
            case CONTROL_SENT_KEY:
                control_send_terminate();
                break;
            case CONTROL_CONNECTED:
                cleanup_control();
                break;
                /**
                 * case CONTROL_SENDING_KEY: in this case once the key
                 * is sent, the terminate_pending flag will be noticed
                 * and control_send_terminate will be called, so nothing
                 * more needs to be done here.
                 */
            }
        }
        return exit_status;
    }

    function finished() {
        // Only call success_callback if terminate was not already called
        if (!terminate_pending) {
            terminate();
            if (success_callback)
                success_callback(exit_status);
        }
    }

    // Create server socket to listen for connections from the external helper program
    try {
        server = Cc['@mozilla.org/network/server-socket;1'].createInstance(Ci.nsIServerSocket);

        var key_file = get_temporary_file("spawn_process_key.dat");

        write_binary_file(key_file, key_file_data);
        server.init(-1 /* choose a port automatically */,
                    true /* bind to localhost only */,
                    -1 /* select backlog size automatically */);

        setup_timer = call_after_timeout(function () {
            setup_timer = null;
            if (control_state != CONTROL_SENT_KEY)
                fail("setup timeout");
        }, spawn_process_helper_setup_timeout);


        function wait_for_fd_sockets() {
            var remaining_streams = total_fds * 2;
            var timer = null;
            function handler() {
                if (remaining_streams != null) {
                    --remaining_streams;
                    if (remaining_streams == 0) {
                        if (timer)
                            timer.cancel();
                        finished();
                    }
                }
            }
            for each (let f in registered_transports) {
                input_stream_async_wait(f.input, handler, false /* wait for closure */);
                output_stream_async_wait(f.output, handler, false /* wait for closure */);
            }
            if (fd_wait_timeout != null) {
                timer = call_after_timeout(function() {
                    remaining_streams = null;
                    finished();
                }, fd_wait_timeout);
            }
        }

        var control_data = "";

        function handle_control_input() {
            if (terminate_pending)
                return;
            try {
                let avail = control_input_stream.available();
                if (avail > 0) {
                    control_data += control_binary_input_stream.readBytes(avail);
                    var off = control_data.indexOf("\0");
                    if (off >= 0) {
                        let message = control_data.substring(0,off);
                        exit_status = parseInt(message);
                        cleanup_control();
                        /* wait for all fd sockets to close? */
                        if (total_fds > 0)
                            wait_for_fd_sockets();
                        else
                            finished();
                        return;
                    }
                }
                input_stream_async_wait(control_input_stream, handle_control_input);
            } catch (e) {
                // Control socket closed: terminate
                cleanup_control();
                fail(e);
            }
        }

        var registered_fds = 0;

        server.asyncListen(
            {
                onSocketAccepted: function (server, transport) {
                    unregistered_transports.push(transport);
                    function remove_from_unregistered() {
                        var i;
                        i = unregistered_transports.indexOf(transport);
                        if (i >= 0) {
                            unregistered_transports.splice(i, 1);
                            return true;
                        }
                        return false;
                    }
                    function close() {
                        transport.close(0);
                        remove_from_unregistered();
                    }
                    var received_data = "";
                    var header_size = key_length + fd_spec_size;

                    var in_stream, bin_stream, out_stream;

                    function handle_input() {
                        if (terminate_pending)
                            return;
                        try {
                            let remaining = header_size - received_data.length;
                            let avail = in_stream.available();
                            if (avail > 0) {
                                if (avail > remaining)
                                    avail = remaining;
                                received_data += bin_stream.readBytes(avail);
                            }
                            if (received_data.length < header_size) {
                                input_stream_async_wait(in_stream, handle_input);
                                return;
                            } else {
                                if (received_data.substring(0, key_length) != client_key)
                                    throw "Invalid key";
                            }
                        } catch (e) {
                            close();
                        }
                        try {
                            var fdspec = received_data.substring(key_length);
                            if (fdspec.charCodeAt(0) == 0) {

                                // This is the control connection
                                if (control_transport)
                                    throw "Control transport already exists";
                                control_transport = transport;
                                control_output_stream = out_stream;
                                control_input_stream = in_stream;
                                control_binary_input_stream = bin_stream;
                                remove_from_unregistered();
                            } else {
                                var fd = parseInt(fdspec);
                                if (!fds.hasOwnProperty(fd) || (fd in registered_transports))
                                    throw "Invalid fd";
                                bin_stream.close();
                                bin_stream = null;
                                registered_transports[fd] = {transport: transport,
                                                             input: in_stream,
                                                             output: out_stream};
                                ++registered_fds;
                            }
                            if (control_transport && registered_fds == total_fds) {
                                cleanup_server();
                                control_state = CONTROL_SENDING_KEY;
                                async_binary_write(control_output_stream, server_key,
                                                   function () {
                                                       control_state = CONTROL_SENT_KEY;
                                                       if (setup_timer) {
                                                           setup_timer.cancel();
                                                           setup_timer = null;
                                                       }
                                                       if (terminate_pending) {
                                                           control_send_terminate();
                                                       } else {
                                                           for (let i in fds) {
                                                               let f = fds[i];
                                                               let t = registered_transports[i];
                                                               if ('input' in f)
                                                                   f.input(t.input);
                                                               if ('output' in f)
                                                                   f.output(t.output);
                                                           }
                                                       }
                                                   });
                                input_stream_async_wait(control_input_stream, handle_control_input);
                            }
                        } catch (e) {
                            fail(e);
                        }
                    }

                    try {
                        in_stream = transport.openInputStream(Ci.nsITransport.OPEN_NON_BLOCKING, 0, 0);
                        out_stream = transport.openOutputStream(Ci.nsITransport.OPEN_NON_BLOCKING, 0, 0);
                        bin_stream = binary_input_stream(in_stream);
                        input_stream_async_wait(in_stream, handle_input);
                    } catch (e) {
                        close();
                    }
                },
                onStopListening: function (s, status) {
                }
            });

        spawn_process_internal(spawn_process_helper_program, [key_file.path, server.port], false);
        return terminate;
    } catch (e) {
        terminate();

        if ((e instanceof Ci.nsIException) && e.result == Cr.NS_ERROR_INVALID_POINTER) {
            if (WINDOWS)
                throw new Error("Error spawning process: not yet supported on MS Windows");
            else
                throw new Error("Error spawning process: spawn-process-helper not found; try running \"make\"");
        }
        // Allow the exception to propagate to the caller
        throw e;
    }
}

/**
 * spawn_process_blind: spawn a process and forget about it
 */
define_keywords("$cwd", "$fds");
function spawn_process_blind(program_name, args) {
    keywords(arguments);
    /* Check if we can use spawn_process_internal */
    var cwd = arguments.$cwd;
    var fds = arguments.$fds;
    if (cwd == null && fds == null && args[0] == null)
        spawn_process_internal(program_name, args.slice(1));
    else {
        spawn_process(program_name, args, cwd,
                      null /* success callback */,
                      null /* failure callback */,
                      fds);
    }
}


//  Keyword arguments: $cwd, $fds
function spawn_and_wait_for_process(program_name, args) {
    keywords(arguments);
    var cc = yield CONTINUATION;
    spawn_process(program_name, args, arguments.$cwd,
                  cc, cc.throw,
                  arguments.$fds);
    var result = yield SUSPEND;
    yield co_return(result);
}

// Keyword arguments: $cwd, $fds
function shell_command_blind(cmd) {
    keywords(arguments);
    /* Check if we can use spawn_process_internal */
    var cwd = arguments.$cwd;
    var fds = arguments.$fds;

    var program_name;
    var args;

    if (POSIX) {
        var full_cmd;
        if (cwd)
            full_cmd = "cd \"" + shell_quote(cwd) + "\"; " + cmd;
        else
            full_cmd = cmd;
        program_name = getenv("SHELL") || "/bin/sh";
        args = [null, "-c", full_cmd];
    } else {
        var full_cmd;
        if (cwd) {
            full_cmd = "";
            if (cwd.match(/[a-z]:/i)) {
                full_cmd += cwd.substring(0,2) + " && ";
            }
            full_cmd += "cd \"" + shell_quote(cwd) + "\" && " + cmd;
        } else
            full_cmd = cmd;

        /* Need to convert the single command-line into a list of
            * arguments that will then get converted back into a *
            command-line by Mozilla. */
        var out = [null, "/C"];
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
        program_name = "cmd.exe";
        args = out;
    }
    spawn_process_blind(program_name, args, $fds = arguments.$fds);
}

function substitute_shell_command_argument(cmdline, argument) {
    if (!cmdline.match("{}"))
        return cmdline + " \"" + shell_quote(argument) + "\"";
    else
        return cmdline.replace("{}", "\"" + shell_quote(argument) + "\"");
}

function shell_command_with_argument_blind(command, arg) {
    shell_command_blind(substitute_shell_command_argument(command, arg), forward_keywords(arguments));
}

// Keyword arguments: $cwd, $fds
function shell_command(command) {
    if (!POSIX)
        throw new Error("shell_command: Your OS is not yet supported");
    var result = yield spawn_and_wait_for_process(getenv("SHELL") || "/bin/sh",
                                                  [null, "-c", command],
                                                  forward_keywords(arguments));
    yield co_return(result);
}

function shell_command_with_argument(command, arg) {
    yield co_return((yield shell_command(substitute_shell_command_argument(command, arg), forward_keywords(arguments))));
}
