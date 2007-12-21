
var start_time = Date.now ();

require("keywords.js");

require("hook.js");

require("debug.js");
require("utils.js");
require("interactive.js");
require("minibuffer.js"); // depends: interactive.js
require("minibuffer-completion.js");
require("localfile.js");
require("keyboard.js");
require("buffer.js");
require("frame.js");
require("popup.js");
require("daemon-mode.js");
require("mode-line.js");
require("save.js");

require("commands.js"); // depends: interactive.js
require("frameset.js"); // depends interactive.js
require("webjump.js"); // depends: interactive.js


require("bindings.js"); // depends: keyboard.js

require("find.js");
require("numberedlinks.js");

require("rc.js");

//require("scroll-bars.js");

var url_remoting_fn = make_frame;

init_webjumps ();

init_window_title ();
