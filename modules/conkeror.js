
var start_time = Date.now ();

require("keywords.js");

require("hook.js");
require("debug.js");
require("utils.js");
require("interactive.js");
require("minibuffer.js"); // depends: interactive.js
require("minibuffer-completion.js");
require("localfile.js");
require("thread.js");
require("process.js");
require("mime.js");
require("keyboard.js");
require("buffer.js");
require("window.js");
require("popup.js");
require("daemon-mode.js");
require("mode-line.js");
require("download-manager.js");


require("commands.js"); // depends: interactive.js
require("webjump.js"); // depends: interactive.js
require("history.js");

require("save.js");

require("zoom.js");
require("element.js");
require("follow-relationship.js");


//require("bindings.js"); // depends: keyboard.js

require("find.js");
//require("numberedlinks.js");
require("hints.js");

require("help.js");


require("rc.js");
require("bindings/default/bindings.js");

//require("scroll-bars.js");


init_webjumps ();

init_window_title ();
