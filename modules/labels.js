/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

require("pretty-print.js");

/**
 * @param name specifies the name of the label to be defined
 *
 * The remaining arguments should be strings, specifying the names of
 * required arguments. Additionally, the last additional argument can
 * be `null', which indicates that unlimited optional arguments can
 * follow. If `null' is not specified as the last argument, then it is
 * assumed that all optional arguments are keyword arguments. The
 * optional arguments are stored as an array in a member called $.
 */
function define_label (name) {
    var allow_optional = false;
    var required_args = [];
    for (let i = 1, ii = arguments.length; i < ii; ++i) {
        if (arguments[i] === null) {
            allow_optional = true;
            if (i + 1 != ii)
                throw new Error("null must be the last argument");
        } else {
            required_args.push(arguments[i]);
        }
    }
    function toString () {
        let optional = this.$;
        if (optional == null)
            optional = [];
        let printed_args = [];
        let seen_defined_yet = false;
        for (let i = required_args.length - 1; i >= 0; --i) {
            let arg = required_args[i];
            if (seen_defined_yet || this[arg] !== undefined) {
                printed_args.unshift(arg + " = " + pretty_print_value(this[arg]));
                seen_defined_yet = true;
            }
        }
        printed_args.push.apply(null, optional.map(pretty_print_value));
        for (let i in this) {
            if (i.length > 1 && i[0] == "$")
                printed_args.push(i + " = " + this[i]);
        }
        if (printed_args.length > 0)
            printed_args = "(" + printed_args.join(", ") + ")";
        else
            printed_args = "";
        return this._name + printed_args;
    }
    var result;
    result = function () {
        var o = { _name: name, toString: toString, _id: result, __is_label: true, toSource: toString };
        let max_req_arg = arguments.length;
        if (max_req_arg > required_args.length)
            max_req_arg = required_args.length;
        for (let i = 0; i < max_req_arg; ++i)
            o[required_args[i]] = arguments[i];
        if (allow_optional)
            o.$ = Array.prototype.slice.call(arguments, required_args.length);
        else
            write_keywords(o, arguments, required_args.length);
        return o;
    };
    result._name = name;
    result._id = result;
    result.$ = [];
    for (let i in required_args)
        result[i] = undefined;
    result.toString = toString;
    result.__is_label = true;
    conkeror[name] = result;
}

function label_id (value) {
    if (value == null)
        return null;
    return value._id;
}

provide("labels");
