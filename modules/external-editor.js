
/* USER PREFERENCE */
var editor_shell_command = getenv("EDITOR") || "emacs";

/* USER PREFERENCE */
var run_external_editor_function = null;

define_keyword("$temporary", "$line", "$callback", "$failure_callback");

function open_file_with_external_editor(file) {
    keywords(arguments);
    if (run_external_editor_function) {
        run_external_editor_function(file, forward_keywords(arguments));
        return;
    }

    var callback = arguments.$callback;
    var failure_callback = arguments.$failure_callback;
    var line = arguments.$line;

    var cmd = editor_shell_command + " ";
    if (line != null)
        cmd += "+" + line + " ";
    cmd += "\"" + shell_quote(file.path) + "\"";
    function cont() {
        file.remove(false /* not recursive */);
    }
    if (arguments.$temporary)
        shell_command(
            default_directory.path, cmd,
            function () {
                if (callback)
                    callback();
                cont();
            },
            function () {
                if (failure_callback)
                    failure_callback();
                cont();
            });
    else
        shell_command(default_directory.path, cmd, callback, failure_callback);
}


function open_with_external_editor(load_spec) {
    var args = arguments;
    download_for_external_program
        (load_spec,
         function (file, is_temp_file) {
            open_file_with_external_editor(file,
                                           forward_keywords(args),
                                           $temporary = is_temp_file);
        });
}
