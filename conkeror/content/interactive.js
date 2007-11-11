

var interactive_methods = {
a: { func: function (spec) {
            // -- Function name: symbol with a function definition.
            return null;
        }
},

active_document: { func: function (spec) {
            // -- The document currently being browsed.
            return this.window.content.document;
        }
},

// b: existing buffer.
b: { async: function (spec, iargs, callback, callback_args, given_args) {
            var bufs = [];
            var existing_names = new Object();
            this.buffers.for_each(function(b) {
                    var base_name = b.name;
                    var name = base_name;
                    var index = 1;
                    while (existing_names["i_" + name])
                    {
                        ++index;
                        name = base_name + "<" + index + ">";
                    }
                    existing_names["i_" + name] = true;
                    bufs.push([name, b]);
                });
            var prompt = (1 in spec && spec[1] ? spec[1].call (this, callback_args) : "Buffer: ");
            var initval = (2 in spec && spec[2] ?
                           spec[2].call (this, callback_args) : this.buffers.current.name);
            var frame = this;
            this.minibuffer.read({prompt: prompt, initial_value: initval, history: "buffer",
                        completions: bufs,
                        callback: function (s) {
                                         callback_args.push (s);
                                         do_interactive.call (frame, iargs, callback, callback_args, given_args);
                    }});
        },
     doc: "Name of existing buffer, defaulting to the current one.\n"+
     "Its optional arguments are:\n"+
     "PROMPT      A string prompt for the minibuffer read.  The default is 'Buffer: '.\n"+
     "INITVAL     A function to get the initial value.  The default is the current URL."
},

// XXX: does it make sense to have an interactive method for non-existent buffers?
B: { func: function (spec) {
            // -- Name of buffer, possibly nonexistent.
            return null;
        }
},

c: { func: function (spec) {
            // -- Character
            return null;
        }
},

C: { func: function (spec) {
            // -- Command name: symbol with interactive function definition.
            return null;
        }
},

content_charset: { func: function (spec) {
            // -- Charset of content area of focusedWindow
            var focusedWindow = this.document.commandDispatcher.focusedWindow;
            if (focusedWindow == this.window)
                focusedWindow = this.content;
            if (focusedWindow)
                return this.document.commandDispatcher.focusedWindow.document.characterSet;
            else
                return null;
        }
},

content_selection: { func: function (spec) {
            // -- Selection of content area of focusedWindow
            var focusedWindow = this.document.commandDispatcher.focusedWindow;
            if (focusedWindow == this.window)
                focusedWindow = this.content;
            return focusedWindow.getSelection ();
        }
},

current_buffer_window: { func: function (spec) {
            return this.content;
        }
},

current_command: { func: function (spec) {
            // -- Name of the command being evaluated right now.
            return conkeror.current_command;
        }
},

current_frame: { func: function (spec) {
            // -- Frame of the current command.
            return this;
        }
},

current_frameset_frame: { func: function (spec) {
            var w = this.document.commandDispatcher.focusedWindow;
            if (w.top != this.content)
                w = this.content;
            return w;
        }
},

current_frameset_frame_url: { func: function (spec) {
            var w = this.document.commandDispatcher.focusedWindow;
            if (w.top != this.content)
                w = this.content;
            return w.location.href;
        }
},

current_url: { func: function (spec) {
            return this.getWebNavigation().currentURI.spec;
        }
},

d: { func: function (spec) {
            // -- Value of point as number.  Does not do I/O.
            return null;
        }
},

D: { func: function (spec) {
            // -- Directory name.
            return null;
        }
},

// e: Event that invoked this command.
e: { func: function (spec) { return this.keyboard_state.last_command_event; } },

f: { async: function (spec, iargs, callback, callback_args, given_args) {
            // -- Exisiting file object. (nsILocalFile)
            var prompt = (1 in spec && spec[1] ? spec[1].call (this, callback_args) : "File: ");
            var initval = (2 in spec && spec[2] ? spec[2].call (this, callback_args) : default_directory.path);
            var hist = (3 in spec ? spec[3] : null);
            var frame = this;
            this.minibuffer.read({
                        prompt:        prompt,
                        initial_value: initval,
                        history: hist,
                        callback: function (s) {
                                         var f = Components.classes["@mozilla.org/file/local;1"]
                                             .createInstance(Components.interfaces.nsILocalFile);
                                         f.initWithPath (s);
                                         callback_args.push (f);
                                         do_interactive.call (frame, iargs, callback, callback_args, given_args);
                    } });
        }
},

F: { async: function (spec, iargs, callback, callback_args, given_args) {
            // -- Possibly nonexistent file object. (nsILocalFile)
            var prompt = (1 in spec && spec[1] ? spec[1].call (this, callback_args) : "File: ");
            var initval = (2 in spec && spec[2] ? spec[2].call (this, callback_args) : default_directory.path);
            var hist = (3 in spec ? spec[3] : null);
            var frame = this;
            this.minibuffer.read({
                        prompt:        prompt,
                        initial_value: initval,
                        history: hist,
                        callback: function (s) {
                                         var f = Components.classes["@mozilla.org/file/local;1"]
                                             .createInstance(Components.interfaces.nsILocalFile);
                                         f.initWithPath (s);
                                         callback_args.push (f);
                                         do_interactive.call (frame, iargs, callback, callback_args, given_args);
                    } });
        }
},

focused_link_url: { func: function (spec) {
            // -- Focused link element
            ///JJF: check for errors or wrong element type.
            return get_link_location (this.document.commandDispatcher.focusedElement);
        }
},


// i: Ignored, i.e. always nil.  Does not do I/O.
i: { func: function (spec) { return null; } },

// image: numbered image.
image: { async: function (spec, iargs, callback, callback_args, given_args) {
            // -- Number read using minibuffer.
            var prompt = (1 in spec ? spec[1].call (this, callback_args) : "Image Number: ");
            var buf_state = this.getBrowser().numberedImages;
            if (!buf_state) {
                // turn on image numbers
                gTurnOffLinksAfter = true;
                this.toggleNumberedImages();
            }
            var frame = this;
            // Setup a context for the context-keymap system.
            this.readFromMiniBuffer (prompt, null, null, null, null, null,
                                     function (s) {
                                         callback_args.push (s);
                                         if (gTurnOffLinksAfter) {
                                             toggleNumberedImages();
                                             gTurnOffLinksAfter = false;
                                         }
                                         do_interactive.call (frame, iargs, callback, callback_args, given_args);
                                     },
                                     function () {
                                         if (this.gTurnOffLinksAfter) {
                                             this.toggleNumberedImages ();
                                             this.gTurnOffLinksAfter = false;
                                         }
                                     });
        }
},


image_url: { async: function (spec, iargs, callback, callback_args, given_args) {

            var prompt = (1 in spec ? spec[1].call (this, callback_args) : "Image Number: ");
            var buf_state = this.getBrowser().numberedImages;
            if (!buf_state) {
                // turn on image numbers
                this.gTurnOffLinksAfter = true;
                this.toggleNumberedImages();
            }
            var frame = this;
            // Setup a context for the context-keymap system.
            this.readFromMiniBuffer (prompt, null, null, null, null, null,
                                     function (s) {
                                         function fail (number)
                                         {
                                             this.message ("'"+number+"' is not the number of any image here. ");
                                         }
                                         var nl = this.get_numberedlink (s);
                                         if (! nl) { this.fail (s); return; }
                                         var type = nl.nlnode.getAttribute("__conktype");
                                         var loc;
                                         if (type == "image" && nl.node.getAttribute("src")) {
                                             loc = nl.node.getAttribute("src");
                                             loc = makeURLAbsolute (nl.node.baseURI, loc);
                                         } else {
                                             fail (number);
                                         }
                                         callback_args.push (loc);

                                         if (this.gTurnOffLinksAfter) {
                                             this.toggleNumberedImages();
                                             this.gTurnOffLinksAfter = false;
                                         }
                                         do_interactive.call (frame, iargs, callback, callback_args, given_args);
                                     },
                                     function () {
                                         if (this.gTurnOffLinksAfter) {
                                             this.toggleNumberedImages ();
                                             this.gTurnOffLinksAfter = false;
                                         }
                                     });
        }
},


k: { func: function (spec) {
            // -- Key sequence (downcase the last event if needed to get a definition).
            return null;
        }
},

K: { func: function (spec) {
            // -- Key sequence to be redefined (do not downcase the last event).
            return null;
        }
},

// link: numbered link
link: { async: function (spec, iargs, callback, callback_args, given_args) {
            var prompt = (1 in spec && spec[1] ? spec[1].call (this, callback_args) : "Link Number: ");
            var initVal = (2 in spec && spec[2] ? spec[2].call (this, callback_args) : "");
            /* FIXME: numbered link toggling is not yet working */
            /* 
            var buf_state = this.getBrowser().numberedLinks;
            if (!buf_state) {
                this.gTurnOffLinksAfter = true;
                toggleNumberedLinks();
            } */
            // Setup a context for the context-keymap system.
            this.numberedlinks_minibuffer_active = true;
            var frame = this;
    this.minibuffer.read ({prompt: prompt, initial_value: initVal,
                           callback: function (s) {
                                         callback_args.push (s);
                                         /* FIXME: numbered link toggling not yet working
                                         if (this.gTurnOffLinksAfter) {
                                             this.toggleNumberedLinks();
                                             this.gTurnOffLinksAfter = false;
                                         }*/
                                         // unset keymap context
                                         this.numberedlinks_minibuffer_active = false;
                                         do_interactive.call (frame, iargs, callback, callback_args, given_args);
                                     },
                           abort_callback:
                                     function () {
                                       /* FIXME: numbered link toggling not yet working */
                                       /*
                                         if (this.gTurnOffLinksAfter) {
                                             this.toggleNumberedLinks ();
                                             this.gTurnOffLinksAfter = false;
                                         }
                                         */
                                         // unset keymap context
                                         this.numberedlinks_minibuffer_active = false;
                                     }});
        }
},

m: { func: function (spec) {
            // -- Value of mark as number.  Does not do I/O.
            return null;
        }
},

mathml_node: { async: function (spec, iargs, callback, callback_args, given_args) {
            // -- DOM node of a MathML
            //TO-DO: implement mathml_node interactive spec.
            callback_args.push (null);
            do_interactive.call (this, iargs, callback, callback_args, given_args);
        }
},

minibuffer_exit: { func: function (spec) {
            // -- minibuffer.exit
            return this.minibuffer.exit;
        }
},

// n: Number read using minibuffer.
n: { async: function (spec, iargs, callback, callback_args, given_args) {
            var prompt = "Number: ";
            if (1 in spec)
                prompt = spec[1];
            var frame = this;
            this.minibuffer.read
            ({  prompt: prompt,
                callback: function (s) {
                    callback_args.push (s);
                    do_interactive.call (frame, iargs, callback, callback_args, given_args);
                }
            });
        }
},

N: { func: function (spec) {
            // -- Raw prefix arg, or if none, do like code `n'.
            return null;
        }
},

// p: Prefix arg converted to number.  Does not do I/O.
p: { func: function (spec) {
            return univ_arg_to_number(this.gPrefixArg);
        }
},

// P: Prefix arg in raw form.  Does not do I/O.
P: { func: function (spec) {
            return this.gPrefixArg;
        }
},

pref: { func: function (spec) {
            var pref = spec[1];
            var type = preferences.getPrefType (pref);
            switch (type) {
                case preferences.PREF_BOOL:
                    return preferences.getBoolPref (pref);
                case preferences.PREF_INT:
                    return preferences.getIntPref (pref);
                case preferences.PREF_STRING:
                    return preferences.getCharPref (pref);
                default:
                    return null;
            }
        }
},

r: { func: function (spec) {
            // -- Region: point and mark as 2 numeric args, smallest first.  Does no I/O.
            return null;
        }
},

result: { func: function (spec) {
            // -- result of given function
            return (1 in spec ? spec[1]() : null);
        }
},

s: { async: function (spec, iargs, callback, callback_args, given_args) {
            // -- Any string.
            var prompt = "String: ";
            if (1 in spec)
                prompt = spec[1];
            var frame = this;
            this.minibuffer.read({ prompt: prompt,
                        callback:  function (s) {
                                         callback_args.push (s);
                                         do_interactive.call (frame, iargs, callback, callback_args, given_args);
                    }});
        }
},

S: { func: function (spec) {
            // -- Any symbol.
            return null;
        }
},

//RETROJ: this may be improperly named.  it can read either an url or a
//        webjump from the minibuffer, but it will always return an url.
url_or_webjump: { async: function (spec, iargs, callback, callback_args, given_args) {
            var prompt = (1 in spec && spec[1] ? spec[1].call (this, callback_args) : "URL: ");
            var initval = (2 in spec && spec[2] ? spec[2].call (this, callback_args) : "");
            var hist = (3 in spec ? spec[3] : null);
            var completions = (4 in spec && spec[4] ? spec[4].call (this, callback_args) : []);
            var frame = this;
            this.minibuffer.read({prompt: prompt, initial_value : initval, history: hist,
                        completions : completions,
                        allow_non_matches : true,
                        callback : function (match, s) {
                                         if (s == "") // well-formedness check. (could be better!)
                                             throw ("invalid url or webjump (\""+s+"\")");
                                         callback_args.push (get_url_or_webjump (s));
                                         do_interactive.call (frame, iargs, callback, callback_args, given_args);
                    }});
        }
},

v: { func: function (spec) {
            // -- Variable name: symbol that is user-variable-p.
            return null;
        }
},

value: { func: function (spec) {
            // -- given value
            return (1 in spec ? spec[1] : null);
        }
},

x: { func: function (spec) {
            // -- Lisp expression read but not evaluated.
            return null;
        }
},

X: { func: function (spec) {
            // -- Lisp expression read and evaluated.
            return null;
        }
},

z: { func: function (spec) {
            // -- Coding system.
            return null;
        }
},

Z: { func: function (spec) {
            // -- Coding system, nil if no prefix arg.
            return null;
        }
}};


