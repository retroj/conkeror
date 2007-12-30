function interactive_variable(name, value)
{
    this.name = name;
    this.value = value;
}

function interactive_variable_reference(name)
{
    this.name = name;
}

function _get_interactive_variable_setter(name) {
    return function (value) { return new interactive_variable(name, value); }
}

function _get_interactive_variable_getter(name) {
    return function () { return new interactive_variable_reference(name); }
}


function define_interactive_variable_keywords()
{
    for (var i = 0; i < arguments.length; ++i)
    {
        var name = arguments[i];
        this.__defineSetter__(name, _get_interactive_variable_setter(name));
        this.__defineGetter__(name, _get_interactive_variable_getter(name));
    }
}

define_interactive_variable_keywords("$$", "$$1", "$$2", "$$3", "$$4", "$$5", "$$6", "$$7", "$$8", "$$9");

var interactive_commands = new string_hashmap();

function interactive_spec(args, sync_handler, async_handler)
{
    this.args = args;
    this.sync_handler = sync_handler;
    this.async_handler = async_handler;
}

define_keywords("$doc", "$sync", "$async");
function interactive_method()
{
    keywords(arguments, $doc = null, $sync = null, $async = null);
    var sync = arguments.$sync;
    var async = arguments.$async;
    if ((sync == null) == (async == null))
        throw new Error("Invalid arguments.");
    var i = function () {
        return new interactive_spec(arguments, sync, async);
    };
    i.is_interactive_method = true;
    return i;
}

var I = {};

// Special interactive methods
function interactive_bind_spec(args)
{
    this.handler = args[0];
    this.args = Array.prototype.slice.call(args, 1);
}

I.bind = function () {
    return new interactive_bind_spec(arguments);
};

/**
 * First argument is the command name.
 *
 * This is optionally followed by a documentation string.
 *
 * This is followed by the command function.
 *
 * Remaining arguments specify interactive arguments.
 */
function interactive(name)
{
    var doc = null;
    var handler;
    var offset = 1;
    if (typeof(arguments[1]) == "string")
    {
        doc = arguments[1];
        offset = 2;
    }
    handler = arguments[offset++];
    var args = Array.prototype.slice.call(arguments, offset);
    var shortdoc = null;
    if (doc != null) {
        var idx = doc.indexOf("\n");
        if (idx >= 0)
            shortdoc = doc.substring(0,idx);
        else
            shortdoc = doc;
    }
    interactive_commands.put(name, { name: name, handler: handler, doc: doc, shortdoc: shortdoc, arguments: args });
}

function interactive_error(str) {
    var e = new Error(str);
    e.is_interactive_error = true;
    return e;
}

