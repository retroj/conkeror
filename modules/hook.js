/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 * (C) Copyright 2010 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

require("coroutine.js");

/* Adds the specified function to the specified hook.  To add a local
 * hook, invoke this function as:  add_hook.call(context, hook_name, ...).
 * Note: hook_name must be a string */
function add_hook (hook_name, func, prepend) {
    if (!(hook_name in this))
        this[hook_name] = [];
    var hook = this[hook_name];

    if (hook.indexOf(func) != -1)
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
function run_hooks (hook, args) {
    if (hook == null)
        return;
    for (let i = 0, hlen = hook.length; i < hlen; ++i)
        hook[i].apply(null, Array.prototype.slice.call(args));
}

function run_hooks_until_success (hook, args) {
    if (hook == null)
        return false;
    for (let i = 0, hlen = hook.length; i < hlen; ++i)
        if (hook[i].apply(null, Array.prototype.slice.call(args)))
            return true;
    return false;
}

function run_hooks_until_failure (hook, args) {
    if (hook == null)
        return true;
    for (let i = 0, hlen = hook.length; i < hlen; ++i)
        if (!hook[i].apply(null, Array.prototype.slice.call(args)))
            return false;
    return true;
}

function run_coroutine_hooks (hook, args) {
    if (hook == null)
        yield co_return();
    for (let i = 0, hlen = hook.length; i < hlen; ++i)
        yield hook[i].apply(null, Array.prototype.slice.call(args));
}

function run_coroutine_hooks_until_success (hook, args) {
    if (hook == null)
        yield co_return(false);
    for (let i = 0, hlen = hook.length; i < hlen; ++i)
        if ((yield hook[i].apply(null, Array.prototype.slice.call(args))))
            yield co_return(true);
    yield co_return(false);
}

function run_coroutine_hooks_until_failure (hook, args) {
    if (hook == null)
        yield co_return(true);
    for (let i = 0, hlen = hook.length; i < hlen; ++i)
        if (!(yield hook[i].apply(null, Array.prototype.slice.call(args))))
            yield co_return(false);
    yield co_return(true);
}


const RUN_HOOK = 'RUN_HOOK';
const RUN_HOOK_UNTIL_SUCCESS = 'RUN_HOOK_UNTIL_SUCCESS';
const RUN_HOOK_UNTIL_FAILURE = 'RUN_HOOK_UNTIL_FAILURE';


/* This should only be used by define_hook functions */
function initialize_hook (run, hook_name, hook_type, doc_string, extra_doc_string) {
    var docstrings = {
        RUN_HOOK: "Each hook function is run in sequence.",
        RUN_HOOK_UNTIL_SUCCESS:
        "Each hook function is run in sequence until one returns a "+
            "logically true value.",
        RUN_HOOK_UNTIL_FAILURE:
        "Each hook function is run in sequence until one returns a "+
            "logically false value.  If no function returns such a "+
            "value, then the result of the hook will be `true'."
    };
    var h = this[hook_name];
    if (h == null)
        h = this[hook_name] = [];
    if (hook_type == null)
        hook_type = RUN_HOOK;
    h.run = run;
    h.hook_type = hook_type;
    h.hook_name = hook_name;
    h.doc_string =
        (doc_string? doc_string + "\n" : "") +
        docstrings[hook_type] +
        (extra_doc_string? "\n" + extra_doc_string : "");
    h.source_code_reference = get_caller_source_code_reference(1);
    return h;
}

function define_hook (hook_name, hook_type, doc_string) {
    const prototype = {
        RUN_HOOK: function () {
            run_hooks(this, arguments);
        },
        RUN_HOOK_UNTIL_SUCCESS: function () {
            return run_hooks_until_success(this, arguments);
        },
        RUN_HOOK_UNTIL_FAILURE: function () {
            return run_hooks_until_failure(this, arguments);
        }
    };
    initialize_hook(prototype[hook_type || RUN_HOOK],
                    hook_name, hook_type, doc_string);
}

function define_coroutine_hook (hook_name, hook_type, doc_string) {
    const prototype = {
        RUN_HOOK: function () {
            yield run_coroutine_hooks(this, arguments);
        },
        RUN_HOOK_UNTIL_SUCCESS: function () {
            var result = yield run_coroutine_hooks_until_success(this, arguments);
            yield co_return(result);
        },
        RUN_HOOK_UNTIL_FAILURE: function () {
            var result = yield run_coroutine_hooks_until_failure(this, arguments);
            yield co_return(result);
        }
    };
    initialize_hook(prototype[hook_type || RUN_HOOK],
                    hook_name, hook_type, doc_string);
}

function simple_local_hook_definer (extra_doc_string) {
    const prototype = {
        RUN_HOOK: function (x) {
            var hook_name = this.hook_name;
            if (hook_name in x)
                run_hooks(x[hook_name], arguments);
            run_hooks(this, arguments);
        },
        RUN_HOOK_UNTIL_SUCCESS: function (x) {
            var hook_name = this.hook_name;
            if ((hook_name in x) && run_hooks_until_success(x[hook_name], arguments))
                return true;
            return run_hooks_until_success(conkeror[hook_name], arguments);
        },
        RUN_HOOK_UNTIL_FAILURE: function (x) {
            var hook_name = this.hook_name;
            if ((hook_name in x) && !run_hooks_until_success(x[hook_name], arguments))
                return false;
            return run_hooks_until_failure(conkeror[hook_name], arguments);
        }
    };
    return function (hook_name, hook_type, doc_string) {
        initialize_hook(prototype[hook_type || RUN_HOOK],
                        hook_name, hook_type, doc_string,
                        extra_doc_string);
    };
}

function simple_local_coroutine_hook_definer (extra_doc_string) {
    const prototype = {
        RUN_HOOK: function (x) {
            var hook_name = this.hook_name;
            if (hook_name in x)
                yield run_coroutine_hooks(x[hook_name], arguments);
            yield run_coroutine_hooks(this, arguments);
        },
        RUN_HOOK_UNTIL_SUCCESS: function (x) {
            var hook_name = this.hook_name;
            if ((hook_name in x) &&
                (yield run_coroutine_hooks_until_success(x[hook_name], arguments)))
            {
                yield co_return(true);
            }
            var result = yield run_coroutine_hooks_until_success(conkeror[hook_name], arguments);
            yield co_return(result);
        },
        RUN_HOOK_UNTIL_FAILURE: function (x) {
            var hook_name = this.hook_name;
            if ((hook_name in x) &&
                !(yield run_coroutine_hooks_until_success(x[hook_name], arguments)))
            {
                yield co_return(false);
            }
            var result = yield run_coroutine_hooks_until_failure(conkeror[hook_name], arguments);
            yield co_return(result);
        }
    };
    return function (hook_name, hook_type, doc_string) {
        initialize_hook(prototype[hook_type || RUN_HOOK],
                        hook_name, hook_type, doc_string,
                        extra_doc_string);
    };
}

function local_hook_definer (prop_name, extra_doc_string) {
    const prototype = {
        RUN_HOOK: function (x) {
            var hook_name = this.hook_name;
            if (hook_name in x)
                run_hooks(x[hook_name], arguments);
            if (hook_name in x[prop_name])
                run_hooks(x[prop_name][hook_name], arguments);
            run_hooks(this, arguments);
        },
        RUN_HOOK_UNTIL_SUCCESS: function (x) {
            var hook_name = this.hook_name;
            if ((hook_name in x) && run_hooks_until_success(x[hook_name], arguments))
                return true;
            if ((hook_name in x[prop_name]) && run_hooks_until_success(x[prop_name][hook_name], arguments))
                return true;
            return run_hooks_until_success(conkeror[hook_name], arguments);
        },
        RUN_HOOK_UNTIL_FAILURE: function (x) {
            var hook_name = this.hook_name;
            if ((hook_name in x) && !run_hooks_until_success(x[hook_name], arguments))
                return false;
            if ((hook_name in x[prop_name]) && !run_hooks_until_success(x[prop_name][hook_name], arguments))
                return false;
            return run_hooks_until_failure(conkeror[hook_name], arguments);
        }
    };
    return function (hook_name, hook_type, doc_string) {
        initialize_hook(prototype[hook_type || RUN_HOOK],
                        hook_name, hook_type, doc_string,
                        extra_doc_string);
    };
}

function local_coroutine_hook_definer (prop_name, extra_doc_string) {
    const prototype = {
        RUN_HOOK: function (x) {
            var hook_name = this.hook_name;
            if (hook_name in x)
                yield run_coroutine_hooks(x[hook_name], arguments);
            if (hook_name in x[prop_name])
                yield run_coroutine_hooks(x[prop_name][hook_name], arguments);
            yield run_coroutine_hooks(this, arguments);
        },
        RUN_HOOK_UNTIL_SUCCESS: function (x) {
            var hook_name = this.hook_name;
            if ((hook_name in x) &&
                (yield run_coroutine_hooks_until_success(x[hook_name], arguments)))
            {
                yield co_return(true);
            }
            if ((hook_name in x[prop_name]) &&
                (yield run_coroutine_hooks_until_success(x[prop_name][hook_name], arguments)))
            {
                yield co_return(true);
            }
            var result = yield run_coroutine_hooks_until_success(conkeror[hook_name], arguments);
            yield co_return(result);
        },
        RUN_HOOK_UNTIL_FAILURE: function (x) {
            var hook_name = this.hook_name;
            if ((hook_name in x) &&
                !(yield run_coroutine_hooks_until_success(x[hook_name], arguments)))
            {
                yield co_return(false);
            }
            if ((hook_name in x[prop_name]) &&
                !(yield run_coroutine_hooks_until_success(x[prop_name][hook_name], arguments)))
            {
                yield co_return(false);
            }
            var result = yield run_coroutine_hooks_until_failure(conkeror[hook_name], arguments);
            yield co_return(result);
        }
    };
    return function (hook_name, hook_type, doc_string) {
        initialize_hook(prototype[hook_type || RUN_HOOK],
                        hook_name, hook_type, doc_string,
                        extra_doc_string);
    };
}

function remove_hook (hook_name, func) {
    var hook = this[hook_name];
    var index;
    if (hook && (index = hook.indexOf(func)) != -1)
        hook.splice(index, 1);
}

provide("hook");