function do_interactive (iargs, callback, callback_args, given_args)
{
    if (! callback_args) callback_args = Array ();

    var iarg, method;
    while (iargs.length > 0)
    {
        // process as many synchronous args as possible
        iarg = iargs.shift ();
        if (given_args && 0 in given_args) {
            var got = given_args.shift ();
            if (got) {
                callback_args.push (got);
                continue;
            }
        }
        if (typeof (iarg) == "string") {
            method = iarg;
            iarg = Array (iarg);
        } else {
            method = iarg[0];
        }

        if (! method in interactive_methods) {
            // prefix should get reset on failed interactive call.
            this.gPrefixArg = null;
            this.minibuffer.message ("Failed: invalid interactive specifier: '"+iarg+"'");
            return;
        }

        if ('func' in interactive_methods[method])
        {
            // 'func' denotes that this method can be done synchronously.
            try {
                callback_args.push (interactive_methods[method].func.call (this, iarg));
            } catch (e) {
                this.minibuffer.message ('do_interactive (' + method + '): ' + e);
            }
            // do_interactive (iargs, callback, callback_args);
        } else {
            // an asynchronous call needs to be made.  break the loop and let
            // the async handler below take over.
            break;
        }
        method = null;
    }

    if (method) {
        if (! 'async' in interactive_methods[method]) {
            // fail.  improperly defined interactive method.
            // prefix should get reset on failed interactive call.
            this.gPrefixArg = null;
            this.minibuffer.message ("Failed: improperly defined interactive specifer: '"+iarg+"'");
        }

        // go on a little trip..
        //
        // asynchronous methods get called with their interactive spec and
        // all the information they need to continue the interactive
        // process when their data has been gathered.
        //
        try {
            interactive_methods[method].async.call (this, iarg, iargs, callback, callback_args, given_args);
        } catch (e) {
            this.minibuffer.message ('do_interactive (' + method + '): ' + e);
        }
    } else {
        // always reset the prefix arg after collecting all
        // interactive data, in case it appears multiple times in the
        // interactive spec.
        this.gPrefixArg = null;
        try {
            callback.call (this, callback_args);
        } catch (e) {
            this.minibuffer.message ('do_interactive <CALLBACK>: ' + e);
            dumpln ('do_interactive <CALLBACK>: ' + e);
        }
    }
}


function call_interactively(frame, cmd, given_args)
{
    try {
        conkeror.current_command = cmd;
        for (var i=0; i < conkeror.commands.length; i++) {
            if (conkeror.commands[i][0] == cmd)
            {
                // Copy the interactive args spec, because do_interactive is
                // destructive to its first argument.
                var iargs = conkeror.commands[i][2].slice (0);
                var given = given_args ? given_args.slice (0) : null;
                do_interactive.call (frame,
                                     iargs,
                                     function (args) {
                                         conkeror.commands[i][1].apply (conkeror, args);
                                     },
                                     null,
                                     given);
                return;
            }
        }
        frame.minibuffer.message("No such command '" + cmd + "'");
    } catch(e) {
        frame.minibuffer.message ("call_interactively: " + e);
    }
}


function interactive(name, fn, args)
{
    for (var i=0; i < conkeror.commands.length; i++) {
	if (conkeror.commands[i][0] == name) {
	    conkeror.commands[i] = [name,fn,args];
	    return;
	}
    }
    conkeror.commands.push([name,fn,args]);
}

