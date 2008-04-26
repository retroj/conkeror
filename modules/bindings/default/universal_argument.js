/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

define_keymap("universal_argument_keymap");

for (var i = 0; i <= 9; ++i)
    define_key(universal_argument_keymap, String(i), universal_argument_keymap, $hook = universal_digit);
define_key(universal_argument_keymap, "subtract", universal_argument_keymap, $hook = universal_negate);

function universal_argument(ctx, active_keymap, overlay_keymap, top_keymap)
{
    if (ctx.prefix_argument) {
        if (typeof(ctx.prefix_argument) == "object") // must be array
            ctx.prefix_argument = [ctx.prefix_argument[0] * 4];
    } else
        ctx.prefix_argument = [4];
    ctx.overlay_keymap = top_keymap;
}

function universal_digit(ctx, active_keymap, overlay_keymap)
{
    var digit = ctx.event.charCode - 48;
    if (typeof(ctx.prefix_argument) == "object") { // array
        if (ctx.prefix_argument[0] < 0)
            ctx.prefix_argument = -digit;
        else
            ctx.prefix_argument = digit;
    }
    else if (ctx.prefix_argument < 0)
        ctx.prefix_argument = ctx.prefix_argument * 10 - digit;
    else
        ctx.prefix_argument = ctx.prefix_argument * 10 + digit;

    ctx.overlay_keymap = overlay_keymap || active_keymap;
}

function universal_negate(ctx, active_keymap, overlay_keymap)
{
    if (typeof ctx.prefix_argument == "object")
        ctx.prefix_argument[0] = 0 - ctx.prefix_argument[0];
    else
        ctx.prefix_argument = 0 - ctx.prefix_argument;
    ctx.overlay_keymap = overlay_keymap || active_keymap;
}

function bind_universal_argument(keymap, key) {
    define_key(keymap, key, universal_argument_keymap, $hook = universal_argument);
}
