/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

function pretty_print_value (value) {
    if (value === undefined)
        return "undefined";
    if (value === null)
        return "null";
    if (typeof(value) == "object")
        return value.toSource();
    if (typeof(value) == "function")
        return value.toString();
    if (typeof(value) == "string") {
        let s = value.toSource();
        // toSource returns: (new String("<blah>"))
        // we want just: "<blah>"
        return s.substring(12, s.length - 2);
    }
    return new String(value);
}

function pretty_print_file_size (val) {
    const GIBI = 1073741824; /* 2^30 */
    const MEBI = 1048576; /* 2^20 */
    const KIBI = 1024; /* 2^10 */
    var suffix, div;
    if (val < KIBI) {
        div = 1;
        suffix = "B";
    } else if (val < MEBI) {
        suffix = "KiB";
        div = KIBI;
    } else if (val < GIBI) {
        suffix = "MiB";
        div = MEBI;
    } else {
        suffix = "GiB";
        div = GIBI;
    }
    val = val / div;
    var precision = 2;
    if (val > 10)
        precision = 1;
    if (val > 100)
        precision = 0;
    return [val.toFixed(precision), suffix];
}

function pretty_print_time (val) {
    val = Math.round(val);
    var seconds = val % 60;
    val = Math.floor(val / 60);
    var minutes = val % 60;
    var hours = Math.floor(val / 60);
    var parts = [];

    if (hours > 1)
        parts.push(hours + " hours");
    else if (hours == 1)
        parts.push("1 hour");

    if (minutes > 1)
        parts.push(minutes + " minutes");
    else if (minutes == 1)
        parts.push("1 minute");

    if (minutes <= 1 && hours == 0) {
        if (seconds != 1)
            parts.push(seconds + " seconds");
        else
            parts.push("1 second");
    }

    return parts.join(", ");
}

provide("pretty-print");
