
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
    for (var i = 0; i < hook.length; ++i)
        hook[i].apply (null, Array.prototype.slice.call(args));
}

/* This should only be used by define_hook functions */
function initialize_hook(hook_name)
{
    if (this[hook_name] == null)
        this[hook_name] = [];
    return this[hook_name];
}

function define_hook(hook_name)
{
    initialize_hook(hook_name).run = function () {
        run_hooks(this, arguments);
    };
}

function remove_hook(hook_name, func)
{
    var hook = this[hook_name];
    var index;
    if (hook && (index = hook.indexOf(func)) != -1)
        hook.splice(index, 1);
}
