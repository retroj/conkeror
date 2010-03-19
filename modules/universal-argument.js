/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 * (C) Copyright 2008 John Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

define_keymap("universal_argument_keymap");

interactive("universal-argument",
    "Begin a numeric argument for the following command.",
    function (I) {
        if (I.prefix_argument) {
            if (typeof I.prefix_argument == "object") // must be array
                I.prefix_argument = [I.prefix_argument[0] * 4];
        } else
            I.prefix_argument = [4];
        I.overlay_keymap = universal_argument_keymap;
    },
    $prefix = true);

interactive("universal-digit",
    "Part of the numeric argument for the next command.",
    function (I) {
        var digit = I.event.charCode - 48;
        if (I.prefix_argument == null)
            I.prefix_argument = digit;
        else if (typeof I.prefix_argument == "object") { // array
            if (I.prefix_argument[0] < 0)
                I.prefix_argument = -digit;
            else
                I.prefix_argument = digit;
        }
        else if (I.prefix_argument < 0)
            I.prefix_argument = I.prefix_argument * 10 - digit;
        else
            I.prefix_argument = I.prefix_argument * 10 + digit;
    },
    $prefix = true);

interactive("universal-negate",
    "Part of the numeric argument for the next command.  "+
    "This command negates the numeric argument.",
    function universal_negate (I) {
        if (typeof I.prefix_argument == "object")
            I.prefix_argument[0] = 0 - I.prefix_argument[0];
        else
            I.prefix_argument = 0 - I.prefix_argument;
    },
    $prefix = true);

provide("universal-argument");
