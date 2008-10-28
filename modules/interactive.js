/**
 * (C) Copyright 2007-2008 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("utils.js");

var interactive_commands = new string_hashmap();

/**
 * name: string name of the command.
 *
 * doc: Documentation string, may be null.
 *
 * handler: A function to handle the command.
 *
 * The $prefix keyword, when true, means that the command
 * is a prefix-command.
 */
define_keywords("$prefix", "$browser_object");
function interactive(name, doc, handler)
{
    keywords(arguments);
    var cmd = {
        name: name,
        handler: handler,
        browser_object: arguments.$browser_object,
        prefix: arguments.$prefix,
        doc: doc,
        shortdoc: get_shortdoc_string(doc),
        source_code_reference: get_caller_source_code_reference() };

    interactive_commands.put(name, cmd);
    return name;
}

function interactive_error(str) {
    var e = new Error(str);
    e.__proto__ = interactive_error.prototype;
    return e;
}
interactive_error.prototype.__proto__ = Error.prototype;

function interactive_context() {}
interactive_context.prototype = {

    get P () this.prefix_argument,

    get p () univ_arg_to_number(this.prefix_argument),

    set p (default_value) univ_arg_to_number(this.prefix_argument, default_value),

    get minibuffer () this.window.minibuffer,

    get : function (x) this.buffer.get(x)
};

function handle_interactive_error(window, e) {
    if (e instanceof interactive_error)
        window.minibuffer.message(e.message);
    else if (e instanceof abort)
        window.minibuffer.message("Quit");
    else {
        dump_error(e);
        window.minibuffer.message("call interactively: " + e);
    }
}

// Any additional arguments specify "given" arguments to the function.
function call_interactively(I, command)
{
    var handler;
    var top_args;

    I.__proto__ = interactive_context.prototype;

    if (I.buffer == null)
        I.buffer = I.window.buffers.current;
    else if (I.window == null)
        I.window = I.buffer.window;

    var window = I.window;

    if (typeof(command) == "function") {
        // Special interactive command
        command(I);
        return;
    }

    var cmd = interactive_commands.get(command);
    if (!cmd)
    {
        window.minibuffer.message("Invalid command: " + command);
        return;
    }

    I.command = command;
    
    I.browser_object = I.buffer.default_browser_object_classes[command] ||
        cmd.browser_object;

    var handler = cmd.handler;

    try {
        while (typeof(handler) == "string") {
            let parent = interactive_commands.get(handler);
            handler = parent.handler;
            if (handler == command) {
                throw (interactive_error("circular command alias, "+command));
            }
        }

        var result = handler(I);
        if (is_coroutine(result)) {
            co_call(function() {
                try {
                    yield result;
                } catch (e) {
                    handle_interactive_error(window, e);
                }
            }());
        }
    } catch (e)
    {
        handle_interactive_error(window, e);
    }
}


function alternates () {
    let alts = Array.prototype.slice.call(arguments, 0);
    return function (I) {
        var index = 0;
        if (I.prefix_argument instanceof Array) {
            let num = I.prefix_argument = I.prefix_argument[0];
            while (num >= 4 && index + 1 < alts.length) {
                num = num / 4;
                index++;
            }
        }
        var result = alts[index](I);
        if (is_coroutine(result)) {
            co_call(function() { yield result; }());
        }
    }
}


/*
 * Utility functions for use in the rc to alter the behavior
 * of interactive commands.
 */
function set_handler (name, handler) {
    var cmd = interactive_commands.get(name);
    cmd.handler = handler;
}

function set_default_browser_object (name, browser_object) {
    var cmd = interactive_commands.get(name);
    cmd.browser_object = browser_object;
}

/*
I.f = interactive_method(
    $doc = "Existing file",
    $async = function (ctx, cont) {
        keywords(arguments, $prompt = "File:", $initial_value = default_directory.path,
                 $history = "file");
        ctx.window.minibuffer.read(
            $prompt = arguments.$prompt,
            $initial_value = arguments.$initial_value,
            $history = arguments.$history,
            $callback = function(s) {
                var f = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
                f.initWithPath(s);
                cont(f);
            });
    });

// FIXME: eventually they will differ, when completion for files is added
I.F = I.f;
*/
