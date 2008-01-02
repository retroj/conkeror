
/* USER PREFERENCE */
var editor_program = "emacs";

/* USER PREFERENCE */
var run_external_editor_function = null;


function view_with_external_editor(load_spec, line_number) {
    download_for_external_program
        (load_spec,
         function (file, is_temp_file) {
            if (run_external_editor_function)
                run_external_editor_function(file, is_temp_file, line_number);
            else {
                var args = [];
                if (line_number != null)
                    args.push("+" + line_number);
                args.push(file.path);
                function cont() {
                    file.remove(false /* not recursive */);
                }
                if (is_temp_file)
                    spawn_process(editor_program, args, cont, cont);
                else
                    spawn_process(editor_program, args);
            }
        });
}