// Any additional arguments specify "given" arguments to the function.
function call_interactively(ctx, command)
{
    var cmd = interactive_commands.get(command);
    var frame = ctx.frame;
    if (!cmd)
    {
        frame.minibuffer.message("Invalid command: " + command);
        return;
    }
    ctx.command = command;

    function join_argument_lists(args1, args2)
    {
        if (args1.length == 0)
            return args2;
        var positional_args = [];
        var keyword_args = [];
        var keywords_seen = new Object();

        // First process the given arguments (args1)
        for (var i = 0; i < args1.length; ++i)
        {
            var arg = args1[i];
            if (arg instanceof keyword_argument)
            {
                keywords_seen[arg.name] = keyword_args.length;
                keyword_args.push(arg);
            } else
                positional_args[i] = arg;
        }

        // Process the argument list specified in the command definition (args2)
        for (var i = 0; i < args2.length; ++i)
        {
            var arg = args2[i];
            var actual_arg = arg;
            if (arg instanceof interactive_variable)
                actual_arg = arg.value;
            if (actual_arg instanceof keyword_argument)
            {
                if (actual_arg.name in keywords_seen)
                {
                    if (arg != actual_arg)
                    {
                        var j = keywords_seen[actual_arg.name];
                        keyword_args[j] = new interactive_variable(arg.name, keyword_args[j]);
                    }
                } else
                    keyword_args.push(arg);
            } else 
            {
                if (positional_args[i] === undefined)
                    positional_args[i] = arg;
                else if (actual_arg != arg)
                    positional_args[i] = new interactive_variable(arg.name, positional_args[i]);
            }
        }
        return positional_args.concat(keyword_args);
    }


    var top_args = join_argument_lists(Array.prototype.slice.call(arguments, 2),
                                       cmd.arguments);

    var variable_values = new Object();

    var state = [{args: top_args, out_args: [], handler: cmd.handler}];
    var next_variable = null;

    function process_next()
    {
        try {
            do {
                var top = state[state.length - 1];
                /*
                dumpln("at level " + state.length +", args.length: " + top.args.length
                       +", out_args.length: " + top.out_args.length);
                */

                // Check if we are done with this level
                if  (top.args.length == top.out_args.length)
                {
                    state.pop();
                    next_variable = top.variable;
                    if (top.async_handler)
                    {
                        top.async_handler.apply(null, [ctx,cont].concat(top.out_args));
                        return;
                    }
                    var result;
                    if (top.sync_handler)
                        result = top.sync_handler.apply(null, [ctx].concat(top.out_args));
                    else if (top.handler)
                    {
                        result = top.handler.apply(null, top.out_args);
                        if (state.length == 0)
                            return;
                    }
                    push_arg(result);
                    continue;
                }

                // Not done: we need to process the next argument at this level
                var arg = top.args[top.out_args.length];
                var variable = null;
                if (arg instanceof interactive_variable)
                {
                    variable = arg.name;
                    arg = arg.value;
                }
                var spec = arg;
                if (arg instanceof keyword_argument)
                    spec = arg.value;
                if (spec instanceof interactive_bind_spec)
                {
                    state.push({args: spec.args, out_args: [], handler: spec.handler, variable: variable});
                    continue;
                }
                // Expand an interactive_method
                if (typeof(spec) == "function" && spec.is_interactive_method)
                    spec = spec();
                if (spec instanceof interactive_spec) {
                    state.push({args: spec.args, out_args: [],
                                sync_handler: spec.sync_handler,
                                async_handler: spec.async_handler,
                                variable: variable});
                } else {
                    if (spec instanceof interactive_variable_reference)
                    {
                        if (!(spec.name in variable_values))
                            throw new Error("Invalid interactive variable reference: " + spec.name);
                        spec = variable_values[spec.name];
                    }

                    // Just a normal value
                    if (arg instanceof keyword_argument)
                        arg = new keyword_argument(arg.name, spec);
                    else
                        arg = spec;
                    top.out_args.push(arg);
                    if (variable)
                        variable_values[variable] = spec;
                }
            } while (true);
        } catch (e) {
            if (e.is_interactive_error) {
                frame.minibuffer.message("" + e);
            } else {
                frame.minibuffer.message("call_interactively: "  + e);
                dump_error(e);
            }
        }
    }

    function push_arg(out_arg)
    {
        var top = state[state.length - 1];
        var arg = top.args[top.out_args.length];
        if (arg instanceof keyword_argument)
            out_arg = new keyword_argument(arg.name, out_arg);
        top.out_args.push(out_arg);
        if (next_variable)
            variable_values[next_variable] = out_arg;
    }

    function cont(out_arg)
    {
        push_arg(out_arg);
        process_next();
    }

    process_next();
}

I.p = interactive_method(
    $doc = "Prefix argument converted to a number",
    $sync = function (ctx, default_value) {
        return univ_arg_to_number(ctx.prefix_argument, default_value);
    });

I.P = interactive_method(
    $doc = "Raw prefix argument",
    $sync = function (ctx) {
        return ctx.prefix_argument;
    });

I.current_frame = interactive_method(
    $doc = "Current frame",
    $sync = function (ctx) {
        return ctx.frame;
    });

I.current_command = interactive_method(
    $doc = "Current command",
    $sync = function (ctx) {
        return ctx.command;
    });

I.e = interactive_method(
    $doc = "Most recent keyboard event",
    $sync = function (ctx) {
        return ctx.event;
    });

I.s = interactive_method(
    $doc = "Read a string from the minibuffer",
    $async = function (ctx, cont) {
        keywords(arguments);
        ctx.frame.minibuffer.read($prompt = "String:", $history = "string",
                                  forward_keywords(arguments),
                                  $callback = cont);
    });

I.n = interactive_method(
    $doc = "Read a number from the minibuffer",
    $async = function (ctx, cont) {
        keywords(arguments, $prompt = "Number:", $history = "number");
        ctx.frame.minibuffer.read($prompt = "Number:", $history = "number",
                                  $callback = cont);
    });

I.pref = interactive_method(
    $sync = function (pref) {
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
    });

I.C = interactive_method(
    $doc = "Name of a command",
    $async = function (ctx, cont) {
        keywords(arguments, $prompt = "Command:", $history = "command");
        var completer = prefix_completer(
            $completions = function (visitor) {
                interactive_commands.for_each_value(visitor);
            },
            $get_string = function (x) {
                return x.name;
            },
            $get_description = function (x) {
                return x.shortdoc || "";
            },
            $get_value = function (x) {
                return x.name;
            });
        ctx.frame.minibuffer.read($prompt = arguments.$prompt,
                                  $history = arguments.$history,
                                  $completer = completer,
                                  $match_required = true,
                                  $callback = cont);
    });

I.f = interactive_method(
    $doc = "Existing file",
    $async = function (ctx, cont) {
        keywords(arguments, $prompt = "File:", $initial_value = default_directory.path,
                 $history = "file");
        ctx.frame.minibuffer.read(
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
