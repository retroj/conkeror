/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

define_variable("editor_shell_command", getenv("VISUAL") || getenv("EDITOR") || "emacs",
    "Shell command used to invoke an external editor.\n" +
    "This defaults to the value of the EDITOR environment variable.  If " +
    "`run_external_editor_function' is non-null, it is used instead to " +
    "invoke an external editor and the value of this variable is ignored." +
    "It is used as part of a shell command in the following two ways:\n" +
    "<editor_shell_command> <file>\n" +
    "<editor_shell_command> +<line> <file>");


define_variable("run_external_editor_function", null,
    "Coroutine function called to invoke an external editor.\n" +
    "If this variable is set to a function, it is used to invoke "+
    "an external editor in place of `editor_shell_command'.  It "+
    "is called with the filename as the first argument, and "+
    "optionally the boolean keyword argument $temporary specifying "+
    "whether the file should be deleted after the editor is closed, "+
    "and optionally the keyword argument $line specifying a line "+
    "number to display.  The `create_external_editor_launcher' "+
    "function may be convenient for generating a function suitable "+
    "for use as the value of this variable.");

define_keyword("$temporary", "$line");
function open_file_with_external_editor (file) {
    keywords(arguments);

    if (run_external_editor_function) {
        yield run_external_editor_function(file, forward_keywords(arguments));
        return;
    }

    var line = arguments.$line;

    var cmd = editor_shell_command + " ";
    if (line != null)
        cmd += "+" + line + " ";
    cmd += "\"" + shell_quote(file.path) + "\"";

    try {
        yield shell_command(cmd);
    } finally {
        if (arguments.$temporary)  {
            try {
                file.remove(false /* not recursive */);
            } catch (e) {}
        }
    }
}

function create_external_editor_launcher (program, args) {
    return function (file) {
        keywords(arguments);
        var arr = [null].concat(args.slice());
        if (arguments.$line != null)
            arr.push("+" + arguments.$line);
        arr.push(file.path);
        try {
            yield spawn_and_wait_for_process(program, arr);
        } finally {
            if (arguments.$temporary) {
                try {
                    file.remove(false);
                } catch (e) {}
            }
        }
    };
}

function open_with_external_editor (lspec) {
    keywords(arguments);
    let [file, temp] = yield download_as_temporary(lspec);
    yield open_file_with_external_editor(file, $line = arguments.$line, $temporary = temp);
}

provide("external-editor");
