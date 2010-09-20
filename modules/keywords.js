/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
 **/

in_module(null);

{
    let _keyword_argument_list = [];
    let _get_keyword_argument_setter = function _get_keyword_argument_setter (name) {
        return function (value) { _keyword_argument_list.push(name); return value; };
    };

    let _get_keyword_argument_getter = function _get_keyword_argument_getter (name) {
        return function () { _keyword_argument_list.push(name); return true; };
    };

    // This function must be called with all string arguments, all of
    // which must begin with "$".
    function define_keywords () {
        for (var i = 0, alen = arguments.length; i < alen; ++i) {
            var name = arguments[i];
            this.__defineSetter__(name, _get_keyword_argument_setter(name));
            this.__defineGetter__(name, _get_keyword_argument_getter(name));
        }
    }

    var define_keyword = define_keywords;

    function write_keywords (output, input, first_index) {
        if (first_index == null)
            first_index = input.callee.length;
        let max_index = input.length;
        let count = max_index - first_index;
        if (count > 0) {
            let offset = _keyword_argument_list.length - 1;
            for (let i = max_index - 1; i >= first_index; --i) {
                let value = input[i];
                if (value instanceof keyword_argument_forwarder) {
                    for (let x in value)
                        output[x] = value[x];
                    --count;
                } else {
                    let name = _keyword_argument_list[offset--];
                    output[name] = value;
                }
            }
            _keyword_argument_list.length -= count;
        }
    }

    let keyword_argument_forwarder = function keyword_argument_forwarder (args) {
        if ("_processed_keywords" in args) {
            for (let x in args) {
                if (x[0] == "$")
                    this[x] = args[x];
            }
        } else
            write_keywords(this, args);
    };

    function keywords (args) {
        write_keywords(args, arguments);
        write_keywords(args, args);
        args._processed_keywords = true;
    }

    function forward_keywords (args) {
        return new keyword_argument_forwarder(args);
    }

    function protect_keywords () {
        return new keyword_argument_forwarder(arguments);
    }
}

provide("keywords");
