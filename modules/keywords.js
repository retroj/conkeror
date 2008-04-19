/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

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
    return function () { return new keyword_argument(name, true); }
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
    function helper(in_args)
    {
        // Begin at the first "undeclared" argument
        for (var i = in_args.callee.length; i < in_args.length; ++i)
        {
            var arg = in_args[i];
            if (arg instanceof keyword_argument)
                args[arg.name] = arg.value;
            else if (arg instanceof keyword_argument_forwarder)
                helper(arg.args);
        }
    }
    helper(args);
}
