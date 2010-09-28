/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 * (C) Copyright 2009-2010 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

var start_time = Date.now();

require("keywords.js", null);
require("labels.js", null);
require("coroutine.js", null);
require("debug.js", null);
require("hook.js", null);
require("timer.js", null);
require("pretty-print.js", null);
require("services.js", null);

require("string.js", null);
require("pref.js", null);
require("env.js", null);
require("source-code.js", null);
require("user-variable.js", null);
require("stylesheet.js", null);
require("array.js", null);
require("builtin-commands.js", null);
require("text.js", null);

require("user-agent.js", null);
require("utils.js", null);
require("interactive.js", null);
require("minibuffer.js", null);
require("minibuffer-read.js", null);
require("minibuffer-read-option.js", null);
require("minibuffer-completion.js", null);
require("minibuffer-read-file.js", null);
require("spawn-process.js", null);
require("mime.js", null);
require("keymap.js", null);
require("input.js", null);
require("buffer.js", null);
require("window.js", null);
require("content-handler.js", null);
require("download-manager.js", null);

require("element.js", null);

require("content-buffer.js", null);
require("content-buffer-input.js", null);
require("quote.js", null);
require("caret.js", null);

require("universal-argument.js", null);
require("commands.js", null);
require("webjump.js", null);
require("history.js", null);
require("scroll.js", null);

require("save.js", null);

require("zoom.js", null);
require("follow-relationship.js", null);

require("isearch.js", null);

require("hints.js", null);

require("help.js", null);

require("rc.js", null);

require("ssl.js", null);

require("media.js", null);

require("command-line.js", null);

require("search-engine.js", null);

require("permission-manager.js", null);
require("cookie.js", null);
require("cache.js", null);

require("theme.js", null);
require("formfill.js", null);


define_variable("cwd", get_home_directory(),
    "Current working directory, also known as your default download "+
    "and shell-command directory.  It will often have a buffer-local "+
    "value.");


/* Re-define load_paths as a user variable. */
define_variable("load_paths", load_paths,
    "Array of URL prefixes searched in order when loading a module.\n"+
    "Each entry must end in a slash, and should begin with file:// or "+
    "chrome://.");

provide("conkeror");
