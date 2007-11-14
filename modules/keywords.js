
function keyword_argument(name, value)
{
    this.name = name;
    this.value = value;
}

function keyword_argument_forwarder(args)
{
    this.args = args;
}

function _get_keyword_argument_setter(name) {
    return function (value) { return new keyword_argument(name, value); }
}

function _get_keyword_argument_getter(name) {
    return function (value) { return new keyword_argument(name, value); }
}

// This function must be called with all string arguments, all of
// which must begin with "$".
function define_keywords()
{
    for (var i = 0; i < arguments.length; ++i)
    {
        var name = arguments[i];
        this.__defineSetter__(name, _get_keyword_argument_setter(name));
        this.__defineGetter__(name, _get_keyword_argument_getter(name));
    }
}

var define_keyword = define_keywords;

function forward_keywords(args)
{
    return new keyword_argument_forwarder(args);
}

function _process_keyword_arguments(out, args)
{
    for (var i = 0; i < args.length; ++i)
    {
        var arg = args[i];
        if (arg instanceof keyword_argument)
            out[arg.name] = arg.value;
        else if (arg instanceof keyword_argument_forwarder)
            _process_keyword_arguments(out, arg.args);
    }
}

// This is called with a function's `arguments' variable.  Additional
// default values can also be specified as subsequent arguments.
function keywords(args)
{
    /* First add our own arguments. */
    for (var i = 1; i < arguments.length; ++i)
    {
        var arg = arguments[i];
        args[arg.name] = arg.value;
    }
    _process_keyword_arguments(args, args);
}
