
/* USER PREFERENCE */
var editor_shell_command = getenv("EDITOR") || "emacs";

/* USER PREFERENCE */
var run_external_editor_function = null;

define_keyword("$temporary", "$line");
function open_file_with_external_editor(file) {
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
        yield shell_command(default_directory.path, cmd);
    } finally {
        if (arguments.$temporary)  {
            try {
                file.remove(false /* not recursive */);
            } catch (e) {}
        }
    }
}

function create_external_editor_launcher(program, args) {
    return function (file) {
        keywords(arguments);
        var arr = args.slice();
        if (arguments.$line != null)
            arr.push("+" + arguments.$line);
        arr.push(file.path);
        try {
            yield spawn_process(program, arr);
        } finally {
            if (arguments.$temporary) {
                try {
                    file.remove(false);
                } catch (e) {}
            }
        }
    };
}

function open_with_external_editor(load_spec) {
    keywords(arguments);
    let [file, temp] = yield download_as_temporary(load_spec);
    yield open_file_with_external_editor(file, $line = arguments.$line, $temporary = temp);
}
