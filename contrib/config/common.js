
// the default page for new buffers.
homepage = "about:blank";


// load urls from the command line in new buffers instead
// of new windows.
url_remoting_fn = load_url_in_new_buffer;


// load download buffers in the background in the current
// window, instead of in new windows.
download_buffer_automatic_open_target = OPEN_NEW_BUFFER_BACKGROUND;


// save a keystroke when selecting a dom node by number.
hints_auto_exit_delay = 500;
hints_ambiguous_auto_exit_delay = 500;


// default directory for downloads and shell commands.
cwd = get_home_directory();
cwd.append("downloads");


// automatically handle some mime types internally.
content_handlers.set("application/pdf", content_handler_save);


// external programs for handling various mime types.
external_content_handlers.set("application/pdf", "xpdf");
external_content_handlers.set("video/*", "urxvtc -e mplayer");


// use vi as external editor.
editor_shell_command = "urxvt -e vi";


// view source in your editor.
view_source_use_external_editor = true;


// let xkcd-mode put the funny alt text into the page.
xkcd_add_title = true;
