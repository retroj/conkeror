/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

define_keymap("universal_argument_keymap");

for (var i = 0; i <= 9; ++i)
    define_key(universal_argument_keymap, String(i), null, $hook = universal_digit);
define_key(universal_argument_keymap, "subtract", null, $hook = universal_negate);

function universal_argument(ctx)
{
    if (ctx.prefix_argument) {
        if (typeof(ctx.prefix_argument) == "object") // must be array
            ctx.prefix_argument = [ctx.prefix_argument[0] * 4];
    } else
        ctx.prefix_argument = [4];
    ctx.overlay_keymap = universal_argument_keymap;
}

function universal_digit(ctx)
{
    var digit = ctx.event.charCode - 48;
    if (ctx.prefix_argument == null)
        ctx.prefix_argument = digit;
    else if (typeof(ctx.prefix_argument) == "object") { // array
        if (ctx.prefix_argument[0] < 0)
            ctx.prefix_argument = -digit;
        else
            ctx.prefix_argument = digit;
    }
    else if (ctx.prefix_argument < 0)
        ctx.prefix_argument = ctx.prefix_argument * 10 - digit;
    else
        ctx.prefix_argument = ctx.prefix_argument * 10 + digit;
}

function universal_negate(ctx)
{
    if (typeof ctx.prefix_argument == "object")
        ctx.prefix_argument[0] = 0 - ctx.prefix_argument[0];
    else
        ctx.prefix_argument = 0 - ctx.prefix_argument;
}

function bind_universal_argument(keymap, key) {
    define_key(keymap, key, null, $hook = universal_argument);
}
