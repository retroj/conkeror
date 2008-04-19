/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

/* Adds the specified function to the specified hook.  To add a local
 * hook, invoke this function as:  add_hook.call(context, hook_name, ...).
 * Note: hook_name must be a string */
function add_hook(hook_name, func, prepend, avoid_duplicates)
{
    if (!this[hook_name])
        this[hook_name] = [];
    var hook = this[hook_name];

    if (avoid_duplicates && hook.indexOf(func) != -1)
        return func;

    if (prepend)
        hook.unshift(func);
    else
        hook.push(func);
    return func;
}

/**
 * Call every function in the array `hook' with the remaining
 * arguments of this function.  Note: This should only be used by
 * define_hook and friends to define hook.run(...) functions.  Hooks
 * should always be run by calling hook.run(...).
 */
function run_hooks(hook, args)
{
    if (hook == null)
        return;
    for (let i = 0; i < hook.length; ++i)
        hook[i].apply (null, Array.prototype.slice.call(args));
}

function run_hooks_until_success(hook, args)
{
    if (hook == null)
        return false;
    for (let i = 0; i < hook.length; ++i)
        if (hook[i].apply (null, Array.prototype.slice.call(args)))
            return true;
    return false;
}

function run_hooks_until_failure(hook, args)
{
    if (hook == null)
        return true;
    for (let i = 0; i < hook.length; ++i)
        if (!hook[i].apply (null, Array.prototype.slice.call(args)))
            return false;
    return true;
}

var hook_type_doc_strings = [
    /* RUN_HOOK */
    "Each hook function added is run in sequence.",
    /* RUN_HOOK_UNTIL_SUCCESS */
    "Only boolean-valued hook functions may be added.  Each hook function added is run in sequence until a value that conerts to true is returned.",
    /* RUN_HOOK_UNTIL_FAILURE */
    "Only boolean-valued hook functions may be added.  Each hook function added is run in sequence until a value that conerts to false is returned."];


/* This should only be used by define_hook functions */
function initialize_hook(prototype, hook_name, hook_type, doc_string, extra_doc_string)
{
    var h = this[hook_name];
    if (h == null)
        h = this[hook_name] = [];
    if (hook_type == null)
        hook_type = RUN_HOOK;
    switch (hook_type) {
    case RUN_HOOK:
        h.run = prototype.run;
        break;
    case RUN_HOOK_UNTIL_SUCCESS:
        h.run = prototype.run_until_success;
        break;
    case RUN_HOOK_UNTIL_FAILURE:
        h.run = prototype.run_until_failure;
        break;
    }
    h.hook_type = hook_type;
    h.hook_name = hook_name;
    h.doc_string =
        (doc_string? doc_string + "\n" : "") +
        hook_type_doc_strings[hook_type] +
        (extra_doc_string? "\n" + extra_doc_string : "");
    h.source_code_reference = get_caller_source_code_reference(1);
    return h;
}

var hook_global_prototype = {
    run: function() {
        run_hooks(this, arguments);
    },
    run_until_success: function() {
        return run_hooks_until_success(this, arguments);
    },
    run_until_failure: function() {
        return run_hooks_until_failure(this, arguments);
    }
};

const RUN_HOOK = 0;
const RUN_HOOK_UNTIL_SUCCESS = 1;
const RUN_HOOK_UNTIL_FAILURE = 2;

function define_hook(hook_name, hook_type, doc_string)
{
    initialize_hook(hook_global_prototype, hook_name, hook_type, doc_string);
}

var hook_simple_local_prototype = {
    run: function(x) {
        var hook_name = this.hook_name;
        if (hook_name in x) run_hooks(x[hook_name], arguments);
        run_hooks(this, arguments);
    },
    run_until_success: function (x) {
        var hook_name = this.hook_name;
        if ((hook_name in x) && run_hooks_until_success(x[hook_name], arguments)) return true;
            return run_hooks_until_success(conkeror[hook_name], arguments);
    },
    run_until_failure: function (x) {
        var hook_name = this.hook_name;
        if ((hook_name in x) && !run_hooks_until_success(x[hook_name], arguments)) return false;
        return run_hooks_until_failure(conkeror[hook_name], arguments);
    }
};

function simple_local_hook_definer(extra_doc_string) {
    return function (hook_name, hook_type, doc_string) {
        initialize_hook(hook_simple_local_prototype, hook_name, hook_type, doc_string, extra_doc_string);
    }
}

/* This function is called with a variable number of string arguments
 * in addition to the first, that specify the additional hook arrays
 * to use.  As an example: local_hook_definer("buffer", "buffer", "buffer.window")
 */
function local_hook_definer(prop_name, extra_doc_string) {
    var prototype = {
        run: function(x) {
            var hook_name = this.hook_name;
            if (hook_name in x) run_hooks(x[hook_name], arguments);
            if (hook_name in x[prop_name]) run_hooks(x[prop_name][hook_name], arguments);
            run_hooks(this, arguments);
        },
        run_until_success: function (x) {
            var hook_name = this.hook_name;
            if ((hook_name in x) && run_hooks_until_success(x[hook_name], arguments)) return true;
            if ((hook_name in x[prop_name]) && run_hooks_until_success(x[prop_name][hook_name], arguments)) return true;
            return run_hooks_until_success(conkeror[hook_name], arguments);
        },
        run_until_failure: function (x) {
            var hook_name = this.hook_name;
            if ((hook_name in x) && !run_hooks_until_success(x[hook_name], arguments)) return false;
            if ((hook_name in x[prop_name]) && !run_hooks_until_success(x[prop_name][hook_name], arguments)) return false;
            return run_hooks_until_failure(conkeror[hook_name], arguments);
        }
    };
    return function (hook_name, hook_type, doc_string) {
        initialize_hook(prototype, hook_name, hook_type, doc_string, extra_doc_string);
    }
}

function remove_hook(hook_name, func)
{
    var hook = this[hook_name];
    var index;
    if (hook && (index = hook.indexOf(func)) != -1)
        hook.splice(index, 1);
}
