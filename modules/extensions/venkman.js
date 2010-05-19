/**
 * (C) Copyright 2010 Dave Kerschner
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
 *
 * venkman.js
 *
 * glue code between venkman and conkeror
 */

in_module(null);

function open_venkman () {
    make_chrome_window("chrome://venkman/content/venkman.xul");
}

interactive("venkman",
    "Open the Venkman Javascript Debugger in a new window.",
    open_venkman);

provide("venkman");
